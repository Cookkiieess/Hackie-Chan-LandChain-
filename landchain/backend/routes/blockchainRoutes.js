const express = require("express");
const { getChain, verifyChain } = require("../services/blockchainService");

const router = express.Router();

router.get("/verify/:ulpin", async (req, res) => {
  try {
    const result = await verifyChain(req.params.ulpin);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "Failed to verify blockchain" });
  }
});

router.get("/:ulpin", async (req, res) => {
  try {
    const chain = await getChain(req.params.ulpin);
    return res.json(chain);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch blockchain chain" });
  }
});

module.exports = router;
