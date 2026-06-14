const express = require("express");
const router = express.Router();

const API_KEY = "sk_tonhvhwo_v1etL1qQ6YfjapwVn3tJdjsT";
const SARVAM_BASE_URL = "https://api.sarvam.ai";

function sarvamHeaders(extra = {}) {
  return {
    "api-subscription-key": API_KEY,
    authorization: `Bearer ${API_KEY}`,
    ...extra
  };
}

async function requestSarvam(path, options) {
  const response = await fetch(`${SARVAM_BASE_URL}${path}`, options);
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.arrayBuffer();

  if (!response.ok) {
    const message =
      isJson && payload?.error?.message
        ? payload.error.message
        : isJson && payload?.message
          ? payload.message
          : `Sarvam API returned HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return { payload, contentType };
}

function extractReplyText(payload) {
  const candidates = [
    payload?.choices?.[0]?.message?.content,
    payload?.choices?.[0]?.text,
    payload?.output_text,
    payload?.output?.text,
    payload?.message?.content,
    payload?.content,
    payload?.text,
    payload?.answer,
    payload?.response,
    payload?.data?.content,
    payload?.data?.text,
    payload?.data?.answer
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }

  return "";
}

function cleanAssistantReply(text) {
  let cleaned = text.trim();
  // Strip both closed and unclosed think/thought blocks (to handle truncation gracefully)
  cleaned = cleaned.replace(/<(?:think|thought)>[\s\S]*?(?:<\/(?:think|thought)>|$)/gi, "").trim();
  cleaned = cleaned.replace(/^```[\s\S]*?```$/g, "").trim();
  cleaned = cleaned.replace(/\*\*|\*/g, "").trim(); // Remove bold asterisks for clean TTS read
  return cleaned;
}

function extractSafeTextFromReasoning(payload) {
  const reasoning = payload?.choices?.[0]?.message?.reasoning_content || payload?.choices?.[0]?.message?.content || "";
  if (typeof reasoning !== "string" || !reasoning.trim()) return "";

  const quoted = [...reasoning.matchAll(/"([^"\n]{8,220})"/g)]
    .map((match) => match[1].trim())
    .filter((text) => {
      const lower = text.toLowerCase();
      return (
        !lower.includes("analyze") &&
        !lower.includes("core task") &&
        !lower.includes("persona") &&
        !lower.includes("pros:") &&
        !lower.includes("cons:") &&
        !lower.includes("system") &&
        !lower.includes("user said")
      );
    });

  return quoted.at(-1) || "";
}

router.post("/chat", async (req, res) => {
  try {
    const { messages, model } = req.body;
    
    const chatHistory = [...(messages || [])];
    const hasSystemPrompt = chatHistory.some(m => m.role === "system");
    if (!hasSystemPrompt) {
      chatHistory.unshift({
        role: "system",
        content: `You are the LandChain Voice Assistant. You help users navigate the app and answer land transfer queries.
Here are the tabs/pages and features available in LandChain:
- Dashboard: Overview of user's properties, total value, verified properties, pending transfers.
- Explore: Search properties by ULPIN (e.g., KA-MNG-142-3B). Displays Kaveri registration history, Panchayat tax status, litigation/court records, and an interactive Blockchain Explorer showing block hashes and audit reports.
- Transfer: Initiate property deeds/transfers, accept split transfers, download deeds, pay property tax.
- Inbox: View notifications and status updates.
- Dashboards: Registrar Dashboard (/registrar) for Sub-Registrar officers to review/sign deeds, and Panchayat Dashboard (/panchayat) for Gram Panchayat approvals.
- Land Transfer Rules: Unpaid taxes block transfer initiation. Transfers require Seller Sign, Buyer Sign, Registrar Approval, Panchayat Approval, and UPI Payment before blockchain is updated and ownership is transferred.
- Split property request: Owners can split a parent land parcel (with approved government divisions) into multiple child parcels, which pre-signs and sends split transfer offers to target buyers.

Rules:
1. Keep replies extremely brief, clear, and direct. Only reply with the final text the user should hear (1-3 sentences max).
2. Never include reasoning tags like <think>, markdown formatting, bold tags, or markdown code blocks.
3. Be conversational, friendly, and helpful.`
      });
    }

    const { payload } = await requestSarvam("/v1/chat/completions", {
      method: "POST",
      headers: sarvamHeaders({ "content-type": "application/json" }),
      body: JSON.stringify({
        model: model || "sarvam-30b",
        messages: chatHistory,
        temperature: 0.45,
        max_tokens: 1200
      })
    });

    console.log("[LandChain Voice] Sarvam Payload:", JSON.stringify(payload, null, 2));
    const replyText = extractReplyText(payload);
    console.log("[LandChain Voice] Extracted reply text:", replyText);
    let reply = cleanAssistantReply(replyText);
    if (!reply) {
      reply = extractSafeTextFromReasoning(payload);
      console.log("[LandChain Voice] Fallback to safe text from reasoning:", reply);
    }
    console.log("[LandChain Voice] Cleaned reply:", reply);
    res.json({ reply });
  } catch (error) {
    console.error("[LandChain Voice] Chat error:", error);
    res.status(error.status || 500).json({ error: error.message || "Failed to query Sarvam Chat" });
  }
});

router.post("/tts", async (req, res) => {
  try {
    const { text, language, speaker } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required for speech synthesis" });
    }

    const { payload } = await requestSarvam("/text-to-speech", {
      method: "POST",
      headers: sarvamHeaders({ "content-type": "application/json" }),
      body: JSON.stringify({
        inputs: [text.slice(0, 1500)],
        target_language_code: language || "en-IN",
        speaker: speaker || "anushka",
        pace: 1,
        loudness: 1,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
        model: "bulbul:v2"
      })
    });

    let audioBase64 = "";
    let mimeType = "audio/wav";
    if (payload instanceof ArrayBuffer) {
      audioBase64 = Buffer.from(payload).toString("base64");
    } else {
      audioBase64 = payload?.audios?.[0] || payload?.audio?.content || payload?.audio || "";
      mimeType = payload?.mime_type || "audio/wav";
    }

    res.json({ audioBase64, mimeType });
  } catch (error) {
    console.error("[LandChain Voice] TTS error:", error);
    res.status(error.status || 500).json({ error: error.message || "Failed to query Sarvam TTS" });
  }
});

router.post("/voice", express.raw({ type: "audio/*", limit: "10mb" }), async (req, res) => {
  try {
    const audioBuffer = req.body;
    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({ error: "Audio data is required" });
    }

    const blob = new Blob([audioBuffer], {
      type: req.headers["content-type"] || "audio/webm"
    });
    const form = new FormData();
    form.append("file", blob, "speech.webm");
    form.append("model", "saarika:v2.5");
    form.append("language_code", req.headers["x-language-code"] || "en-IN");

    const { payload } = await requestSarvam("/speech-to-text", {
      method: "POST",
      headers: sarvamHeaders(),
      body: form
    });

    const transcript =
      payload?.transcript ||
      payload?.text ||
      payload?.transcripts?.[0]?.text ||
      "";

    res.json({ transcript });
  } catch (error) {
    console.error("[LandChain Voice] STT error:", error);
    res.status(error.status || 500).json({ error: error.message || "Failed to query Sarvam STT" });
  }
});

module.exports = router;
