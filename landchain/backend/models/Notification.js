const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ["TRANSFER_REQUEST", "TAX_REMINDER", "STATUS_UPDATE", "DEED_RECEIVED"],
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  transferId: {
    type: String,
    trim: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notification", notificationSchema);
