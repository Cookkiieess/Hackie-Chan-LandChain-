const crypto = require("crypto");
const BlockchainNode = require("../models/BlockchainNode");

function createNodeId() {
  return `NODE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateHash(nodeId, ulpin, POID, COID, previousNodeId, timestamp) {
  const hashInput = [
    nodeId,
    ulpin,
    POID,
    COID,
    previousNodeId,
    timestamp instanceof Date ? timestamp.toISOString() : timestamp,
  ].join("");

  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

async function createGenesisNode(ulpin, ownerUserId) {
  const nodeId = createNodeId();
  const timestamp = new Date();

  const node = new BlockchainNode({
    nodeId,
    ulpin,
    POID: "GOVERNMENT",
    COID: ownerUserId,
    previousNodeId: null,
    timestamp,
    blockHash: generateHash(nodeId, ulpin, "GOVERNMENT", ownerUserId, null, timestamp),
  });

  await node.save();
  return node;
}

async function createTransferNode(ulpin, POID, COID, transferId) {
  const latestNode = await BlockchainNode.findOne({ ulpin }).sort({ timestamp: -1 });
  const nodeId = createNodeId();
  const timestamp = new Date();
  const previousNodeId = latestNode ? latestNode.nodeId : null;

  const node = new BlockchainNode({
    nodeId,
    ulpin,
    POID,
    COID,
    previousNodeId,
    timestamp,
    transferId,
    blockHash: generateHash(nodeId, ulpin, POID, COID, previousNodeId, timestamp),
  });

  await node.save();
  return node;
}

async function getChain(ulpin) {
  return BlockchainNode.find({ ulpin }).sort({ timestamp: 1 });
}

async function createSplitGenesisNode(childUlpin, ownerUserId, parentUlpin, parentNodeId) {
  const nodeId = `NODE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const timestamp = new Date();
  const poid = `SPLIT_FROM_${parentUlpin}`;

  const node = new BlockchainNode({
    nodeId,
    ulpin: childUlpin,
    POID: poid,
    COID: ownerUserId,
    previousNodeId: parentNodeId,
    timestamp,
    splitParentNodeId: parentNodeId,
    blockHash: generateHash(nodeId, childUlpin, poid, ownerUserId, parentNodeId, timestamp),
  });

  await node.save();
  return node;
}

async function verifyChain(ulpin) {
  const chain = await getChain(ulpin);

  for (let index = 0; index < chain.length; index += 1) {
    const node = chain[index];
    const expectedHash = generateHash(
      node.nodeId,
      node.ulpin,
      node.POID,
      node.COID,
      node.previousNodeId,
      node.timestamp
    );

    if (node.blockHash !== expectedHash) {
      return { valid: false, invalidAt: node.nodeId };
    }

    if (index === 0) {
      if (node.previousNodeId) {
        const parentNode = await BlockchainNode.findOne({ nodeId: node.previousNodeId });
        if (!parentNode) {
          return { valid: false, invalidAt: node.nodeId };
        }
      }
      continue;
    }

    const previousNode = chain[index - 1];

    if (node.previousNodeId !== previousNode.nodeId) {
      return { valid: false, invalidAt: node.nodeId };
    }
  }

  return { valid: true, invalidAt: null };
}

module.exports = {
  generateHash,
  createGenesisNode,
  createTransferNode,
  createSplitGenesisNode,
  getChain,
  verifyChain,
};
