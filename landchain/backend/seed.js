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

// Import new government models
const StateRevenue = require("./models/StateRevenue");
const SubRegistrar = require("./models/SubRegistrar");
const PanchayatTax = require("./models/PanchayatTax");
const CourtRecord = require("./models/CourtRecord");

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

    // Clear new government source data
    await StateRevenue.deleteMany({});
    await SubRegistrar.deleteMany({});
    await PanchayatTax.deleteMany({});
    await CourtRecord.deleteMany({});

    console.log("[Seeder] Creating mock users...");
    // Create Ramesh (Seller/Owner)
    const ramesh = new User({
      name: "Ramesh Kumar",
      dob: "1980-05-15",
      aadhaarNumber: "111122223333",
      userId: "LC-1001",
    });
    await ramesh.save();

    // Create Suresh (Buyer 1/Owner)
    const suresh = new User({
      name: "Suresh Patil",
      dob: "1985-08-20",
      aadhaarNumber: "222233334444",
      userId: "LC-1002",
    });
    await suresh.save();

    // Create Deepak (Buyer 2/Owner)
    const deepak = new User({
      name: "Deepak Gowda",
      dob: "1990-12-10",
      aadhaarNumber: "333344445555",
      userId: "LC-1003",
    });
    await deepak.save();

    console.log(`[Seeder] Created Users:
    - Ramesh Kumar (UserID: ${ramesh.userId})
    - Suresh Patil (UserID: ${suresh.userId})
    - Deepak Gowda (UserID: ${deepak.userId})`);

    // ----------------------------------------------------
    // Seed Government Registry Database Tables
    // ----------------------------------------------------
    console.log("[Seeder] Seeding government database sources...");

    // 1. STATE REVENUE DEPT (details of land)
    await StateRevenue.create([
      // Ramesh Kumar (LC-1001)
      {
        ulpin: "KA-MNG-142-3B",
        surveyNumber: "142/3B",
        area: "2.4 acres",
        landType: "Agricultural",
        village: "Hosahalli",
        taluk: "Mangaluru",
        district: "Dakshina Kannada",
        state: "Karnataka",
        divisions: [
          { ulpin: "KA-MNG-142-3B/A", area: "1.2 acres" },
          { ulpin: "KA-MNG-142-3B/B", area: "1.2 acres" },
        ],
      },
      {
        ulpin: "KA-MNG-143-R1",
        surveyNumber: "143/1",
        area: "1.5 acres",
        landType: "Residential",
        village: "Hosahalli",
        taluk: "Mangaluru",
        district: "Dakshina Kannada",
        state: "Karnataka",
        divisions: [],
      },
      {
        ulpin: "KA-MNG-144-R2",
        surveyNumber: "144/2",
        area: "0.9 acres",
        landType: "Residential",
        village: "Hosahalli",
        taluk: "Mangaluru",
        district: "Dakshina Kannada",
        state: "Karnataka",
        divisions: [],
      },
      {
        ulpin: "KA-MNG-145-R3",
        surveyNumber: "145/3",
        area: "1.2 acres",
        landType: "Agricultural",
        village: "Hosahalli",
        taluk: "Mangaluru",
        district: "Dakshina Kannada",
        state: "Karnataka",
        divisions: [],
      },
      // Suresh Patil (LC-1002)
      {
        ulpin: "KA-MNG-201-S1",
        surveyNumber: "201/1",
        area: "3.0 acres",
        landType: "Agricultural",
        village: "Kaup",
        taluk: "Udupi",
        district: "Udupi",
        state: "Karnataka",
        divisions: [],
      },
      {
        ulpin: "KA-MNG-102-R2",
        surveyNumber: "102/2",
        area: "0.8 acres",
        landType: "Residential",
        village: "Hosahalli",
        taluk: "Mangaluru",
        district: "Dakshina Kannada",
        state: "Karnataka",
        divisions: [],
      },
      {
        ulpin: "KA-MNG-202-S2",
        surveyNumber: "202/2",
        area: "1.1 acres",
        landType: "Residential",
        village: "Kaup",
        taluk: "Udupi",
        district: "Udupi",
        state: "Karnataka",
        divisions: [],
      },
      {
        ulpin: "KA-MNG-203-S3",
        surveyNumber: "203/3",
        area: "0.5 acres",
        landType: "Residential",
        village: "Kaup",
        taluk: "Udupi",
        district: "Udupi",
        state: "Karnataka",
        divisions: [],
      },
      // Deepak Gowda (LC-1003)
      {
        ulpin: "KA-MNG-301-D1",
        surveyNumber: "301/1",
        area: "2.2 acres",
        landType: "Agricultural",
        village: "Mulki",
        taluk: "Mangaluru",
        district: "Dakshina Kannada",
        state: "Karnataka",
        divisions: [],
      },
      {
        ulpin: "KA-MNG-302-D2",
        surveyNumber: "302/2",
        area: "0.7 acres",
        landType: "Residential",
        village: "Mulki",
        taluk: "Mangaluru",
        district: "Dakshina Kannada",
        state: "Karnataka",
        divisions: [],
      },
      {
        ulpin: "KA-MNG-303-D3",
        surveyNumber: "303/3",
        area: "1.8 acres",
        landType: "Agricultural",
        village: "Mulki",
        taluk: "Mangaluru",
        district: "Dakshina Kannada",
        state: "Karnataka",
        divisions: [],
      },
      {
        ulpin: "KA-MNG-304-D4",
        surveyNumber: "304/4",
        area: "2.0 acres",
        landType: "Agricultural",
        village: "Mulki",
        taluk: "Mangaluru",
        district: "Dakshina Kannada",
        state: "Karnataka",
        divisions: [],
      },
    ]);

    // 2. SUB-REGISTRAR (history of owners / encumbrances)
    await SubRegistrar.create([
      // Ramesh
      {
        ulpin: "KA-MNG-142-3B",
        encumbrances: "None",
        mortgageStatus: "Clear",
        registrationHistory: [
          { date: "10/05/2021", deedNumber: "DEED-2021-9981", volume: "I", page: "25", transactionType: "Gift", seller: "Government", buyer: "Ramesh Kumar", considerationAmount: 0 },
        ],
      },
      {
        ulpin: "KA-MNG-143-R1",
        encumbrances: "None",
        mortgageStatus: "Clear",
        registrationHistory: [
          { date: "12/06/2021", deedNumber: "DEED-2021-9982", volume: "I", page: "30", transactionType: "Gift", seller: "Government", buyer: "Ramesh Kumar", considerationAmount: 0 },
        ],
      },
      {
        ulpin: "KA-MNG-144-R2",
        encumbrances: "Active Mortgage to ICICI Bank for Rs. 35,00,000",
        mortgageStatus: "Active Mortgage",
        registrationHistory: [
          { date: "14/07/2021", deedNumber: "DEED-2021-9983", volume: "I", page: "35", transactionType: "Gift", seller: "Government", buyer: "Ramesh Kumar", considerationAmount: 0 },
        ],
      },
      {
        ulpin: "KA-MNG-145-R3",
        encumbrances: "None",
        mortgageStatus: "Clear",
        registrationHistory: [
          { date: "16/08/2021", deedNumber: "DEED-2021-9984", volume: "I", page: "40", transactionType: "Gift", seller: "Government", buyer: "Ramesh Kumar", considerationAmount: 0 },
        ],
      },
      // Suresh
      {
        ulpin: "KA-MNG-201-S1",
        encumbrances: "None",
        mortgageStatus: "Clear",
        registrationHistory: [
          { date: "15/08/2022", deedNumber: "DEED-2022-4112", volume: "II", page: "12", transactionType: "Gift", seller: "Government", buyer: "Suresh Patil", considerationAmount: 0 },
        ],
      },
      {
        ulpin: "KA-MNG-102-R2",
        encumbrances: "Active Mortgage to State Bank of India for Rs. 50,00,000",
        mortgageStatus: "Active Mortgage",
        registrationHistory: [
          { date: "04/04/2024", deedNumber: "DEED-2024-3011", volume: "V", page: "90", transactionType: "Gift", seller: "Government", buyer: "Suresh Patil", considerationAmount: 0 },
        ],
      },
      {
        ulpin: "KA-MNG-202-S2",
        encumbrances: "None",
        mortgageStatus: "Clear",
        registrationHistory: [
          { date: "18/09/2022", deedNumber: "DEED-2022-4113", volume: "II", page: "15", transactionType: "Gift", seller: "Government", buyer: "Suresh Patil", considerationAmount: 0 },
        ],
      },
      {
        ulpin: "KA-MNG-203-S3",
        encumbrances: "None",
        mortgageStatus: "Clear",
        registrationHistory: [
          { date: "20/10/2022", deedNumber: "DEED-2022-4114", volume: "II", page: "18", transactionType: "Gift", seller: "Government", buyer: "Suresh Patil", considerationAmount: 0 },
        ],
      },
      // Deepak
      {
        ulpin: "KA-MNG-301-D1",
        encumbrances: "None",
        mortgageStatus: "Clear",
        registrationHistory: [
          { date: "20/09/2023", deedNumber: "DEED-2023-8874", volume: "I", page: "50", transactionType: "Gift", seller: "Government", buyer: "Deepak Gowda", considerationAmount: 0 },
        ],
      },
      {
        ulpin: "KA-MNG-302-D2",
        encumbrances: "None",
        mortgageStatus: "Clear",
        registrationHistory: [
          { date: "22/10/2023", deedNumber: "DEED-2023-8875", volume: "I", page: "55", transactionType: "Gift", seller: "Government", buyer: "Deepak Gowda", considerationAmount: 0 },
        ],
      },
      {
        ulpin: "KA-MNG-303-D3",
        encumbrances: "None",
        mortgageStatus: "Clear",
        registrationHistory: [
          { date: "24/11/2023", deedNumber: "DEED-2023-8876", volume: "I", page: "60", transactionType: "Gift", seller: "Government", buyer: "Deepak Gowda", considerationAmount: 0 },
        ],
      },
      {
        ulpin: "KA-MNG-304-D4",
        encumbrances: "None",
        mortgageStatus: "Clear",
        registrationHistory: [
          { date: "26/12/2023", deedNumber: "DEED-2023-8877", volume: "I", page: "65", transactionType: "Gift", seller: "Government", buyer: "Deepak Gowda", considerationAmount: 0 },
        ],
      },
    ]);

    // 3. PANCHAYAT TAX (tax status and history)
    await PanchayatTax.create([
      // Ramesh
      {
        ulpin: "KA-MNG-142-3B",
        taxStatus: "Paid up to 2024-25",
        taxRecords: [
          { year: 2022, amount: 4200, status: "Paid" },
          { year: 2023, amount: 4500, status: "Paid" },
          { year: 2024, amount: 4800, status: "Paid" },
        ],
      },
      {
        ulpin: "KA-MNG-143-R1",
        taxStatus: "Paid up to 2024-25",
        taxRecords: [
          { year: 2022, amount: 2500, status: "Paid" },
          { year: 2023, amount: 2600, status: "Paid" },
          { year: 2024, amount: 2700, status: "Paid" },
        ],
      },
      {
        ulpin: "KA-MNG-144-R2",
        taxStatus: "Paid up to 2024-25",
        taxRecords: [
          { year: 2022, amount: 1800, status: "Paid" },
          { year: 2023, amount: 1900, status: "Paid" },
          { year: 2024, amount: 2000, status: "Paid" },
        ],
      },
      {
        ulpin: "KA-MNG-145-R3",
        taxStatus: "Unpaid",
        taxRecords: [
          { year: 2022, amount: 3100, status: "Paid" },
          { year: 2023, amount: 3300, status: "Unpaid" },
          { year: 2024, amount: 3500, status: "Unpaid" },
        ],
      },
      // Suresh
      {
        ulpin: "KA-MNG-201-S1",
        taxStatus: "Paid up to 2024-25",
        taxRecords: [
          { year: 2022, amount: 3000, status: "Paid" },
          { year: 2023, amount: 3000, status: "Paid" },
          { year: 2024, amount: 3200, status: "Paid" },
        ],
      },
      {
        ulpin: "KA-MNG-102-R2",
        taxStatus: "Paid up to 2024-25",
        taxRecords: [
          { year: 2022, amount: 1500, status: "Paid" },
          { year: 2023, amount: 1600, status: "Paid" },
          { year: 2024, amount: 1700, status: "Paid" },
        ],
      },
      {
        ulpin: "KA-MNG-202-S2",
        taxStatus: "Paid up to 2024-25",
        taxRecords: [
          { year: 2022, amount: 2200, status: "Paid" },
          { year: 2023, amount: 2300, status: "Paid" },
          { year: 2024, amount: 2400, status: "Paid" },
        ],
      },
      {
        ulpin: "KA-MNG-203-S3",
        taxStatus: "Paid up to 2024-25",
        taxRecords: [
          { year: 2022, amount: 1200, status: "Paid" },
          { year: 2023, amount: 1300, status: "Paid" },
          { year: 2024, amount: 1400, status: "Paid" },
        ],
      },
      // Deepak
      {
        ulpin: "KA-MNG-301-D1",
        taxStatus: "Unpaid",
        taxRecords: [
          { year: 2022, amount: 2000, status: "Paid" },
          { year: 2023, amount: 2200, status: "Unpaid" },
          { year: 2024, amount: 2400, status: "Unpaid" },
        ],
      },
      {
        ulpin: "KA-MNG-302-D2",
        taxStatus: "Paid up to 2024-25",
        taxRecords: [
          { year: 2022, amount: 2800, status: "Paid" },
          { year: 2023, amount: 2900, status: "Paid" },
          { year: 2024, amount: 3000, status: "Paid" },
        ],
      },
      {
        ulpin: "KA-MNG-303-D3",
        taxStatus: "Paid up to 2024-25",
        taxRecords: [
          { year: 2022, amount: 1900, status: "Paid" },
          { year: 2023, amount: 2000, status: "Paid" },
          { year: 2024, amount: 2100, status: "Paid" },
        ],
      },
      {
        ulpin: "KA-MNG-304-D4",
        taxStatus: "Paid up to 2024-25",
        taxRecords: [
          { year: 2022, amount: 3300, status: "Paid" },
          { year: 2023, amount: 3400, status: "Paid" },
          { year: 2024, amount: 3500, status: "Paid" },
        ],
      },
    ]);

    // 4. COURT RECORD (pending litigation / disputes)
    await CourtRecord.create([
      { ulpin: "KA-MNG-142-3B", litigationStatus: "Clear", pendingCases: [], attachmentOrders: "None", courtVerifiedOn: "14/06/2026" },
      { ulpin: "KA-MNG-143-R1", litigationStatus: "Clear", pendingCases: [], attachmentOrders: "None", courtVerifiedOn: "14/06/2026" },
      { ulpin: "KA-MNG-144-R2", litigationStatus: "Clear", pendingCases: [], attachmentOrders: "None", courtVerifiedOn: "14/06/2026" },
      { ulpin: "KA-MNG-145-R3", litigationStatus: "Clear", pendingCases: [], attachmentOrders: "None", courtVerifiedOn: "14/06/2026" },
      {
        ulpin: "KA-MNG-201-S1",
        litigationStatus: "Disputed",
        pendingCases: [
          {
            caseNumber: "OS 451/2024",
            courtName: "Civil Court Mangaluru",
            status: "Pending",
            description: "Boundary overlap dispute and injunction request",
            parties: "Deepak Gowda vs Suresh Patil",
            filedYear: 2024,
          },
        ],
        attachmentOrders: "Temporary Injunction active",
        courtVerifiedOn: "14/06/2026",
      },
      { ulpin: "KA-MNG-102-R2", litigationStatus: "Clear", pendingCases: [], attachmentOrders: "None", courtVerifiedOn: "14/06/2026" },
      { ulpin: "KA-MNG-202-S2", litigationStatus: "Clear", pendingCases: [], attachmentOrders: "None", courtVerifiedOn: "14/06/2026" },
      { ulpin: "KA-MNG-203-S3", litigationStatus: "Clear", pendingCases: [], attachmentOrders: "None", courtVerifiedOn: "14/06/2026" },
      { ulpin: "KA-MNG-301-D1", litigationStatus: "Clear", pendingCases: [], attachmentOrders: "None", courtVerifiedOn: "14/06/2026" },
      {
        ulpin: "KA-MNG-302-D2",
        litigationStatus: "Disputed",
        pendingCases: [
          {
            caseNumber: "OS 992/2025",
            courtName: "Civil Court Mangaluru",
            status: "Pending",
            description: "Inheritance dispute between family members",
            parties: "Deepak Gowda vs Ramesh Kumar",
            filedYear: 2025,
          },
        ],
        attachmentOrders: "Status Quo ordered",
        courtVerifiedOn: "14/06/2026",
      },
      { ulpin: "KA-MNG-303-D3", litigationStatus: "Clear", pendingCases: [], attachmentOrders: "None", courtVerifiedOn: "14/06/2026" },
      { ulpin: "KA-MNG-304-D4", litigationStatus: "Clear", pendingCases: [], attachmentOrders: "None", courtVerifiedOn: "14/06/2026" },
    ]);

    console.log("[Seeder] Seeding LandChain local properties...");

    // Seed Properties
    // 1. Ramesh Kumar (LC-1001)
    const p1 = new Property({
      landId: "LAND-100001",
      ulpin: "KA-MNG-142-3B",
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
    await p1.save();

    const p2 = new Property({
      landId: "LAND-100002",
      ulpin: "KA-MNG-143-R1",
      ownerUserId: ramesh.userId,
      area: "1.5 acres",
      type: "Residential",
      location: "Hosahalli, Mangaluru, Dakshina Kannada",
      village: "Hosahalli",
      taluk: "Mangaluru",
      district: "Dakshina Kannada",
      taxRecords: [
        { year: 2022, amount: 2500, status: "Paid" },
        { year: 2023, amount: 2600, status: "Paid" },
        { year: 2024, amount: 2700, status: "Paid" },
      ],
    });
    await p2.save();

    const p3 = new Property({
      landId: "LAND-100003",
      ulpin: "KA-MNG-144-R2",
      ownerUserId: ramesh.userId,
      area: "0.9 acres",
      type: "Residential",
      location: "Hosahalli, Mangaluru, Dakshina Kannada",
      village: "Hosahalli",
      taluk: "Mangaluru",
      district: "Dakshina Kannada",
      taxRecords: [
        { year: 2022, amount: 1800, status: "Paid" },
        { year: 2023, amount: 1900, status: "Paid" },
        { year: 2024, amount: 2000, status: "Paid" },
      ],
    });
    await p3.save();

    const p4 = new Property({
      landId: "LAND-100004",
      ulpin: "KA-MNG-145-R3",
      ownerUserId: ramesh.userId,
      area: "1.2 acres",
      type: "Agricultural",
      location: "Hosahalli, Mangaluru, Dakshina Kannada",
      village: "Hosahalli",
      taluk: "Mangaluru",
      district: "Dakshina Kannada",
      taxRecords: [
        { year: 2022, amount: 3100, status: "Paid" },
        { year: 2023, amount: 3300, status: "Unpaid" },
        { year: 2024, amount: 3500, status: "Unpaid" },
      ],
    });
    await p4.save();

    // 2. Suresh Patil (LC-1002)
    const p5 = new Property({
      landId: "LAND-100005",
      ulpin: "KA-MNG-201-S1",
      ownerUserId: suresh.userId,
      area: "3.0 acres",
      type: "Agricultural",
      location: "Kaup, Udupi, Udupi",
      village: "Kaup",
      taluk: "Udupi",
      district: "Udupi",
      taxRecords: [
        { year: 2022, amount: 3000, status: "Paid" },
        { year: 2023, amount: 3000, status: "Paid" },
        { year: 2024, amount: 3200, status: "Paid" },
      ],
    });
    await p5.save();

    const p6 = new Property({
      landId: "LAND-100006",
      ulpin: "KA-MNG-102-R2",
      ownerUserId: suresh.userId,
      area: "0.8 acres",
      type: "Residential",
      location: "Hosahalli, Mangaluru, Dakshina Kannada",
      village: "Hosahalli",
      taluk: "Mangaluru",
      district: "Dakshina Kannada",
      taxRecords: [
        { year: 2022, amount: 1500, status: "Paid" },
        { year: 2023, amount: 1600, status: "Paid" },
        { year: 2024, amount: 1700, status: "Paid" },
      ],
    });
    await p6.save();

    const p7 = new Property({
      landId: "LAND-100007",
      ulpin: "KA-MNG-202-S2",
      ownerUserId: suresh.userId,
      area: "1.1 acres",
      type: "Residential",
      location: "Kaup, Udupi, Udupi",
      village: "Kaup",
      taluk: "Udupi",
      district: "Udupi",
      taxRecords: [
        { year: 2022, amount: 2200, status: "Paid" },
        { year: 2023, amount: 2300, status: "Paid" },
        { year: 2024, amount: 2400, status: "Paid" },
      ],
    });
    await p7.save();

    const p8 = new Property({
      landId: "LAND-100008",
      ulpin: "KA-MNG-203-S3",
      ownerUserId: suresh.userId,
      area: "0.5 acres",
      type: "Residential",
      location: "Kaup, Udupi, Udupi",
      village: "Kaup",
      taluk: "Udupi",
      district: "Udupi",
      taxRecords: [
        { year: 2022, amount: 1200, status: "Paid" },
        { year: 2023, amount: 1300, status: "Paid" },
        { year: 2024, amount: 1400, status: "Paid" },
      ],
    });
    await p8.save();

    // 3. Deepak Gowda (LC-1003)
    const p9 = new Property({
      landId: "LAND-100009",
      ulpin: "KA-MNG-301-D1",
      ownerUserId: deepak.userId,
      area: "2.2 acres",
      type: "Agricultural",
      location: "Mulki, Mangaluru, Dakshina Kannada",
      village: "Mulki",
      taluk: "Mangaluru",
      district: "Dakshina Kannada",
      taxRecords: [
        { year: 2022, amount: 2000, status: "Paid" },
        { year: 2023, amount: 2200, status: "Unpaid" },
        { year: 2024, amount: 2400, status: "Unpaid" },
      ],
    });
    await p9.save();

    const p10 = new Property({
      landId: "LAND-100010",
      ulpin: "KA-MNG-302-D2",
      ownerUserId: deepak.userId,
      area: "0.7 acres",
      type: "Residential",
      location: "Mulki, Mangaluru, Dakshina Kannada",
      village: "Mulki",
      taluk: "Mangaluru",
      district: "Dakshina Kannada",
      taxRecords: [
        { year: 2022, amount: 2800, status: "Paid" },
        { year: 2023, amount: 2900, status: "Paid" },
        { year: 2024, amount: 3000, status: "Paid" },
      ],
    });
    await p10.save();

    const p11 = new Property({
      landId: "LAND-100011",
      ulpin: "KA-MNG-303-D3",
      ownerUserId: deepak.userId,
      area: "1.8 acres",
      type: "Agricultural",
      location: "Mulki, Mangaluru, Dakshina Kannada",
      village: "Mulki",
      taluk: "Mangaluru",
      district: "Dakshina Kannada",
      taxRecords: [
        { year: 2022, amount: 1900, status: "Paid" },
        { year: 2023, amount: 2000, status: "Paid" },
        { year: 2024, amount: 2100, status: "Paid" },
      ],
    });
    await p11.save();

    const p12 = new Property({
      landId: "LAND-100012",
      ulpin: "KA-MNG-304-D4",
      ownerUserId: deepak.userId,
      area: "2.0 acres",
      type: "Agricultural",
      location: "Mulki, Mangaluru, Dakshina Kannada",
      village: "Mulki",
      taluk: "Mangaluru",
      district: "Dakshina Kannada",
      taxRecords: [
        { year: 2022, amount: 3300, status: "Paid" },
        { year: 2023, amount: 3400, status: "Paid" },
        { year: 2024, amount: 3500, status: "Paid" },
      ],
    });
    await p12.save();

    console.log("[Seeder] Creating Genesis Blockchain Nodes for seeded properties...");
    await createGenesisNode("KA-MNG-142-3B", ramesh.userId);
    await createGenesisNode("KA-MNG-143-R1", ramesh.userId);
    await createGenesisNode("KA-MNG-144-R2", ramesh.userId);
    await createGenesisNode("KA-MNG-145-R3", ramesh.userId);

    await createGenesisNode("KA-MNG-201-S1", suresh.userId);
    await createGenesisNode("KA-MNG-102-R2", suresh.userId);
    await createGenesisNode("KA-MNG-202-S2", suresh.userId);
    await createGenesisNode("KA-MNG-203-S3", suresh.userId);

    await createGenesisNode("KA-MNG-301-D1", deepak.userId);
    await createGenesisNode("KA-MNG-302-D2", deepak.userId);
    await createGenesisNode("KA-MNG-303-D3", deepak.userId);
    await createGenesisNode("KA-MNG-304-D4", deepak.userId);

    console.log("[Seeder] Seeding mock transfers for Registrar and Panchayat dashboards...");
    const t1 = new Transfer({
      transferId: "TXN-1718250100000",
      ulpin: "KA-MNG-102-R2",
      sellerUserId: suresh.userId,
      sellerName: suresh.name,
      buyerUserId: ramesh.userId,
      buyerName: ramesh.name,
      price: 2400000,
      agreementConditions: "Vacant possession to be handed over within 30 days.",
      status: "REGISTRAR_REVIEW",
      geminiSummary: {
        summary: "WARNING: Sub-Registrar registry indicates an active outstanding bank mortgage on this parcel to State Bank of India for Rs. 50,00,000.",
        riskLevel: "HIGH",
        flags: [
          "Active bank mortgage encumbrance to State Bank of India"
        ],
        landDetails: {
          area: "0.8 acres",
          type: "Residential",
          location: "Hosahalli, Mangaluru, Dakshina Kannada",
          surveyNumber: "102/2",
        },
      },
      sellerSignature: {
        signed: true,
        timestamp: new Date(),
      },
      buyerSignature: {
        signed: true,
        timestamp: new Date(),
      },
    });
    await t1.save();

    const t2 = new Transfer({
      transferId: "TXN-1718250200000",
      ulpin: "KA-MNG-301-D1",
      sellerUserId: deepak.userId,
      sellerName: deepak.name,
      buyerUserId: ramesh.userId,
      buyerName: ramesh.name,
      price: 1800000,
      agreementConditions: "Tax clearances to be provided before registry approval.",
      status: "PANCHAYAT_REVIEW",
      geminiSummary: {
        summary: "WARNING: Gram Panchayat tax records indicate multiple years of unpaid property taxes.",
        riskLevel: "MEDIUM",
        flags: [
          "Outstanding unpaid property taxes for years 2023, 2024"
        ],
        landDetails: {
          area: "2.2 acres",
          type: "Agricultural",
          location: "Mulki, Mangaluru, Dakshina Kannada",
          surveyNumber: "301/1",
        },
      },
      sellerSignature: {
        signed: true,
        timestamp: new Date(),
      },
      buyerSignature: {
        signed: true,
        timestamp: new Date(),
      },
      registrarAction: {
        approved: true,
        timestamp: new Date(),
        comment: "Seeded approval",
      },
    });
    await t2.save();

    console.log("[Seeder] Seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("[Seeder] Seeding error:", error);
    process.exit(1);
  }
}

seed();
