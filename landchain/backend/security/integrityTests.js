const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const crypto = require("crypto");

// Load env variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const hashService = require("./hashService");
const integrityChecker = require("./integrityChecker");
const BlockchainNode = require("../models/BlockchainNode");

function assert(condition, message) {
  if (!condition) {
    throw new Error("Assertion failed: " + message);
  }
}

async function runTests() {
  console.log("[LandChain Security] Connecting to database for tests...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("[LandChain Security] Database connected.");

  try {
    // ----------------------------------------------------
    // Test 1 — Hash consistency
    // ----------------------------------------------------
    console.log("Running Test 1: Hash consistency...");
    const mockNode1 = {
      nodeId: "NODE-TEST-1",
      ulpin: "KA-TEST-100",
      POID: "LC-1001",
      COID: "LC-1002",
      previousNodeId: null,
      timestamp: new Date("2026-06-14T01:00:00.000Z"),
      transferId: "TXN-TEST-1",
    };
    const hashA = hashService.computeHash(mockNode1);
    const hashB = hashService.computeHash(mockNode1);
    assert(hashA === hashB, "Hashes of identical node must match");
    console.log("Test 1: PASS");

    // ----------------------------------------------------
    // Test 2 — Tamper detection
    // ----------------------------------------------------
    console.log("Running Test 2: Tamper detection...");
    const mockNode2 = {
      nodeId: "NODE-TEST-2",
      ulpin: "KA-TEST-200",
      POID: "LC-1001",
      COID: "LC-1002",
      previousNodeId: "NODE-PREV",
      timestamp: new Date("2026-06-14T01:00:00.000Z"),
      transferId: "TXN-TEST-2",
    };
    mockNode2.blockHash = hashService.computeHash(mockNode2);
    
    // Node is untampered initially
    let verify = hashService.verifyHash(mockNode2);
    assert(verify.valid === true, "Node should be valid initially");
    assert(verify.tampered === false, "Node should not be tampered initially");

    // Tamper the node COID
    mockNode2.COID = "LC-TAMPERED";
    verify = hashService.verifyHash(mockNode2);
    assert(verify.valid === false, "Node should be invalid after tampering");
    assert(verify.tampered === true, "Node should be flagged as tampered");
    console.log("Test 2: PASS");

    // ----------------------------------------------------
    // Test 3 — Field order sensitivity
    // ----------------------------------------------------
    console.log("Running Test 3: Field order sensitivity...");
    const mockNode3 = {
      nodeId: "NODE-TEST-3",
      ulpin: "KA-TEST-300",
      POID: "LC-1001",
      COID: "LC-1002",
      previousNodeId: null,
      timestamp: new Date("2026-06-14T01:00:00.000Z"),
      transferId: "TXN-TEST-3",
    };
    const correctHash = hashService.computeHash(mockNode3);
    
    // Hash with different order: POID first, then nodeId, etc.
    const wrongOrderInput = [
      mockNode3.POID,
      mockNode3.ulpin,
      mockNode3.nodeId,
      mockNode3.COID,
      "null",
      new Date(mockNode3.timestamp).toISOString(),
      mockNode3.transferId,
    ].join("|");
    const wrongHash = crypto.createHash("sha256").update(wrongOrderInput).digest("hex");
    
    assert(correctHash !== wrongHash, "Changing order of fields must result in different hashes");
    console.log("Test 3: PASS");

    // ----------------------------------------------------
    // Test 4 — Chain linkage check
    // ----------------------------------------------------
    console.log("Running Test 4: Chain linkage check...");
    const testUlpin = "KA-LINK-TEST-999";
    
    // Clean any prior tests
    await BlockchainNode.deleteMany({ ulpin: testUlpin });

    const n1 = new BlockchainNode({
      nodeId: "NODE-L1",
      ulpin: testUlpin,
      POID: "GOVERNMENT",
      COID: "USER-A",
      previousNodeId: null,
      timestamp: new Date("2026-06-14T01:00:00.000Z"),
    });
    n1.blockHash = hashService.computeHash(n1);
    await n1.save();

    const n2 = new BlockchainNode({
      nodeId: "NODE-L2",
      ulpin: testUlpin,
      POID: "USER-A",
      COID: "USER-B",
      previousNodeId: "NODE-L1",
      timestamp: new Date("2026-06-14T01:01:00.000Z"),
    });
    n2.blockHash = hashService.computeHash(n2);
    await n2.save();

    const n3 = new BlockchainNode({
      nodeId: "NODE-L3",
      ulpin: testUlpin,
      POID: "USER-B",
      COID: "USER-C",
      previousNodeId: "NODE-L2",
      timestamp: new Date("2026-06-14T01:02:00.000Z"),
    });
    n3.blockHash = hashService.computeHash(n3);
    await n3.save();

    // Verify linkage initially
    let chainIntegrity = await integrityChecker.checkChainIntegrity(testUlpin);
    assert(chainIntegrity.valid === true, "Valid chain must pass integrity check");
    assert(chainIntegrity.brokenLinks.length === 0, "No broken links expected");

    // Break the link by modifying previousNodeId on node 3 in the DB
    await BlockchainNode.updateOne({ nodeId: "NODE-L3" }, { previousNodeId: "NODE-BROKEN-LINK" });
    
    chainIntegrity = await integrityChecker.checkChainIntegrity(testUlpin);
    assert(chainIntegrity.valid === false, "Chain check must fail when link is broken");
    assert(chainIntegrity.brokenLinks.length === 1, "There should be exactly one broken link");
    assert(chainIntegrity.brokenLinks[0] === "NODE-L3", "Broken link must report NODE-L3");

    // Cleanup
    await BlockchainNode.deleteMany({ ulpin: testUlpin });
    console.log("Test 4: PASS");

    // ----------------------------------------------------
    // Test 5 — Genesis node check
    // ----------------------------------------------------
    console.log("Running Test 5: Genesis node check...");
    const mockGenesis = {
      nodeId: "NODE-GENESIS-5",
      ulpin: "KA-GEN-500",
      POID: "GOVERNMENT",
      COID: "LC-1001",
      previousNodeId: null,
      timestamp: new Date("2026-06-14T01:00:00.000Z"),
      transferId: null,
    };
    const inputStr = hashService.buildHashInput(mockGenesis);
    assert(inputStr.includes("|null|"), "buildHashInput must format missing previousNodeId as 'null' string");
    
    const hash = hashService.computeHash(mockGenesis);
    assert(typeof hash === "string" && hash.length === 64, "Hash must be computable as 64-char hex string");
    console.log("Test 5: PASS");

    console.log("\n[LandChain Security] ALL TESTS PASSED SUCCESSFULLY!");
  } catch (error) {
    console.error("\n[LandChain Security] TEST RUN FAILED:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("[LandChain Security] Database disconnected.");
  }
}

runTests();
