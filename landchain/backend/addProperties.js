const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Property = require("./models/Property");
const BlockchainNode = require("./models/BlockchainNode");
const { createGenesisNode } = require("./services/blockchainService");

const extraProperties = [
  // Ramesh Kumar (LC-1001)
  {
    ulpin: "KA-MNG-101-R1",
    ownerUserId: "LC-1001",
    area: "1.5 acres",
    type: "Agricultural",
    location: "Bajpe, Mangaluru, Dakshina Kannada",
    village: "Bajpe",
    taluk: "Mangaluru",
    district: "Dakshina Kannada",
  },
  {
    ulpin: "KA-MNG-102-R2",
    ownerUserId: "LC-1001",
    area: "0.8 acres",
    type: "Residential",
    location: "Kottara, Mangaluru, Dakshina Kannada",
    village: "Kottara",
    taluk: "Mangaluru",
    district: "Dakshina Kannada",
  },
  {
    ulpin: "KA-MNG-103-R3",
    ownerUserId: "LC-1001",
    area: "2.0 acres",
    type: "Commercial",
    location: "Jeppu, Mangaluru, Dakshina Kannada",
    village: "Jeppu",
    taluk: "Mangaluru",
    district: "Dakshina Kannada",
  },

  // Suresh Patil (LC-1002)
  {
    ulpin: "KA-MNG-201-S1",
    ownerUserId: "LC-1002",
    area: "3.0 acres",
    type: "Agricultural",
    location: "Panambur, Mangaluru, Dakshina Kannada",
    village: "Panambur",
    taluk: "Mangaluru",
    district: "Dakshina Kannada",
  },
  {
    ulpin: "KA-MNG-202-S2",
    ownerUserId: "LC-1002",
    area: "1.1 acres",
    type: "Residential",
    location: "Surathkal, Mangaluru, Dakshina Kannada",
    village: "Surathkal",
    taluk: "Mangaluru",
    district: "Dakshina Kannada",
  },
  {
    ulpin: "KA-MNG-203-S3",
    ownerUserId: "LC-1002",
    area: "0.5 acres",
    type: "Residential",
    location: "Kadri, Mangaluru, Dakshina Kannada",
    village: "Kadri",
    taluk: "Mangaluru",
    district: "Dakshina Kannada",
  },

  // Deepak Gowda (LC-1003)
  {
    ulpin: "KA-MNG-301-D1",
    ownerUserId: "LC-1003",
    area: "2.2 acres",
    type: "Agricultural",
    location: "Kulshekar, Mangaluru, Dakshina Kannada",
    village: "Kulshekar",
    taluk: "Mangaluru",
    district: "Dakshina Kannada",
  },
  {
    ulpin: "KA-MNG-302-D2",
    ownerUserId: "LC-1003",
    area: "0.7 acres",
    type: "Residential",
    location: "Ullal, Mangaluru, Dakshina Kannada",
    village: "Ullal",
    taluk: "Mangaluru",
    district: "Dakshina Kannada",
  },
  {
    ulpin: "KA-MNG-303-D3",
    ownerUserId: "LC-1003",
    area: "1.8 acres",
    type: "Agricultural",
    location: "Bejai, Mangaluru, Dakshina Kannada",
    village: "Bejai",
    taluk: "Mangaluru",
    district: "Dakshina Kannada",
  },
];

async function addProperties() {
  try {
    console.log("[AddProperties] Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("[AddProperties] Connected.");

    for (const data of extraProperties) {
      // Check if property already exists
      const existing = await Property.findOne({ ulpin: data.ulpin });
      if (existing) {
        console.log(`[AddProperties] Property ${data.ulpin} already exists. Skipping.`);
        continue;
      }

      // Create property
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
          { year: 2023, amount: 2500, status: "Paid" },
          { year: 2024, amount: 2700, status: "Paid" },
        ],
      });
      await property.save();
      console.log(`[AddProperties] Created Property: ${property.ulpin} owned by ${property.ownerUserId}`);

      // Create genesis node in blockchain
      const blockchainRes = await BlockchainNode.findOne({ ulpin: data.ulpin });
      if (!blockchainRes) {
        await createGenesisNode(data.ulpin, data.ownerUserId);
        console.log(`[AddProperties] Created Genesis block for ULPIN ${data.ulpin}`);
      }
    }

    console.log("[AddProperties] Extra properties added successfully.");
    process.exit(0);
  } catch (err) {
    console.error("[AddProperties] Error:", err);
    process.exit(1);
  }
}

addProperties();
