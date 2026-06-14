const crypto = require("crypto");

/**
 * Deterministically constructs the string input for hashing.
 * The order of fields is fixed: nodeId, ulpin, POID, COID, previousNodeId, timestamp, transferId.
 */
function buildHashInput(node) {
  // 1. nodeId
  const nodeId = node.nodeId;
  // 2. ulpin
  const ulpin = node.ulpin;
  // 3. POID
  const POID = node.POID;
  // 4. COID
  const COID = node.COID;
  // 5. previousNodeId (use "null" string if null or undefined)
  const prevNodeId = node.previousNodeId ? String(node.previousNodeId) : "null";
  // 6. timestamp (convert to ISO string)
  let timestampIso = "";
  if (node.timestamp) {
    timestampIso = new Date(node.timestamp).toISOString();
  }
  // 7. transferId (use empty string if falsy)
  const transferId = node.transferId ? String(node.transferId) : "";

  // Join with "|" separator
  return [nodeId, ulpin, POID, COID, prevNodeId, timestampIso, transferId].join("|");
}

/**
 * Computes the SHA-256 hex digest of the node's deterministic string input.
 */
function computeHash(node) {
  try {
    const input = buildHashInput(node);
    return crypto.createHash("sha256").update(input).digest("hex");
  } catch (error) {
    console.error("[LandChain Security] Error computing hash:", error.message);
    return null;
  }
}

/**
 * Verifies if the stored blockHash matches the computed hash.
 */
function verifyHash(node) {
  try {
    const computed = computeHash(node);
    const valid = computed === node.blockHash;
    const result = {
      valid,
      storedHash: node.blockHash,
      computedHash: computed,
      nodeId: node.nodeId,
      ulpin: node.ulpin,
      tampered: !valid,
    };
    return result;
  } catch (error) {
    console.error("[LandChain Security] Error verifying hash for node " + node?.nodeId + ":", error.message);
    return {
      valid: false,
      storedHash: node?.blockHash || null,
      computedHash: null,
      nodeId: node?.nodeId || null,
      ulpin: node?.ulpin || null,
      tampered: true,
      error: error.message,
    };
  }
}

/**
 * Verifies the hashes of an array of nodes in batch.
 */
function verifyHashBatch(nodes) {
  try {
    let allValid = true;
    const tamperedNodes = [];
    const results = [];

    for (const node of nodes) {
      const res = verifyHash(node);
      results.push(res);
      if (res.tampered) {
        allValid = false;
        tamperedNodes.push(node.nodeId);
      }
    }

    return {
      allValid,
      totalChecked: nodes.length,
      tamperedNodes,
      results,
    };
  } catch (error) {
    console.error("[LandChain Security] Error verifying hash batch:", error.message);
    return {
      allValid: false,
      totalChecked: 0,
      tamperedNodes: [],
      results: [],
      error: error.message,
    };
  }
}

module.exports = {
  buildHashInput,
  computeHash,
  verifyHash,
  verifyHashBatch,
};
