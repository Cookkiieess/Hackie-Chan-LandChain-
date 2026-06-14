const mongoose = require("mongoose");

const pendingCaseSchema = new mongoose.Schema(
  {
    caseNumber: {
      type: String,
      required: true,
      trim: true,
    },
    courtName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    parties: {
      type: String,
      trim: true,
    },
    filedYear: {
      type: Number,
    },
  },
  { _id: false }
);

const courtRecordSchema = new mongoose.Schema(
  {
    ulpin: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    litigationStatus: {
      type: String,
      required: true,
      trim: true,
    },
    pendingCases: {
      type: [pendingCaseSchema],
      default: [],
    },
    attachmentOrders: {
      type: String,
      default: "None",
      trim: true,
    },
    courtVerifiedOn: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

courtRecordSchema.pre("save", function (next) {
  if (this.ulpin) {
    this.ulpin = this.ulpin.toUpperCase().trim();
  }
  next();
});

module.exports = mongoose.model("CourtRecord", courtRecordSchema);
