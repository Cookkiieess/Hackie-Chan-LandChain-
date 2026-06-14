const express = require("express");
const StateRevenue = require("../models/StateRevenue");
const SubRegistrar = require("../models/SubRegistrar");
const PanchayatTax = require("../models/PanchayatTax");
const CourtRecord = require("../models/CourtRecord");
const { getUlpinVariants } = require("../services/blockchainService");

const router = express.Router();

// State Revenue Department Details
router.get("/revenue/:ulpin(*)", async (req, res) => {
  try {
    const { ulpin } = req.params;
    const variants = getUlpinVariants(ulpin);
    const record = await StateRevenue.findOne({ ulpin: { $in: variants } });
    if (!record) {
      return res.status(404).json({ error: "Revenue record not found" });
    }
    return res.json(record);
  } catch (error) {
    console.error("[Gov API] Error fetching revenue record:", error.message);
    return res.status(500).json({ error: "Failed to fetch revenue record" });
  }
});

// Sub-Registrar History & Deed Records
router.get("/registrar/:ulpin(*)", async (req, res) => {
  try {
    const { ulpin } = req.params;
    const variants = getUlpinVariants(ulpin);
    const record = await SubRegistrar.findOne({ ulpin: { $in: variants } });
    if (!record) {
      return res.status(404).json({ error: "Sub-registrar record not found" });
    }
    return res.json(record);
  } catch (error) {
    console.error("[Gov API] Error fetching registrar record:", error.message);
    return res.status(500).json({ error: "Failed to fetch registrar record" });
  }
});

// Panchayat/Municipal Corporation Tax Records
router.get("/panchayat/:ulpin(*)", async (req, res) => {
  try {
    const { ulpin } = req.params;
    const variants = getUlpinVariants(ulpin);
    const record = await PanchayatTax.findOne({ ulpin: { $in: variants } });
    if (!record) {
      return res.status(404).json({ error: "Panchayat tax record not found" });
    }
    return res.json(record);
  } catch (error) {
    console.error("[Gov API] Error fetching tax record:", error.message);
    return res.status(500).json({ error: "Failed to fetch tax record" });
  }
});

// Civil & Revenue Court Litigations
router.get("/court/:ulpin(*)", async (req, res) => {
  try {
    const { ulpin } = req.params;
    const variants = getUlpinVariants(ulpin);
    const record = await CourtRecord.findOne({ ulpin: { $in: variants } });
    if (!record) {
      return res.status(404).json({ error: "Court litigation record not found" });
    }
    return res.json(record);
  } catch (error) {
    console.error("[Gov API] Error fetching court record:", error.message);
    return res.status(500).json({ error: "Failed to fetch court record" });
  }
});

module.exports = router;
