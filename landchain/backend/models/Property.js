const mongoose = require("mongoose");

const taxRecordSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
    },
    amount: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["Paid", "Unpaid"],
    },
  },
  { _id: false }
);

const propertySchema = new mongoose.Schema({
  ulpin: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  internalCode: {
    type: String,
    trim: true,
  },
  ownerUserId: {
    type: String,
    required: true,
    trim: true,
  },
  area: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ["Agricultural", "Residential", "Commercial"],
  },
  location: {
    type: String,
    trim: true,
  },
  village: {
    type: String,
    trim: true,
  },
  taluk: {
    type: String,
    trim: true,
  },
  district: {
    type: String,
    trim: true,
  },
  taxRecords: {
    type: [taxRecordSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

propertySchema.pre("save", function setInternalCode(next) {
  if (this.ulpin) {
    this.internalCode = `LC-${this.ulpin}`;
  }

  next();
});

module.exports = mongoose.model("Property", propertySchema);
