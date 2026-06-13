const express = require("express");
const axios = require("axios");

const router = express.Router();

async function translateValue(value, targetLanguageCode) {
  if (!value) {
    return value;
  }

  if (typeof value === "string") {
    if (!value.trim()) {
      return value;
    }
    try {
      const response = await axios.post(
        "https://api.sarvam.ai/translate",
        {
          input: value,
          source_language_code: "en-IN",
          target_language_code: targetLanguageCode,
          model: "sarvam-translate:v1",
        },
        {
          headers: {
            "api-subscription-key": "sk_m20os3v9_9ooM8NGSppgsLOw9ECWGhHnu",
            "Content-Type": "application/json",
          },
        }
      );
      return response.data.translated_text || value;
    } catch (err) {
      console.error("Sarvam translation error for:", value, err.message);
      return value; // fallback
    }
  }

  if (Array.isArray(value)) {
    const results = [];
    for (const item of value) {
      results.push(await translateValue(item, targetLanguageCode));
    }
    return results;
  }

  if (typeof value === "object") {
    const results = {};
    for (const key of Object.keys(value)) {
      results[key] = await translateValue(value[key], targetLanguageCode);
    }
    return results;
  }

  return value;
}

router.post("/", async (req, res) => {
  try {
    const { texts, targetLanguageCode } = req.body;

    if (!texts || !targetLanguageCode) {
      return res.status(400).json({ error: "Missing texts or targetLanguageCode" });
    }

    if (targetLanguageCode === "en-IN") {
      return res.json({ translatedTexts: texts });
    }

    const translated = await translateValue(texts, targetLanguageCode);
    return res.json({ translatedTexts: translated });
  } catch (error) {
    console.error("Failed to translate:", error.message);
    return res.status(500).json({ error: "Failed to translate records" });
  }
});

module.exports = router;
