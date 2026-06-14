const BlockchainNode = require("../models/BlockchainNode");
const User = require("../models/User");
const Transfer = require("../models/Transfer");
const { computeHash } = require("../security/hashService");
const integrityChecker = require("../security/integrityChecker");

function createNodeId() {
  return `NODE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

async function createGenesisNode(ulpin, ownerUserId) {
  const nodeId = createNodeId();
  const timestamp = new Date();

  // 1. Build node object first (without hash)
  const node = new BlockchainNode({
    nodeId,
    ulpin,
    POID: "GOVERNMENT",
    COID: ownerUserId,
    previousNodeId: null,
    timestamp,
  });

  // 2. Call computeHash(node) to generate blockHash
  const blockHash = computeHash(node);
  node.blockHash = blockHash;

  // 3. Save node with computed blockHash
  await node.save();

  // 4. console.log("[LandChain] Genesis node hash: " + blockHash)
  console.log("[LandChain] Genesis node hash: " + blockHash);

  return node;
}

async function createTransferNode(ulpin, POID, COID, transferId) {
  const latestNode = await BlockchainNode.findOne({ ulpin }).sort({ timestamp: -1 });
  const nodeId = createNodeId();
  const timestamp = new Date();
  const previousNodeId = latestNode ? latestNode.nodeId : null;

  // Always derive true POID from latestNode.COID to prevent spoofing
  const derivedPOID = latestNode ? latestNode.COID : "GOVERNMENT";

  // 1. Build node object first (without hash)
  const node = new BlockchainNode({
    nodeId,
    ulpin,
    POID: derivedPOID,
    COID,
    previousNodeId,
    timestamp,
    transferId,
  });

  // 2. Call computeHash(node) to generate blockHash
  const blockHash = computeHash(node);
  node.blockHash = blockHash;

  // 3. Save with computed blockHash
  await node.save();

  return node;
}

async function createSplitGenesisNode(childUlpin, ownerUserId, parentUlpin, parentNodeId) {
  const nodeId = createNodeId();
  const timestamp = new Date();
  const poid = `SPLIT_FROM_${parentUlpin}`;

  // Build node object first (without hash)
  const node = new BlockchainNode({
    nodeId,
    ulpin: childUlpin,
    POID: poid,
    COID: ownerUserId,
    previousNodeId: parentNodeId,
    timestamp,
    splitParentNodeId: parentNodeId,
  });

  // Call computeHash(node) to generate blockHash
  const blockHash = computeHash(node);
  node.blockHash = blockHash;

  // Save node with computed blockHash
  await node.save();
  return node;
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

async function getChain(ulpin) {
  const variants = getUlpinVariants(ulpin);
  return BlockchainNode.find({ ulpin: { $in: variants } }).sort({ timestamp: 1 });
}

/**
 * Replaces existing chain verification by calling integrityChecker directly.
 */
async function verifyChain(ulpin) {
  return integrityChecker.checkChainIntegrity(ulpin);
}

/**
 * Migration utility for old records with wrong hashes.
 * WARNING: This function should only be run ONCE during migration.
 * Never call it in the normal production flow.
 */
async function rehashAllNodes() {
  console.log("[LandChain Security] Starting migration: Rehashing all nodes in DB...");
  const allNodes = await BlockchainNode.find({});
  let updatedCount = 0;

  for (const node of allNodes) {
    const correctHash = computeHash(node);
    if (node.blockHash !== correctHash) {
      node.blockHash = correctHash;
      // Also update hashVerifiedAt since we are correcting it
      node.hashVerifiedAt = new Date();
      await node.save();
      updatedCount += 1;
    }
  }

  console.log(`[LandChain Security] Migration complete: Rehashed ${updatedCount} nodes.`);
  return updatedCount;
}

/**
 * Dynamically computes ownership history (previousOwners and Kaveri registrationHistory) from blockchain nodes.
 */
async function getOwnershipHistory(ulpin) {
  const chain = await getChain(ulpin);
  const users = await User.find({});
  const userMap = {};
  users.forEach(u => {
    userMap[u.userId] = u.name;
  });
  userMap["GOVERNMENT"] = "Government";
  userMap["Government"] = "Government";

  const registrationHistory = [];
  const previousOwners = [];

  for (let i = 0; i < chain.length; i++) {
    const node = chain[i];
    const year = new Date(node.timestamp).getFullYear();
    
    let sellerName = userMap[node.POID] || node.POID;
    if (String(node.POID).startsWith("SPLIT_FROM_")) {
      sellerName = "Government";
    }
    const buyerName = userMap[node.COID] || node.COID;

    // Determine the deed type and transaction value
    let value = "0";
    let type = "Gift Deed";
    if (node.transferId) {
      type = "Sale Deed (Digital)";
      const transferDoc = await Transfer.findOne({ transferId: node.transferId });
      if (transferDoc) {
        value = new Intl.NumberFormat("en-IN").format(transferDoc.price);
      } else {
        value = "Market Value";
      }
    } else if (i > 0) {
      type = "Sale Deed";
      value = "Market Value";
    }

    // Add to Kaveri registration history (newest first)
    registrationHistory.unshift({
      year,
      type,
      parties: `${sellerName} to ${buyerName}`,
      value,
    });

    // Populate previousOwners dynamically (chronologically)
    if (i === 0) {
      const prevYear = year - 5;
      previousOwners.push(`${sellerName} (${prevYear}-${year})`);
    }

    if (i === chain.length - 1) {
      previousOwners.push(`${buyerName} (${year}-present)`);
    } else {
      const nextNode = chain[i + 1];
      const nextYear = new Date(nextNode.timestamp).getFullYear();
      previousOwners.push(`${buyerName} (${year}-${nextYear})`);
    }
  }

  return { registrationHistory, previousOwners };
}

module.exports = {
  createGenesisNode,
  createTransferNode,
  createSplitGenesisNode,
  getChain,
  verifyChain,
  rehashAllNodes,
  getOwnershipHistory,
  getUlpinVariants,
};
