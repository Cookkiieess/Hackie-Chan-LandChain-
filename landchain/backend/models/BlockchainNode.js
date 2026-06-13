const crypto = require("crypto");
const mongoose = require("mongoose");

const blockchainNodeSchema = new mongoose.Schema({
  nodeId: {
    type: String,
    unique: true,
    index: true,
  },
  ulpin: {
    type: String,
    required: true,
    trim: true,
  },
  POID: {
    type: String,
    required: true,
    trim: true,
  },
  COID: {
    type: String,
    required: true,
    trim: true,
  },
  previousNodeId: {
    type: String,
    default: null,
    trim: true,
  },
  blockHash: {
    type: String,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  transferId: {
    type: String,
    trim: true,
  },
});

blockchainNodeSchema.pre("save", function prepareBlockchainNode(next) {
  if (!this.nodeId) {
    this.nodeId = `NODE-${Date.now()}`;
  }

  if (!this.timestamp) {
    this.timestamp = new Date();
  }

  const hashInput = [
    this.nodeId,
    this.ulpin,
    this.POID,
    this.COID,
    this.previousNodeId,
    this.timestamp instanceof Date ? this.timestamp.toISOString() : this.timestamp,
  ].join("");

  this.blockHash = crypto.createHash("sha256").update(hashInput).digest("hex");
  next();
});

module.exports = mongoose.model("BlockchainNode", blockchainNodeSchema);
