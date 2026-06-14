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
  landId: {
    type: String,
    unique: true,
    index: true,
  },
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
  isDivided: {
    type: Boolean,
    default: false,
  },
  parentUlpin: {
    type: String,
    default: null,
    trim: true,
  },
  dividedChildUlpins: {
    type: [String],
    default: [],
  },
  targetBuyerUserId: {
    type: String,
    default: null,
    trim: true,
  },
  targetSalePrice: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

propertySchema.pre("save", async function prepareProperty(next) {
  if (!this.landId) {
    let isUnique = false;

    while (!isUnique) {
      const randomDigits = Math.floor(100000 + Math.random() * 900000);
      const candidateId = `LAND-${randomDigits}`;
      const existingProperty = await mongoose.models.Property.findOne({ landId: candidateId });

      if (!existingProperty) {
        this.landId = candidateId;
        isUnique = true;
      }
    }
  }

  if (this.ulpin) {
    this.ulpin = this.ulpin.toUpperCase().trim();
    this.internalCode = `LC-${this.ulpin}`;
  }

  next();
});

module.exports = mongoose.model("Property", propertySchema);
