const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Property = require("./models/Property");
const BlockchainNode = require("./models/BlockchainNode");
const { createGenesisNode } = require("./services/blockchainService");

const divisibleProperties = [
  // Ramesh Kumar (LC-1001)
  {
    ulpin: "KA-MNG-111-DIV1",
    ownerUserId: "LC-1001",
    area: "2.0 acres",
    type: "Agricultural",
    location: "Hosahalli, Mangaluru, Dakshina Kannada",
    village: "Hosahalli",
    taluk: "Mangaluru",
    district: "Dakshina Kannada",
  },
  {
    ulpin: "KA-MNG-112-DIV2",
    ownerUserId: "LC-1001",
    area: "3.0 acres",
    type: "Residential",
    location: "Kottara, Mangaluru, Dakshina Kannada",
    village: "Kottara",
    taluk: "Mangaluru",
    district: "Dakshina Kannada",
  },

  // Suresh Patil (LC-1002)
  {
    ulpin: "KA-MNG-211-DIV1",
    ownerUserId: "LC-1002",
    area: "4.0 acres",
    type: "Agricultural",
    location: "Panambur, Mangaluru, Dakshina Kannada",
    village: "Panambur",
    taluk: "Mangaluru",
    district: "Dakshina Kannada",
  },
  {
    ulpin: "KA-MNG-212-DIV2",
    ownerUserId: "LC-1002",
    area: "2.4 acres",
    type: "Residential",
    location: "Surathkal, Mangaluru, Dakshina Kannada",
    village: "Surathkal",
    taluk: "Mangaluru",
    district: "Dakshina Kannada",
  },

  // Deepak Gowda (LC-1003)
  {
    ulpin: "KA-MNG-311-DIV1",
    ownerUserId: "LC-1003",
    area: "1.6 acres",
    type: "Agricultural",
    location: "Kulshekar, Mangaluru, Dakshina Kannada",
    village: "Kulshekar",
    taluk: "Mangaluru",
    district: "Dakshina Kannada",
  },
  {
    ulpin: "KA-MNG-312-DIV2",
    ownerUserId: "LC-1003",
    area: "5.0 acres",
    type: "Residential",
    location: "Ullal, Mangaluru, Dakshina Kannada",
    village: "Ullal",
    taluk: "Mangaluru",
    district: "Dakshina Kannada",
  },
];

async function addProperties() {
  try {
    console.log("[AddDivisibleProperties] Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("[AddDivisibleProperties] Connected.");

    for (const data of divisibleProperties) {
      const existing = await Property.findOne({ ulpin: data.ulpin });
      if (existing) {
        console.log(`[AddDivisibleProperties] Property ${data.ulpin} already exists. Skipping.`);
        continue;
      }

      const property = new Property({
        ulpin: data.ulpin,
        ownerUserId: data.ownerUserId,
        area: data.area,
        type: data.type,
        location: data.location,
        village: data.village,
        taluk: data.taluk,
        district: data.district,
        taxRecords: [
          { year: 2023, amount: 3000, status: "Paid" },
          { year: 2024, amount: 3200, status: "Paid" },
        ],
      });
      await property.save();
      console.log(`[AddDivisibleProperties] Created Property: ${property.ulpin} owned by ${property.ownerUserId}`);

      const blockchainRes = await BlockchainNode.findOne({ ulpin: data.ulpin });
      if (!blockchainRes) {
        await createGenesisNode(data.ulpin, data.ownerUserId);
        console.log(`[AddDivisibleProperties] Created Genesis block for ULPIN ${data.ulpin}`);
      }
    }

    console.log("[AddDivisibleProperties] Divisible properties added successfully.");
    process.exit(0);
  } catch (err) {
    console.error("[AddDivisibleProperties] Error:", err);
    process.exit(1);
  }
}

addProperties();
