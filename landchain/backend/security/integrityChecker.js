const BlockchainNode = require("../models/BlockchainNode");
const hashService = require("./hashService");

/**
 * Checks the cryptographic integrity of a single node by its ID.
 */
async function checkNodeIntegrity(nodeId) {
  try {
    const node = await BlockchainNode.findOne({ nodeId });
    if (!node) {
      console.log("[LandChain Security] Node not found for integrity check:", nodeId);
      return {
        valid: false,
        storedHash: null,
        computedHash: null,
        nodeId,
        ulpin: null,
        tampered: true,
        message: "TAMPERING DETECTED",
      };
    }

    const verification = hashService.verifyHash(node);
    
    // Update hashVerifiedAt in DB if it is valid
    if (verification.valid) {
      node.hashVerifiedAt = new Date();
      await node.save();
    }

    return {
      ...verification,
      message: verification.valid ? "Node integrity verified" : "TAMPERING DETECTED",
    };
  } catch (error) {
    console.error("[LandChain Security] Error checking node integrity for " + nodeId + ":", error.message);
    return {
      error: error.message,
      message: "TAMPERING DETECTED",
    };
  }
}

function getUlpinVariants(ulpin) {
  const normalized = String(ulpin || "").toUpperCase().trim();
  const variants = [normalized];

  if (normalized.includes("/")) {
    variants.push(normalized.replace(/\//g, ""));
  } else {
    const lastChar = normalized.slice(-1);
    if (/[A-Z]/.test(lastChar)) {
      const rest = normalized.slice(0, -1);
      variants.push(`${rest}/${lastChar}`);
    }
  }

  return [...new Set(variants)];
}

/**
 * Checks the cryptographic and structural link integrity of a whole chain for a ULPIN.
 */
async function checkChainIntegrity(ulpin) {
  try {
    const variants = getUlpinVariants(ulpin);
    const chain = await BlockchainNode.find({ ulpin: { $in: variants } }).sort({ timestamp: 1 });
    const tamperedNodes = [];
    const brokenLinks = [];
    const chainSummary = [];

    for (let index = 0; index < chain.length; index += 1) {
      const node = chain[index];
      
      // CHECK A: Hash integrity
      const hashVerify = hashService.verifyHash(node);
      const hashValid = hashVerify.valid;
      if (!hashValid) {
        tamperedNodes.push(node.nodeId);
      } else {
        // Update hashVerifiedAt in DB
        node.hashVerifiedAt = new Date();
        await node.save();
      }

      // CHECK B: Chain linkage
      let linkValid = true;
      if (index > 0) {
        const priorNode = chain[index - 1];
        linkValid = node.previousNodeId === priorNode.nodeId;
        if (!linkValid) {
          brokenLinks.push(node.nodeId);
        }
      }

      chainSummary.push({
        nodeId: node.nodeId,
        POID: node.POID,
        COID: node.COID,
        timestamp: node.timestamp,
        hashValid,
        linkValid,
      });
    }

    const valid = tamperedNodes.length === 0 && brokenLinks.length === 0;

    return {
      ulpin,
      valid,
      totalNodes: chain.length,
      tamperedNodes,
      brokenLinks,
      checkedAt: new Date().toISOString(),
      chainSummary,
    };
  } catch (error) {
    console.error("[LandChain Security] Error checking chain integrity for " + ulpin + ":", error.message);
    return {
      ulpin,
      valid: false,
      totalNodes: 0,
      tamperedNodes: [],
      brokenLinks: [],
      checkedAt: new Date().toISOString(),
      chainSummary: [],
      error: error.message,
    };
  }
}

/**
 * Checks integrity across all distinct chains (distinct ULPINs).
 */
async function checkAllChains() {
  try {
    const ulpins = await BlockchainNode.distinct("ulpin");
    const results = [];
    let validChains = 0;
    let compromisedChains = 0;

    for (const ulpin of ulpins) {
      const res = await checkChainIntegrity(ulpin);
      results.push(res);
      if (res.valid) {
        validChains += 1;
      } else {
        compromisedChains += 1;
      }
    }

    return {
      totalChains: ulpins.length,
      validChains,
      compromisedChains,
      results,
    };
  } catch (error) {
    console.error("[LandChain Security] Error checking all chains:", error.message);
    return {
      totalChains: 0,
      validChains: 0,
      compromisedChains: 0,
      results: [],
      error: error.message,
    };
  }
}

/**
 * Generates an audit report of all chains.
 */
async function generateIntegrityReport() {
  try {
    const audit = await checkAllChains();
    const totalNodes = audit.results.reduce((acc, curr) => acc + curr.totalNodes, 0);
    const tamperedNodeCount = audit.results.reduce((acc, curr) => acc + curr.tamperedNodes.length + curr.brokenLinks.length, 0);
    const systemStatus = audit.compromisedChains > 0 ? "COMPROMISED" : "SECURE";
    const compromisedDetails = audit.results.filter(r => !r.valid);

    const report = {
      reportGeneratedAt: new Date().toISOString(),
      systemStatus,
      summary: {
        totalChains: audit.totalChains,
        totalNodes,
        validChains: audit.validChains,
        compromisedChains: audit.compromisedChains,
        tamperedNodeCount,
      },
      compromisedDetails,
    };

    console.log("[LandChain Security Audit] " + JSON.stringify(report, null, 2));
    return report;
  } catch (error) {
    console.error("[LandChain Security] Error generating integrity report:", error.message);
    return {
      error: error.message,
    };
  }
}

module.exports = {
  checkNodeIntegrity,
  checkChainIntegrity,
  checkAllChains,
  generateIntegrityReport,
};
