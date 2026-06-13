const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.userId,
      aadhaarNumber: user.aadhaarNumber,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/signup", async (req, res) => {
  try {
    const { name, dob, aadhaarNumber, otp } = req.body;

    if (otp !== "123456") {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const existingUser = await User.findOne({ aadhaarNumber });

    if (existingUser) {
      return res.status(400).json({ error: "Aadhaar number already registered" });
    }

    const user = new User({
      name,
      dob,
      aadhaarNumber,
    });

    await user.save();

    return res.status(201).json({
      userId: user.userId,
      name: user.name,
      token: generateToken(user),
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to sign up user" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { aadhaarNumber, otp } = req.body;

    if (otp !== "123456") {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const user = await User.findOne({ aadhaarNumber });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      userId: user.userId,
      name: user.name,
      token: generateToken(user),
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to log in user" });
  }
});

module.exports = router;
