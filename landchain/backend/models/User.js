const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  dob: {
    type: String,
    required: true,
    trim: true,
  },
  aadhaarNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  userId: {
    type: String,
    unique: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function generateUserId(next) {
  if (this.userId) {
    return next();
  }

  let isUnique = false;

  while (!isUnique) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const candidateId = `LC-${randomDigits}`;
    const existingUser = await mongoose.models.User.findOne({ userId: candidateId });

    if (!existingUser) {
      this.userId = candidateId;
      isUnique = true;
    }
  }

  next();
});

module.exports = mongoose.model("User", userSchema);
