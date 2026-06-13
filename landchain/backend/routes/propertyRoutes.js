const express = require("express");
const Property = require("../models/Property");
const { createGenesisNode, getChain } = require("../services/blockchainService");
const { analyzeProperty } = require("../services/geminiService");

const router = express.Router();

function getRevenueDept(ulpin) {
  return {
    ownerName: "Ramesh Kumar",
    surveyNumber: "142/3B",
    area: "2.4 acres",
    landType: "Agricultural",
    village: "Hosahalli",
    taluk: "Mangaluru",
    district: "Dakshina Kannada",
    state: "Karnataka",
    previousOwners: ["Suresh Kumar (1998-2015)", "Ramesh Kumar (2015-present)"],
    taxStatus: "Paid up to 2024-25",
    ulpin,
  };
}

function getKaveriData() {
  return {
    registrationHistory: [
      {
        year: 2015,
        type: "Sale Deed",
        parties: "Suresh Kumar to Ramesh Kumar",
        value: "18,00,000",
      },
      {
        year: 1998,
        type: "Gift Deed",
        parties: "Government to Suresh Kumar",
        value: "0",
      },
    ],
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
  let property = await Property.findOne({ ulpin });
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

    if (!chain.length) {
      await createGenesisNode(ulpin, requesterUserId);
    }
  }

  if (property && chain.length) {
    const latestNode = chain[chain.length - 1];
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

    return res.json({
      ulpin,
      revenueData,
      kaveriData,
      courtData,
      propertyRecord,
    });
  } catch (error) {
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

router.get("/:ulpin", async (req, res) => {
  try {
    const property = await Property.findOne({ ulpin: req.params.ulpin });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    return res.json(property);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch property" });
  }
});

router.put("/:ulpin/tax/pay", async (req, res) => {
  try {
    const { year } = req.body;
    const property = await Property.findOne({ ulpin: req.params.ulpin });

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

module.exports = router;
