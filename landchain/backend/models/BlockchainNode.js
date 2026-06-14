const mongoose = require("mongoose");
const hashService = require("../security/hashService");

function createNodeId() {
  return `NODE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

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
  splitParentNodeId: {
    type: String,
    default: null,
    trim: true,
  },
  hashVerifiedAt: {
    type: Date,
    default: null,
  },
});

// Setup JSON/Object options to include virtuals when returning data
blockchainNodeSchema.set("toJSON", { virtuals: true });
blockchainNodeSchema.set("toObject", { virtuals: true });

blockchainNodeSchema.pre("save", function prepareBlockchainNode(next) {
  if (this.ulpin) {
    this.ulpin = this.ulpin.toUpperCase().trim();
  }

  if (!this.nodeId) {
    this.nodeId = createNodeId();
  }

  if (!this.timestamp) {
    this.timestamp = new Date();
  }

  // Use the centralized hashService to compute the block hash
  this.blockHash = hashService.computeHash(this);
  next();
});

// Virtual field: true if previousNodeId is null
blockchainNodeSchema.virtual("isGenesisNode").get(function () {
  return this.previousNodeId === null || this.previousNodeId === undefined || this.previousNodeId === "null";
});

module.exports = mongoose.model("BlockchainNode", blockchainNodeSchema);
