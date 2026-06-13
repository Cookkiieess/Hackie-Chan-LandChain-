const express = require("express");
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

router.post("/fetch", async (req, res) => {
  try {
    const { ulpin } = req.body;

    const revenueData = getRevenueDept(ulpin);
    const kaveriData = getKaveriData(ulpin);
    const courtData = getCourtRecords(ulpin);

    return res.json({
      ulpin,
      revenueData,
      kaveriData,
      courtData,
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

module.exports = router;
