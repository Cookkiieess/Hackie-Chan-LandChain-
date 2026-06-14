const hashService = require("../security/hashService");

/**
 * Express middleware to verify block integrity on endpoints that return blockchain data.
 */
function verifyBlockIntegrity(req, res, next) {
  try {
    if (res.locals.blockchainData) {
      const data = res.locals.blockchainData;
      const nodes = Array.isArray(data) ? data : [data];
      
      const batchResult = hashService.verifyHashBatch(nodes);

      if (batchResult.allValid) {
        res.locals.integrity = {
          verified: true,
          checkedNodes: batchResult.totalChecked,
        };
      } else {
        res.locals.integrity = {
          verified: false,
          warning: "TAMPERING DETECTED",
          tamperedNodes: batchResult.tamperedNodes,
        };
        console.error(
          "[LandChain Security] TAMPERING DETECTED in nodes: " +
            batchResult.tamperedNodes.join(", ")
        );
      }
    }
  } catch (error) {
    console.error("[LandChain Security] Error in verifyBlockIntegrity middleware:", error.message);
  }
  next();
}

module.exports = verifyBlockIntegrity;
