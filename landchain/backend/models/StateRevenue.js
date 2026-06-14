const mongoose = require("mongoose");

const divisionSchema = new mongoose.Schema(
  {
    ulpin: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const stateRevenueSchema = new mongoose.Schema(
  {
    ulpin: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    surveyNumber: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    landType: {
      type: String,
      required: true,
      trim: true,
    },
    village: {
      type: String,
      required: true,
      trim: true,
    },
    taluk: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    divisions: {
      type: [divisionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

stateRevenueSchema.pre("save", function (next) {
  if (this.ulpin) {
    this.ulpin = this.ulpin.toUpperCase().trim();
  }
  next();
});

module.exports = mongoose.model("StateRevenue", stateRevenueSchema);
