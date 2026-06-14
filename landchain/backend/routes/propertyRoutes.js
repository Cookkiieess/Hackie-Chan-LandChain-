const express = require("express");
const Property = require("../models/Property");
const User = require("../models/User");
const Transfer = require("../models/Transfer");
const Notification = require("../models/Notification");
const BlockchainNode = require("../models/BlockchainNode");
const { createGenesisNode, getChain, createSplitGenesisNode, getOwnershipHistory, getUlpinVariants } = require("../services/blockchainService");
const { analyzeProperty } = require("../services/geminiService");

const router = express.Router();

function getRevenueDept(ulpin) {
  const normalizedUlpin = String(ulpin || "").toUpperCase().trim();
  const data = {
    ownerName: "Ramesh Kumar",
    surveyNumber: "142/3B",
    area: "2.4 acres",
    landType: "Agricultural",
    village: "Hosahalli",
    taluk: "Mangaluru",
    district: "Dakshina Kannada",
    state: "Karnataka",
    previousOwners: [],
    taxStatus: "Paid up to 2024-25",
    ulpin: normalizedUlpin,
  };

  const parts = normalizedUlpin.split("-");
  if (parts.length >= 3) {
    data.surveyNumber = parts.slice(2).join("/");
  }

  // Set owner name and previousOwners defaults based on ULPIN ranges
  if (normalizedUlpin.startsWith("KA-MNG-21") || normalizedUlpin.includes("201") || normalizedUlpin.includes("202") || normalizedUlpin.includes("203")) {
    data.ownerName = "Suresh Patil";
  } else if (normalizedUlpin.startsWith("KA-MNG-31") || normalizedUlpin.includes("301") || normalizedUlpin.includes("302") || normalizedUlpin.includes("303")) {
    data.ownerName = "Deepak Gowda";
  }

  // Pre-seed some area defaults
  if (normalizedUlpin === "KA-MNG-142-3B") {
    data.area = "2.4 acres";
  } else if (normalizedUlpin === "KA-MNG-111-DIV1") {
    data.area = "2.0 acres";
  } else if (normalizedUlpin === "KA-MNG-112-DIV2") {
    data.area = "3.0 acres";
  } else if (normalizedUlpin === "KA-MNG-211-DIV1") {
    data.area = "4.0 acres";
  } else if (normalizedUlpin === "KA-MNG-212-DIV2") {
    data.area = "2.4 acres";
  } else if (normalizedUlpin === "KA-MNG-311-DIV1") {
    data.area = "1.6 acres";
  } else if (normalizedUlpin === "KA-MNG-312-DIV2") {
    data.area = "5.0 acres";
  } else if (normalizedUlpin === "KA-MNG-313-DIV3") {
    data.area = "3.0 acres";
  } else if (normalizedUlpin === "KA-MNG-101-R1") {
    data.area = "1.5 acres";
  } else if (normalizedUlpin === "KA-MNG-102-R2") {
    data.area = "0.8 acres";
    data.landType = "Residential";
  } else if (normalizedUlpin === "KA-MNG-103-R3") {
    data.area = "2.0 acres";
    data.landType = "Commercial";
  } else if (normalizedUlpin === "KA-MNG-201-S1") {
    data.area = "3.0 acres";
  } else if (normalizedUlpin === "KA-MNG-202-S2") {
    data.area = "1.1 acres";
    data.landType = "Residential";
  } else if (normalizedUlpin === "KA-MNG-203-S3") {
    data.area = "0.5 acres";
    data.landType = "Residential";
  } else if (normalizedUlpin === "KA-MNG-301-D1") {
    data.area = "2.2 acres";
  } else if (normalizedUlpin === "KA-MNG-302-D2") {
    data.area = "0.7 acres";
    data.landType = "Residential";
  } else if (normalizedUlpin === "KA-MNG-303-D3") {
    data.area = "1.8 acres";
  } else if (normalizedUlpin.includes("/")) {
    data.area = "1.0 acres";
  }

  // Setup divisions list if divisible
  if (normalizedUlpin === "KA-MNG-142-3B") {
    data.divisions = [
      { ulpin: `${normalizedUlpin}/A`, area: "1.2 acres" },
      { ulpin: `${normalizedUlpin}/B`, area: "1.2 acres" },
    ];
  } else if (normalizedUlpin === "KA-MNG-111-DIV1") {
    data.divisions = [
      { ulpin: `${normalizedUlpin}/A`, area: "1.0 acres" },
      { ulpin: `${normalizedUlpin}/B`, area: "1.0 acres" },
    ];
  } else if (normalizedUlpin === "KA-MNG-112-DIV2") {
    data.divisions = [
      { ulpin: `${normalizedUlpin}/A`, area: "1.5 acres" },
      { ulpin: `${normalizedUlpin}/B`, area: "1.5 acres" },
    ];
  } else if (normalizedUlpin === "KA-MNG-211-DIV1") {
    data.divisions = [
      { ulpin: `${normalizedUlpin}/A`, area: "2.0 acres" },
      { ulpin: `${normalizedUlpin}/B`, area: "2.0 acres" },
    ];
  } else if (normalizedUlpin === "KA-MNG-212-DIV2") {
    data.divisions = [
      { ulpin: `${normalizedUlpin}/A`, area: "1.2 acres" },
      { ulpin: `${normalizedUlpin}/B`, area: "1.2 acres" },
    ];
  } else if (normalizedUlpin === "KA-MNG-311-DIV1") {
    data.divisions = [
      { ulpin: `${normalizedUlpin}/A`, area: "0.8 acres" },
      { ulpin: `${normalizedUlpin}/B`, area: "0.8 acres" },
    ];
  } else if (normalizedUlpin === "KA-MNG-312-DIV2") {
    data.divisions = [
      { ulpin: `${normalizedUlpin}/A`, area: "2.5 acres" },
      { ulpin: `${normalizedUlpin}/B`, area: "2.5 acres" },
    ];
  } else if (normalizedUlpin === "KA-MNG-313-DIV3") {
    data.divisions = [
      { ulpin: `${normalizedUlpin}/A`, area: "1.0 acres" },
      { ulpin: `${normalizedUlpin}/B`, area: "1.0 acres" },
      { ulpin: `${normalizedUlpin}/C`, area: "1.0 acres" },
    ];
  }

  return data;
}

function getKaveriData() {
  return {
    registrationHistory: [],
    encumbrances: "None",
    mortgageStatus: "Clear",
  };
}

function getCourtRecords() {
  return {
    litigationStatus: "Clear",
    pendingCases: [],
    attachmentOrders: "None",
    courtVerifiedOn: "15/01/2026",
  };
}

function getDefaultTaxRecords() {
  return [
    { year: 2022, amount: 4200, status: "Paid" },
    { year: 2023, amount: 4500, status: "Paid" },
    { year: 2024, amount: 4800, status: "Unpaid" },
  ];
}

async function ensurePropertyRecord({ ulpin, requesterUserId, revenueData }) {
  const variants = getUlpinVariants(ulpin);
  let property = await Property.findOne({ ulpin: { $in: variants } });
  const chain = await getChain(ulpin);

  if (!property && requesterUserId) {
    property = await Property.create({
      ulpin,
      ownerUserId: requesterUserId,
      area: revenueData.area,
      type: revenueData.landType,
      location: `${revenueData.village}, ${revenueData.taluk}, ${revenueData.district}`,
      village: revenueData.village,
      taluk: revenueData.taluk,
      district: revenueData.district,
      taxRecords: getDefaultTaxRecords(),
    });
  }

  // Ensure genesis node exists on the blockchain for this property
  const updatedChain = await getChain(ulpin);
  if (property && !updatedChain.length) {
    await createGenesisNode(ulpin, property.ownerUserId);
  }

  // Sync owner with latest node in the blockchain if it exists
  const finalChain = await getChain(ulpin);
  if (property && finalChain.length) {
    const latestNode = finalChain[finalChain.length - 1];
    if (latestNode?.COID && property.ownerUserId !== latestNode.COID) {
      property.ownerUserId = latestNode.COID;
      await property.save();
    }
  }

  return property;
}

router.post("/fetch", async (req, res) => {
  try {
    const { ulpin, requesterUserId } = req.body;

    const revenueData = getRevenueDept(ulpin);
    const kaveriData = getKaveriData(ulpin);
    const courtData = getCourtRecords(ulpin);
    const propertyRecord = await ensurePropertyRecord({
      ulpin,
      requesterUserId,
      revenueData,
    });

    const { registrationHistory, previousOwners } = await getOwnershipHistory(ulpin);
    kaveriData.registrationHistory = registrationHistory;
    revenueData.previousOwners = previousOwners;

    // Set dynamic owner name in revenueData based on propertyRecord
    if (propertyRecord) {
      const currentOwnerUser = await User.findOne({ userId: propertyRecord.ownerUserId });
      if (currentOwnerUser) {
        revenueData.ownerName = currentOwnerUser.name;
      } else {
        revenueData.ownerName = propertyRecord.ownerUserId;
      }
    }

    return res.json({
      ulpin,
      revenueData,
      kaveriData,
      courtData,
      propertyRecord,
    });
  } catch (error) {
    console.error("[LandChain] Error fetching property records:", error.message);
    return res.status(500).json({ error: "Failed to fetch property records" });
  }
});

router.post("/analyze", async (req, res) => {
  try {
    const { combinedData } = req.body;
    const geminiSummary = await analyzeProperty(combinedData);

    return res.json({ geminiSummary });
  } catch (error) {
    return res.status(500).json({ error: "Failed to analyze property records" });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const allProperties = await Property.find().sort({
      createdAt: -1,
    });
    const syncedProperties = [];

    for (const property of allProperties) {
      const chain = await getChain(property.ulpin);
      if (chain.length) {
        const latestNode = chain[chain.length - 1];
        if (latestNode?.COID && property.ownerUserId !== latestNode.COID) {
          property.ownerUserId = latestNode.COID;
          await property.save();
        }
      }
      syncedProperties.push(property);
    }

    const properties = syncedProperties.filter(
      (property) => property.ownerUserId === req.params.userId
    );

    return res.json(properties);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch user properties" });
  }
});

router.get("/:ulpin(*)", async (req, res) => {
  try {
    const variants = getUlpinVariants(req.params.ulpin);
    const property = await Property.findOne({ ulpin: { $in: variants } });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    return res.json(property);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch property" });
  }
});

router.put("/:ulpin(*)/tax/pay", async (req, res) => {
  try {
    const { year } = req.body;
    const variants = getUlpinVariants(req.params.ulpin);
    const property = await Property.findOne({ ulpin: { $in: variants } });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const targetRecord = property.taxRecords.find((record) => Number(record.year) === Number(year));

    if (!targetRecord) {
      return res.status(404).json({ error: "Tax record not found" });
    }

    targetRecord.status = "Paid";
    await property.save();

    return res.json(property);
  } catch (error) {
    return res.status(500).json({ error: "Failed to record tax payment" });
  }
});

router.post("/split-request", async (req, res) => {
  try {
    const { parentUlpin, splits } = req.body;

    const parentProperty = await Property.findOne({ ulpin: parentUlpin });
    if (!parentProperty) {
      return res.status(404).json({ error: "Parent property not found" });
    }

    const officialData = getRevenueDept(parentUlpin);
    if (!officialData.divisions || officialData.divisions.length < 2) {
      return res.status(400).json({ error: "This property does not have approved divisions in the government registry." });
    }

    // Create a "Survey Initiated" notification immediately
    await Notification.create({
      userId: parentProperty.ownerUserId,
      type: "STATUS_UPDATE",
      title: "Property Survey Initiated",
      message: `A government survey has been initiated for ULPIN ${parentUlpin} to split it into ${splits.length} parcels.`,
    });

    // Simulate government survey and database update (5-second delay to show loading phases in frontend)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    try {
      const prop = await Property.findOne({ ulpin: parentUlpin });
      if (!prop || prop.isDivided) {
        return res.status(400).json({ error: "Property already divided or not found" });
      }

      prop.isDivided = true;
      prop.dividedChildUlpins = splits.map((s) => s.ulpin);
      await prop.save();

      const latestParentBlock = await BlockchainNode.findOne({ ulpin: parentUlpin }).sort({ timestamp: -1 });
      const parentNodeId = latestParentBlock ? latestParentBlock.nodeId : null;

      for (const child of splits) {
        // Create child property
        await Property.create({
          ulpin: child.ulpin,
          ownerUserId: prop.ownerUserId,
          area: child.area,
          type: prop.type,
          location: prop.location,
          village: prop.village,
          taluk: prop.taluk,
          district: prop.district,
          parentUlpin: parentUlpin,
          targetBuyerUserId: child.targetBuyerUserId,
          targetSalePrice: child.targetSalePrice,
          taxRecords: [], // child properties start with paid tax status internally
        });

        // Create split genesis node in blockchain
        await createSplitGenesisNode(child.ulpin, prop.ownerUserId, parentUlpin, parentNodeId);

        // Get seller and buyer names
        const sellerUser = await User.findOne({ userId: prop.ownerUserId });
        const buyerUser = await User.findOne({ userId: child.targetBuyerUserId });

        // Automatically create the Transfer agreement in SENT state (pre-signed by seller)
        const transfer = await Transfer.create({
          sellerUserId: prop.ownerUserId,
          sellerName: sellerUser ? sellerUser.name : prop.ownerUserId,
          ulpin: child.ulpin,
          agreementConditions: `Split transfer child parcel. Parent ULPIN: ${parentUlpin}.`,
          price: Number(child.targetSalePrice),
          buyerUserId: child.targetBuyerUserId,
          buyerName: buyerUser ? buyerUser.name : child.targetBuyerUserId,
          geminiSummary: {
            summary: `This is a child parcel split from ${parentUlpin}.`,
            landDetails: {
              area: child.area,
              type: prop.type,
              location: prop.location,
              surveyNumber: child.ulpin,
            },
            riskLevel: "LOW",
            taxStatus: "Paid",
            flags: []
          },
          flags: [],
          status: "SENT",
          sellerSignature: {
            signed: true,
            timestamp: new Date(),
          },
          buyerSignature: {
            signed: false,
            timestamp: null,
          }
        });

        // Notify the buyer
        await Notification.create({
          userId: child.targetBuyerUserId,
          type: "DEED_RECEIVED",
          title: "New Property Offer (Split)",
          message: `New split property offer for ULPIN ${child.ulpin} from ${prop.ownerUserId}`,
          transferId: transfer.transferId,
        });
      }

      // Send completion notification to seller
      await Notification.create({
        userId: prop.ownerUserId,
        type: "STATUS_UPDATE",
        title: "Land Division Completed",
        message: `ULPIN ${parentUlpin} has been successfully divided into: ${splits.map((s) => s.ulpin).join(", ")}.`,
      });

      return res.json({ status: "success", message: "Property split complete." });
    } catch (err) {
      console.error("Property split error:", err);
      return res.status(500).json({ error: "Failed to split property" });
    }
  } catch (error) {
    console.error("Split request error:", error);
    return res.status(500).json({ error: "Failed to initiate property split" });
  }
});

module.exports = router;
