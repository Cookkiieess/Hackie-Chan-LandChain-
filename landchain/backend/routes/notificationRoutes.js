const express = require("express");
const Notification = require("../models/Notification");

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId }).sort({
      createdAt: -1,
    });

    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.put("/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res.json(notification);
  } catch (error) {
    return res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

module.exports = router;
