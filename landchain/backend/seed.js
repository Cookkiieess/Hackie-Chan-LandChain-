const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");
const Property = require("./models/Property");
const BlockchainNode = require("./models/BlockchainNode");
const Notification = require("./models/Notification");
const Transfer = require("./models/Transfer");
const { createGenesisNode } = require("./services/blockchainService");

async function seed() {
  try {
    console.log("[Seeder] Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("[Seeder] Connected successfully.");

    // Clear old test data
    console.log("[Seeder] Clearing existing collection data...");
    await User.deleteMany({});
    await Property.deleteMany({});
    await BlockchainNode.deleteMany({});
    await Notification.deleteMany({});
    await Transfer.deleteMany({});

    console.log("[Seeder] Creating mock users...");
    // Create Ramesh (Seller)
    const ramesh = new User({
      name: "Ramesh Kumar",
      dob: "1980-05-15",
      aadhaarNumber: "111122223333",
      userId: "LC-1001",
    });
    await ramesh.save();

    // Create Suresh (Buyer 1)
    const suresh = new User({
      name: "Suresh Patil",
      dob: "1985-08-20",
      aadhaarNumber: "222233334444",
      userId: "LC-1002",
    });
    await suresh.save();

    // Create Deepak (Buyer 2)
    const deepak = new User({
      name: "Deepak Gowda",
      dob: "1990-12-10",
      aadhaarNumber: "333344445555",
      userId: "LC-1003",
    });
    await deepak.save();

    console.log(`[Seeder] Created Users:
    - Ramesh Kumar (Aadhaar: 111122223333, UserID: ${ramesh.userId})
    - Suresh Patil (Aadhaar: 222233334444, UserID: ${suresh.userId})
    - Deepak Gowda (Aadhaar: 333344445555, UserID: ${deepak.userId})`);

    console.log("[Seeder] Creating mock parent property...");
    const parentUlpin = "KA-MNG-142-3B";
    const property = new Property({
      landId: "LAND-100001",
      ulpin: parentUlpin,
      ownerUserId: ramesh.userId,
      area: "2.4 acres",
      type: "Agricultural",
      location: "Hosahalli, Mangaluru, Dakshina Kannada",
      village: "Hosahalli",
      taluk: "Mangaluru",
      district: "Dakshina Kannada",
      taxRecords: [
        { year: 2022, amount: 4200, status: "Paid" },
        { year: 2023, amount: 4500, status: "Paid" },
        { year: 2024, amount: 4800, status: "Paid" },
      ],
    });
    await property.save();

    console.log(`[Seeder] Created Property: ${property.ulpin} owned by Ramesh (${property.ownerUserId})`);

    console.log("[Seeder] Creating Genesis Blockchain Node for property...");
    await createGenesisNode(parentUlpin, ramesh.userId);
    console.log("[Seeder] Created Genesis Block.");

    console.log("[Seeder] Seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("[Seeder] Seeding error:", error);
    process.exit(1);
  }
}

seed();
