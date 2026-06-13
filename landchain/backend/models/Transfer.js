const mongoose = require("mongoose");

const signatureSchema = new mongoose.Schema(
  {
    signed: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const actionSchema = new mongoose.Schema(
  {
    approved: {
      type: Boolean,
      default: null,
    },
    timestamp: {
      type: Date,
      default: null,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const transferSchema = new mongoose.Schema({
  transferId: {
    type: String,
    unique: true,
    index: true,
  },
  ulpin: {
    type: String,
    required: true,
    trim: true,
  },
  sellerUserId: {
    type: String,
    required: true,
    trim: true,
  },
  buyerUserId: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
  },
  agreementConditions: {
    type: String,
    default: "",
    trim: true,
  },
  geminiSummary: {
    type: Object,
    default: {},
  },
  flags: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: [
      "DRAFT",
      "SENT",
      "BUYER_SIGNED",
      "REGISTRAR_REVIEW",
      "REGISTRAR_APPROVED",
      "REGISTRAR_DECLINED",
      "PANCHAYAT_REVIEW",
      "PANCHAYAT_APPROVED",
      "PANCHAYAT_DECLINED",
      "PAYMENT_PENDING",
      "COMPLETED",
    ],
    default: "DRAFT",
  },
  sellerSignature: {
    type: signatureSchema,
    default: () => ({}),
  },
  buyerSignature: {
    type: signatureSchema,
    default: () => ({}),
  },
  registrarAction: {
    type: actionSchema,
    default: () => ({}),
  },
  panchayatAction: {
    type: actionSchema,
    default: () => ({}),
  },
  paymentRef: {
    type: String,
    trim: true,
  },
  blockchainNodeId: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

transferSchema.pre("save", function prepareTransfer(next) {
  if (!this.transferId) {
    this.transferId = `TXN-${Date.now()}`;
  }

  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Transfer", transferSchema);
