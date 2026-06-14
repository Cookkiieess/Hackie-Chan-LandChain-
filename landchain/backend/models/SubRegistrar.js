const mongoose = require("mongoose");

const registrationEntrySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      trim: true,
    },
    deedNumber: {
      type: String,
      trim: true,
    },
    volume: {
      type: String,
      trim: true,
    },
    page: {
      type: String,
      trim: true,
    },
    transactionType: {
      type: String,
      trim: true,
    },
    seller: {
      type: String,
      trim: true,
    },
    buyer: {
      type: String,
      trim: true,
    },
    considerationAmount: {
      type: Number,
    },
  },
  { _id: false }
);

const subRegistrarSchema = new mongoose.Schema(
  {
    ulpin: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    encumbrances: {
      type: String,
      default: "None",
      trim: true,
    },
    mortgageStatus: {
      type: String,
      default: "Clear",
      trim: true,
    },
    registrationHistory: {
      type: [registrationEntrySchema],
      default: [],
    },
  },
  { timestamps: true }
);

subRegistrarSchema.pre("save", function (next) {
  if (this.ulpin) {
    this.ulpin = this.ulpin.toUpperCase().trim();
  }
  next();
});

module.exports = mongoose.model("SubRegistrar", subRegistrarSchema);
