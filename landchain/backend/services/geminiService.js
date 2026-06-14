const { GoogleGenerativeAI } = require("@google/generative-ai");

const MOCK_ANALYSIS = {
  summary:
    "Agricultural land in Dakshina Kannada, Karnataka. Clear ownership history with no disputes found.",
  previousOwners: ["Suresh Kumar (1998-2015)", "Ramesh Kumar (2015-present)"],
  taxStatus: "Paid up to 2024-25",
  riskLevel: "LOW",
  flags: [],
  landDetails: {
    area: "2.4 acres",
    type: "Agricultural",
    location: "Hosahalli Village, Mangaluru Taluk",
    surveyNumber: "142/3B",
  },
};

function extractJson(text) {
  const trimmedText = String(text || "").trim();

  if (!trimmedText) {
    throw new Error("Empty Gemini response");
  }

  try {
    return JSON.parse(trimmedText);
  } catch (error) {
    const jsonMatch = trimmedText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw error;
    }

    return JSON.parse(jsonMatch[0]);
  }
}

function smartLocalAnalyze(combinedData) {
  const revenue = combinedData.revenue || combinedData.revenueData || {};
  const kaveri = combinedData.kaveri || combinedData.kaveriData || {};
  const court = combinedData.court || combinedData.courtData || {};

  const analysis = {
    summary: "Land parcel records analyzed.",
    previousOwners: revenue.previousOwners || [],
    taxStatus: revenue.taxStatus || kaveri.taxStatus || "Paid up to 2024-25",
    riskLevel: "LOW",
    flags: [],
    landDetails: {
      area: revenue.area || "N/A",
      type: revenue.landType || "Agricultural",
      location: revenue.location || (revenue.village ? `${revenue.village}, ${revenue.taluk || ""}, ${revenue.district || ""}`.replace(/,\s*,/, ",").trim() : "N/A"),
      surveyNumber: revenue.surveyNumber || "N/A",
    }
  };

  const flags = [];
  let riskLevel = "LOW";
  let summaryParts = [];

  // Check mortgage status in Sub-Registrar / Kaveri data
  const hasMortgage = 
    (kaveri.mortgageStatus && String(kaveri.mortgageStatus).toLowerCase() !== "clear" && String(kaveri.mortgageStatus).toLowerCase() !== "none") || 
    (kaveri.encumbrances && String(kaveri.encumbrances).toLowerCase() !== "none" && String(kaveri.encumbrances).toLowerCase().includes("mortgage"));
  
  if (hasMortgage) {
    flags.push(`Active bank mortgage encumbrance: ${kaveri.encumbrances || "Outstanding mortgage"}`);
    riskLevel = "HIGH";
    summaryParts.push("WARNING: Sub-Registrar registry indicates an active outstanding bank mortgage on this parcel.");
  }

  // Check court records
  const hasLitigation = 
    (court.litigationStatus && String(court.litigationStatus).toLowerCase() !== "clear" && String(court.litigationStatus).toLowerCase() !== "none") ||
    (court.pendingCases && court.pendingCases.length > 0) ||
    (court.attachmentOrders && String(court.attachmentOrders).toLowerCase() !== "none");

  if (hasLitigation) {
    const caseDesc = court.pendingCases?.[0] 
      ? `${court.pendingCases[0].caseNumber} - ${court.pendingCases[0].description}`
      : (court.attachmentOrders !== "None" ? court.attachmentOrders : "Pending court dispute");
    flags.push(`Active court litigation/dispute: ${caseDesc}`);
    riskLevel = "HIGH";
    summaryParts.push("WARNING: Court records indicate active disputes or pending litigation on this parcel.");
  }

  // Check tax status
  const hasUnpaidTax = 
    (revenue.taxStatus && String(revenue.taxStatus).toLowerCase() === "unpaid") ||
    (revenue.taxRecords && revenue.taxRecords.some(r => String(r.status).toLowerCase() === "unpaid"));

  if (hasUnpaidTax) {
    flags.push("Outstanding unpaid property taxes detected.");
    if (riskLevel !== "HIGH") {
      riskLevel = "MEDIUM";
    }
    summaryParts.push("WARNING: Gram Panchayat tax records indicate multiple years of unpaid property taxes.");
  }

  if (flags.length === 0) {
    summaryParts.push("Property records appear clear with no active disputes, mortgages, or unpaid taxes found.");
  }

  analysis.riskLevel = riskLevel;
  analysis.flags = flags;
  analysis.summary = summaryParts.join(" ");

  return analysis;
}

async function analyzeProperty(combinedData) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return smartLocalAnalyze(combinedData);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are a property legal analyst in India. Analyze this land record
and return a JSON object with these exact keys:
summary (string: plain English overview),
previousOwners (array of strings),
taxStatus (string),
riskLevel (string: LOW or MEDIUM or HIGH),
flags (array of strings, each a specific concern),
landDetails (object with: area, type, location, surveyNumber)

CRITICAL INSTRUCTIONS:
1. The initial transfer of land from the Government ('Gov' or 'Government') to the first private owner is often executed as a 'Gift Deed' or 'Government Grant'. Do NOT flag this initial gift deed or grant from the Government as a risk, discrepancy, concern, or warning. It is a standard government allocation.
2. Only flag actual risks like active court litigations, pending injunctions, unpaid taxes, or active bank mortgages.

Return ONLY valid JSON, no markdown, no explanation.
Data: ${JSON.stringify(combinedData)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return extractJson(text);
  } catch (error) {
    console.error("[LandChain] Gemini API error, falling back to smart local analysis:", error.message);
    return smartLocalAnalyze(combinedData);
  }
}

module.exports = { analyzeProperty };

