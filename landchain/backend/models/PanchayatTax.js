const mongoose = require("mongoose");

const taxPaymentSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Paid", "Unpaid"],
    },
  },
  { _id: false }
);

const panchayatTaxSchema = new mongoose.Schema(
  {
    ulpin: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    taxStatus: {
      type: String,
      required: true,
      trim: true,
    },
    taxRecords: {
      type: [taxPaymentSchema],
      default: [],
    },
  },
  { timestamps: true }
);

panchayatTaxSchema.pre("save", function (next) {
  if (this.ulpin) {
    this.ulpin = this.ulpin.toUpperCase().trim();
  }
  next();
});

module.exports = mongoose.model("PanchayatTax", panchayatTaxSchema);
