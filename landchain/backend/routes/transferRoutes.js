const express = require("express");
const Notification = require("../models/Notification");
const Property = require("../models/Property");
const Transfer = require("../models/Transfer");
const User = require("../models/User");
const {
  createGenesisNode,
  createTransferNode,
  getChain,
} = require("../services/blockchainService");

const router = express.Router();

async function createNotification(data) {
  return Notification.create(data);
}

async function createNotifications(entries) {
  if (!entries.length) {
    return [];
  }

  return Notification.insertMany(entries);
}

async function findTransferOr404(transferId, res) {
  const transfer = await Transfer.findOne({ transferId });

  if (!transfer) {
    res.status(404).json({ error: "Transfer not found" });
    return null;
  }

  return transfer;
}

router.post("/initiate", async (req, res) => {
  try {
    const {
      sellerUserId,
      ulpin,
      agreementConditions,
      price,
      buyerUserId,
      geminiSummary,
      flags,
    } = req.body;

    const property = await Property.findOne({ ulpin });

    if (!property) {
      return res.status(404).json({ error: "Property record not found. Fetch the property first." });
    }

    if (property.ownerUserId !== sellerUserId) {
      return res.status(403).json({ error: "Only the current property owner can initiate a transfer." });
    }

    const hasPendingTax = (property.taxRecords || []).some(
      (record) => String(record.status).toLowerCase() === "unpaid"
    );

    if (hasPendingTax) {
      await createNotification({
        userId: sellerUserId,
        type: "STATUS_UPDATE",
        title: "Transfer Blocked",
        message: `Transfer declined for ${ulpin}: pending property tax dues must be cleared first.`,
      });

      return res.status(400).json({
        error: "Transfer declined: pending property tax dues must be cleared first.",
      });
    }

    const sellerUser = await User.findOne({ userId: sellerUserId });
    const buyerUser = await User.findOne({ userId: buyerUserId });

    if (!buyerUser) {
      return res.status(404).json({ error: "Buyer User ID not found." });
    }

    const transfer = await Transfer.create({
      sellerUserId,
      sellerName: sellerUser ? sellerUser.name : sellerUserId,
      ulpin,
      agreementConditions,
      price,
      buyerUserId,
      buyerName: buyerUser ? buyerUser.name : buyerUserId,
      geminiSummary,
      flags,
      status: "DRAFT",
    });

    await createNotifications([
      {
        userId: sellerUserId,
        type: "STATUS_UPDATE",
        title: "Transfer Initiated",
        message: `Transfer initiated for ${ulpin}`,
        transferId: transfer.transferId,
      },
      {
        userId: buyerUserId,
        type: "DEED_RECEIVED",
        title: "New Property Offer",
        message: `New property offer from ${sellerUserId}`,
        transferId: transfer.transferId,
      },
    ]);

    return res.status(201).json({
      transferId: transfer.transferId,
      status: transfer.status,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to initiate transfer" });
  }
});

router.post("/seller-sign", async (req, res) => {
  try {
    const { transferId } = req.body;
    const transfer = await findTransferOr404(transferId, res);

    if (!transfer) {
      return;
    }

    transfer.sellerSignature = {
      signed: true,
      timestamp: new Date(),
    };
    transfer.status = "SENT";
    await transfer.save();

    return res.json({
      transferId: transfer.transferId,
      status: transfer.status,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to sign transfer as seller" });
  }
});

router.post("/buyer-sign", async (req, res) => {
  try {
    const { transferId } = req.body;
    const transfer = await findTransferOr404(transferId, res);

    if (!transfer) {
      return;
    }

    transfer.buyerSignature = {
      signed: true,
      timestamp: new Date(),
    };
    transfer.status = "REGISTRAR_REVIEW";
    await transfer.save();

    await createNotification({
      userId: transfer.sellerUserId,
      type: "STATUS_UPDATE",
      title: "Buyer Signed",
      message: "Buyer signed. Sent to Registrar.",
      transferId: transfer.transferId,
    });

    console.log("[LandChain] EMAIL MOCK: Agreement sent to registrar@gov.in");

    return res.json({
      transferId: transfer.transferId,
      status: transfer.status,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to sign transfer as buyer" });
  }
});

router.post("/buyer-decline", async (req, res) => {
  try {
    const { transferId } = req.body;
    const transfer = await findTransferOr404(transferId, res);

    if (!transfer) {
      return;
    }

    transfer.status = "DRAFT";
    await transfer.save();

    await createNotification({
      userId: transfer.sellerUserId,
      type: "STATUS_UPDATE",
      title: "Buyer Declined",
      message: "Buyer declined the agreement.",
      transferId: transfer.transferId,
    });

    return res.json({
      transferId: transfer.transferId,
      status: transfer.status,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to decline transfer as buyer" });
  }
});

router.post("/registrar-approve", async (req, res) => {
  try {
    const { transferId } = req.body;
    const transfer = await findTransferOr404(transferId, res);

    if (!transfer) {
      return;
    }

    transfer.registrarAction = {
      approved: true,
      timestamp: new Date(),
      comment: "",
    };
    transfer.status = "PANCHAYAT_REVIEW";
    await transfer.save();

    await createNotifications([
      {
        userId: transfer.sellerUserId,
        type: "STATUS_UPDATE",
        title: "Registrar Approved",
        message: "Registrar approved. Sent to Panchayat.",
        transferId: transfer.transferId,
      },
      {
        userId: transfer.buyerUserId,
        type: "STATUS_UPDATE",
        title: "Registrar Approved",
        message: "Registrar approved. Sent to Panchayat.",
        transferId: transfer.transferId,
      },
    ]);

    return res.json({
      transferId: transfer.transferId,
      status: transfer.status,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to approve transfer as registrar" });
  }
});

router.post("/registrar-decline", async (req, res) => {
  try {
    const { transferId, comment } = req.body;
    const transfer = await findTransferOr404(transferId, res);

    if (!transfer) {
      return;
    }

    transfer.registrarAction = {
      approved: false,
      timestamp: new Date(),
      comment,
    };
    transfer.status = "REGISTRAR_DECLINED";
    await transfer.save();

    await createNotifications([
      {
        userId: transfer.sellerUserId,
        type: "STATUS_UPDATE",
        title: "Registrar Declined",
        message: `Registrar declined: ${comment}`,
        transferId: transfer.transferId,
      },
      {
        userId: transfer.buyerUserId,
        type: "STATUS_UPDATE",
        title: "Registrar Declined",
        message: `Registrar declined: ${comment}`,
        transferId: transfer.transferId,
      },
    ]);

    return res.json({
      transferId: transfer.transferId,
      status: transfer.status,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to decline transfer as registrar" });
  }
});

router.post("/panchayat-approve", async (req, res) => {
  try {
    const { transferId } = req.body;
    const transfer = await findTransferOr404(transferId, res);

    if (!transfer) {
      return;
    }

    transfer.panchayatAction = {
      approved: true,
      timestamp: new Date(),
      comment: "",
    };
    transfer.status = "PAYMENT_PENDING";
    await transfer.save();

    await createNotifications([
      {
        userId: transfer.sellerUserId,
        type: "STATUS_UPDATE",
        title: "Panchayat Approved",
        message: "Panchayat approved. Proceed to payment.",
        transferId: transfer.transferId,
      },
      {
        userId: transfer.buyerUserId,
        type: "STATUS_UPDATE",
        title: "Panchayat Approved",
        message: "Panchayat approved. Proceed to payment.",
        transferId: transfer.transferId,
      },
    ]);

    return res.json({
      transferId: transfer.transferId,
      status: transfer.status,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to approve transfer as panchayat" });
  }
});

router.post("/panchayat-decline", async (req, res) => {
  try {
    const { transferId, comment } = req.body;
    const transfer = await findTransferOr404(transferId, res);

    if (!transfer) {
      return;
    }

    transfer.panchayatAction = {
      approved: false,
      timestamp: new Date(),
      comment,
    };
    transfer.status = "PANCHAYAT_DECLINED";
    await transfer.save();

    await createNotifications([
      {
        userId: transfer.sellerUserId,
        type: "STATUS_UPDATE",
        title: "Panchayat Declined",
        message: `Panchayat declined: ${comment}`,
        transferId: transfer.transferId,
      },
      {
        userId: transfer.buyerUserId,
        type: "STATUS_UPDATE",
        title: "Panchayat Declined",
        message: `Panchayat declined: ${comment}`,
        transferId: transfer.transferId,
      },
    ]);

    return res.json({
      transferId: transfer.transferId,
      status: transfer.status,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to decline transfer as panchayat" });
  }
});

router.post("/payment", async (req, res) => {
  try {
    const { transferId, paymentRef } = req.body;
    const transfer = await findTransferOr404(transferId, res);

    if (!transfer) {
      return;
    }

    if (transfer.status === "COMPLETED") {
      return res.json({
        transferId: transfer.transferId,
        status: transfer.status,
        blockchainNodeId: transfer.blockchainNodeId,
      });
    }

    if (transfer.status !== "PAYMENT_PENDING") {
      return res.status(400).json({ error: "Transfer is not ready for payment." });
    }

    let property = await Property.findOne({ ulpin: transfer.ulpin });

    if (!property) {
      property = await Property.create({
        ulpin: transfer.ulpin,
        ownerUserId: transfer.sellerUserId,
        area: transfer.geminiSummary?.landDetails?.area || "",
        type: transfer.geminiSummary?.landDetails?.type || "Agricultural",
        location: transfer.geminiSummary?.landDetails?.location || "",
        village: transfer.geminiSummary?.landDetails?.location || "",
        taluk: "",
        district: "",
      });
    }

    const chain = await getChain(transfer.ulpin);
    if (!chain.length) {
      await createGenesisNode(transfer.ulpin, transfer.sellerUserId);
    }

    const node = await createTransferNode(
      transfer.ulpin,
      transfer.sellerUserId,
      transfer.buyerUserId,
      transfer.transferId
    );

    property.ownerUserId = transfer.buyerUserId;
    await property.save();

    transfer.paymentRef = paymentRef;
    transfer.status = "COMPLETED";
    transfer.blockchainNodeId = node.nodeId;
    await transfer.save();

    await createNotifications([
      {
        userId: transfer.sellerUserId,
        type: "STATUS_UPDATE",
        title: "Transfer Completed",
        message: "Transfer complete. Blockchain record created.",
        transferId: transfer.transferId,
      },
      {
        userId: transfer.buyerUserId,
        type: "STATUS_UPDATE",
        title: "Transfer Completed",
        message: "Transfer complete. Blockchain record created.",
        transferId: transfer.transferId,
      },
    ]);

    return res.json({
      transferId: transfer.transferId,
      status: transfer.status,
      blockchainNodeId: transfer.blockchainNodeId,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to complete transfer payment" });
  }
});

router.get("/", async (req, res) => {
  try {
    const transfers = await Transfer.find().sort({ createdAt: -1 });
    return res.json(transfers);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch transfers" });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const transfers = await Transfer.find({
      $or: [{ sellerUserId: userId }, { buyerUserId: userId }],
    }).sort({ createdAt: -1 });

    return res.json(transfers);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch user transfers" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const transfer = await Transfer.findOne({ transferId: req.params.id });

    if (!transfer) {
      return res.status(404).json({ error: "Transfer not found" });
    }

    return res.json(transfer);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch transfer" });
  }
});

module.exports = router;
