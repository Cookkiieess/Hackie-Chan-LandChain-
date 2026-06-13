const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const transferRoutes = require("./routes/transferRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const blockchainRoutes = require("./routes/blockchainRoutes");
const translateRoutes = require("./routes/translateRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/property", propertyRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/translate", translateRoutes);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("[LandChain] MongoDB connected");
    app.listen(PORT, () => {
      console.log(`[LandChain] Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("[LandChain] MongoDB connection error:", error);
    process.exit(1);
  });
