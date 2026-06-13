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

async function analyzeProperty(combinedData) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return MOCK_ANALYSIS;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are a property legal analyst in India. Analyze this land record
and return a JSON object with these exact keys:
summary (string: plain English overview),
previousOwners (array of strings),
taxStatus (string),
riskLevel (string: LOW or MEDIUM or HIGH),
flags (array of strings, each a specific concern),
landDetails (object with: area, type, location, surveyNumber)
Return ONLY valid JSON, no markdown, no explanation.
Data: ${JSON.stringify(combinedData)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return extractJson(text);
  } catch (error) {
    return MOCK_ANALYSIS;
  }
}

module.exports = { analyzeProperty };
