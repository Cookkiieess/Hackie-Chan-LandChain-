import React, { useState, useEffect, useRef, useMemo } from "react";
import { Mic, MicOff, Volume2, VolumeX, Trash2, Send, X, Sparkles, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";

const SUPPORTED_LANGUAGES = [
  { code: "en-IN", name: "English (India)" },
  { code: "hi-IN", name: "Hindi" },
  { code: "kn-IN", name: "Kannada" },
  { code: "ta-IN", name: "Tamil" },
  { code: "te-IN", name: "Telugu" },
  { code: "ml-IN", name: "Malayalam" },
  { code: "mr-IN", name: "Marathi" },
  { code: "bn-IN", name: "Bengali" },
  { code: "gu-IN", name: "Gujarati" },
  { code: "pa-IN", name: "Punjabi" }
];

const silenceConfig = {
  threshold: 0.018,
  minRecordingMs: 900,
  startGraceMs: 5000,
  stopAfterMs: 1200,
  maxRecordingMs: 20000
};

export default function VoiceAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("Ready"); // "Ready" | "Recording" | "Thinking" | "Speaking" | "Transcribing"
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I am your LandChain voice assistant. Speak or type to ask me about app navigation, split partition transfers, tax payments, or blockchain property audits!"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [language, setLanguage] = useState("en-IN");
  const [speakReplies, setSpeakReplies] = useState(true);

  // Audio & recording refs
  const currentAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceFrameIdRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  // Chat message history mapped for API payload
  const chatHistory = useMemo(() => {
    return messages.map((m) => ({
      role: m.role === "error" ? "user" : m.role,
      content: m.content
    }));
  }, [messages]);

  // Auto-scroll chat window
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Clean up recording stream & audio on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
      stopSilenceDetection();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const stopPlayback = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    window.speechSynthesis?.cancel();
  };

  const stopSilenceDetection = () => {
    if (silenceFrameIdRef.current) {
      cancelAnimationFrame(silenceFrameIdRef.current);
      silenceFrameIdRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const startSilenceDetection = (stream) => {
    stopSilenceDetection();
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 1024;
      audioCtx.createMediaStreamSource(stream).connect(analyserNode);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyserNode;

      const data = new Uint8Array(analyserNode.fftSize);
      const startedAt = performance.now();
      let speechStartedAt = 0;
      let silenceStartedAt = 0;

      const tick = (now) => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteTimeDomainData(data);

        // Compute level
        let sum = 0;
        for (const value of data) {
          const centered = value - 128;
          sum += centered * centered;
        }
        const level = Math.sqrt(sum / data.length) / 128;
        const heardSpeech = level >= silenceConfig.threshold;

        if (heardSpeech) {
          if (!speechStartedAt) speechStartedAt = now;
          silenceStartedAt = 0;
        } else if (speechStartedAt && now - speechStartedAt > silenceConfig.minRecordingMs) {
          if (!silenceStartedAt) silenceStartedAt = now;
          if (now - silenceStartedAt >= silenceConfig.stopAfterMs) {
            stopRecording();
            return;
          }
        }

        if (!speechStartedAt && now - startedAt >= silenceConfig.startGraceMs) {
          stopRecording();
          return;
        }

        if (now - startedAt >= silenceConfig.maxRecordingMs) {
          stopRecording();
          return;
        }

        silenceFrameIdRef.current = requestAnimationFrame(tick);
      };

      silenceFrameIdRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.warn("Could not start silence detection:", err);
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast.error("This browser does not support audio recording.");
      return;
    }

    stopPlayback();
    recordedChunksRef.current = [];
    setIsListening(true);
    setStatus("Recording");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const candidates = ["audio/webm", "audio/mp4", "audio/ogg", "audio/wav"];
      const mimeType = candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stopSilenceDetection();
        const cleanType = String(recorder.mimeType || "audio/webm").split(";")[0].trim();
        const audioBlob = new Blob(recordedChunksRef.current, { type: cleanType });

        // Release the microphone
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        setIsListening(false);

        try {
          setStatus("Transcribing");
          const transcript = await transcribeAudio(audioBlob, cleanType);
          if (transcript.trim()) {
            await sendMessage(transcript);
          } else {
            toast.error("I could not hear anything. Please try again.");
            setStatus("Ready");
          }
        } catch (err) {
          console.error("Transcription failed:", err);
          toast.error(err.message || "Failed to transcribe audio");
          setStatus("Ready");
        }
      };

      recorder.start();
      startSilenceDetection(stream);
    } catch (err) {
      console.error("Failed to access microphone:", err);
      toast.error("Microphone access denied or failed.");
      setIsListening(false);
      setStatus("Ready");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      setStatus("Thinking");
      mediaRecorderRef.current.stop();
    }
  };

  const transcribeAudio = async (audioBlob, mimeType) => {
    const response = await fetch("/api/voice-assistant/voice", {
      method: "POST",
      headers: {
        "content-type": mimeType,
        "x-language-code": language
      },
      body: audioBlob
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "STT failed");
    return data.transcript || "";
  };

  const speak = async (text) => {
    if (!speakReplies) return;
    stopPlayback();

    try {
      const response = await fetch("/api/voice-assistant/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, language })
      });
      if (!response.ok) throw new Error("TTS failed");
      const data = await response.json();
      if (!data.audioBase64) throw new Error("No audio payload");

      const audio = new Audio(`data:${data.mimeType || "audio/wav"};base64,${data.audioBase64}`);
      currentAudioRef.current = audio;
      setStatus("Speaking");
      await audio.play();
      audio.onended = () => {
        setStatus("Ready");
      };
    } catch (err) {
      console.warn("TTS API failed, playing fallback synthesis", err);
      fallbackSpeak(text);
    }
  };

  const fallbackSpeak = (text) => {
    if (!("speechSynthesis" in window) || !speakReplies) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 1;
    utterance.onend = () => {
      setStatus("Ready");
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setStatus("Speaking");
  };

  const sendMessage = async (text) => {
    const clean = text.trim();
    if (!clean) return;

    setMessages((current) => [...current, { role: "user", content: clean }]);
    setInputText("");
    setStatus("Thinking");

    try {
      const response = await fetch("/api/voice-assistant/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [...chatHistory, { role: "user", content: clean }]
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Assistant request failed");

      const reply = data.reply;
      if (!reply) throw new Error("The assistant returned an empty reply.");

      setMessages((current) => [...current, { role: "assistant", content: reply }]);
      await speak(reply);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((current) => [...current, { role: "error", content: err.message || "Failed to get reply" }]);
      setStatus("Ready");
    }
  };

  const handleMicClick = async () => {
    if (isListening) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const handleClear = () => {
    stopPlayback();
    setMessages([
      {
        role: "assistant",
        content: "Hi! I am your LandChain voice assistant. Speak or type to ask me about app navigation, split partition transfers, tax payments, or blockchain property audits!"
      }
    ]);
    setInputText("");
    setStatus("Ready");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Assistant Panel */}
      {isOpen ? (
        <div className="mb-4 flex h-[500px] w-[360px] flex-col overflow-hidden rounded-[28px] border border-slate-100 bg-white/95 shadow-[0_20px_50px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all duration-300">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">LandChain Voice Assistant</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Powered by Sarvam AI</p>
              </div>
            </div>
            <button
              onClick={() => {
                stopPlayback();
                setIsOpen(false);
              }}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              title="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          {/* Controls & Settings Row */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-2 text-xs">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 font-semibold text-slate-600 outline-none hover:bg-slate-100 transition"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSpeakReplies(!speakReplies)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                  speakReplies
                    ? "border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    : "border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100"
                }`}
                title={speakReplies ? "Mute replies" : "Unmute replies"}
              >
                {speakReplies ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button
                onClick={handleClear}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-red-500 transition"
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-slate-900 text-white rounded-br-none"
                      : m.role === "error"
                      ? "bg-red-50 border border-red-200 text-red-700"
                      : "bg-white border border-slate-100 text-slate-700 shadow-sm rounded-bl-none"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Visualization Zone */}
          <div className="flex flex-col items-center justify-center border-t border-slate-100 bg-white py-4">
            <div className="relative flex flex-col items-center">
              {/* Orb */}
              <button
                onClick={handleMicClick}
                className={`voice-orb ${
                  status === "Recording" ? "listening" : status === "Thinking" || status === "Transcribing" ? "thinking" : ""
                }`}
                title={isListening ? "Click to send message" : "Click to record voice"}
              >
                <span></span>
                <span></span>
                <span></span>
              </button>

              {/* Status Pill */}
              <div className="absolute -bottom-2 rounded-full bg-slate-900 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                {status}
              </div>
            </div>
          </div>

          {/* Text Composer Form */}
          <form onSubmit={handleFormSubmit} className="flex gap-2 border-t border-slate-100 bg-white p-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or ask a query..."
              disabled={status === "Thinking" || status === "Transcribing"}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || status === "Thinking" || status === "Transcribing"}
              className="flex items-center justify-center rounded-xl bg-slate-900 px-4 text-white hover:bg-slate-800 disabled:opacity-50 transition"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : null}

      {/* Floating Trigger Orb */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition duration-300 hover:scale-105 ${
          isOpen ? "bg-slate-900 rotate-90" : "bg-emerald-500 hover:bg-emerald-600 animate-pulse"
        }`}
        title={isOpen ? "Close Assistant" : "Open Assistant"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      </button>
    </div>
  );
}
