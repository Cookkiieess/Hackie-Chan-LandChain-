const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Property = require("./models/Property");
const BlockchainNode = require("./models/BlockchainNode");
const { createGenesisNode } = require("./services/blockchainService");

const threeWayProperty = {
  ulpin: "KA-MNG-313-DIV3",
  ownerUserId: "LC-1003",
  area: "3.0 acres",
  type: "Agricultural",
  location: "Kulshekar, Mangaluru, Dakshina Kannada",
  village: "Kulshekar",
  taluk: "Mangaluru",
  district: "Dakshina Kannada",
};

async function addProperty() {
  try {
    console.log("[AddThreeWayProperty] Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("[AddThreeWayProperty] Connected.");

    const existing = await Property.findOne({ ulpin: threeWayProperty.ulpin });
    if (existing) {
      console.log(`[AddThreeWayProperty] Property ${threeWayProperty.ulpin} already exists. Skipping.`);
      process.exit(0);
    }

    const property = new Property({
      ulpin: threeWayProperty.ulpin,
      ownerUserId: threeWayProperty.ownerUserId,
      area: threeWayProperty.area,
      type: threeWayProperty.type,
      location: threeWayProperty.location,
      village: threeWayProperty.village,
      taluk: threeWayProperty.taluk,
      district: threeWayProperty.district,
      taxRecords: [
        { year: 2023, amount: 1500, status: "Paid" },
        { year: 2024, amount: 1700, status: "Paid" },
      ],
    });
    await property.save();
    console.log(`[AddThreeWayProperty] Created Property: ${property.ulpin} owned by ${property.ownerUserId}`);

    const blockchainRes = await BlockchainNode.findOne({ ulpin: threeWayProperty.ulpin });
    if (!blockchainRes) {
      await createGenesisNode(threeWayProperty.ulpin, threeWayProperty.ownerUserId);
      console.log(`[AddThreeWayProperty] Created Genesis block for ULPIN ${threeWayProperty.ulpin}`);
    }

    console.log("[AddThreeWayProperty] 3-part divisible property added successfully.");
    process.exit(0);
  } catch (err) {
    console.error("[AddThreeWayProperty] Error:", err);
    process.exit(1);
  }
}

addProperty();
