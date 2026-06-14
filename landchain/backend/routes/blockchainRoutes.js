const express = require("express");
const { getChain, rehashAllNodes } = require("../services/blockchainService");
const integrityChecker = require("../security/integrityChecker");
const verifyBlockIntegrity = require("../middleware/verifyBlockIntegrity");

const router = express.Router();

// GET /api/blockchain/verify/:ulpin
// Runs full chain integrity checks (hash integrity & linkage checks)
router.get("/verify/:ulpin(*)", async (req, res) => {
  try {
    const status = await integrityChecker.checkChainIntegrity(req.params.ulpin);
    // Returns: { valid, tamperedNodes, brokenLinks, chainSummary }
    res.json({
      valid: status.valid,
      tamperedNodes: status.tamperedNodes,
      brokenLinks: status.brokenLinks,
      chainSummary: status.chainSummary,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to verify blockchain" });
  }
});

// GET /api/blockchain/verify-node/:nodeId
// Verifies single node cryptographic integrity
router.get("/verify-node/:nodeId", async (req, res) => {
  try {
    const result = await integrityChecker.checkNodeIntegrity(req.params.nodeId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to verify node" });
  }
});

// GET /api/blockchain/audit/report
// Generates system-wide integrity report (NOTE: make admin-only in production)
router.get("/audit/report", async (req, res) => {
  try {
    const report = await integrityChecker.generateIntegrityReport();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate integrity report" });
  }
});

// GET /api/blockchain/audit/all-chains
// Runs checkChainIntegrity on all distinct ULPINs
router.get("/audit/all-chains", async (req, res) => {
  try {
    const result = await integrityChecker.checkAllChains();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to audit all chains" });
  }
});

// POST /api/blockchain/admin/rehash
// Migration utility for old records with incorrect hashes (NOTE: disable after migration)
router.post("/admin/rehash", async (req, res) => {
  try {
    const updatedCount = await rehashAllNodes();
    res.json({
      message: "Rehash complete",
      updated: updatedCount,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to rehash blockchain nodes" });
  }
});

// Existing route updated to use verifyBlockIntegrity middleware
router.get(
  "/:ulpin(*)",
  async (req, res, next) => {
    try {
      const chain = await getChain(req.params.ulpin);
      res.locals.blockchainData = chain;
      next();
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blockchain" });
    }
  },
  verifyBlockIntegrity,
  (req, res) => {
    res.json({
      chain: res.locals.blockchainData,
      integrity: res.locals.integrity,
    });
  }
);

module.exports = router;
