var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var ai = process.env.GEMINI_API_KEY ? new import_genai.GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
}) : null;
app.post("/api/gemini/lexicon", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "A valid theme prompt is required." });
  }
  if (!ai) {
    return res.status(503).json({
      error: "Gemini API is not configured on the server. Please define GEMINI_API_KEY.",
      useFallback: true
    });
  }
  try {
    const systemInstruction = "You are a telemetry core for an atmospheric, cinematic typing survival game. Generate high-fidelity dictionaries that match the user's creative prompt exactly.";
    const contents = `Create a full customized game vocabulary centered around the concept: "${prompt}".
Generate 30 to 40 themed words (consisting of letters/numbers, no spaces or special symbols). Each word MUST have a matching scifi description (overlay) and a categoric tier. Suggest a neon theme color from the set ['cyan', 'purple', 'green', 'pink'].`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          required: ["themeName", "neonAccent", "description", "words"],
          properties: {
            themeName: {
              type: import_genai.Type.STRING,
              description: "A stylized, sensory sci-fi style name for this theme pack."
            },
            neonAccent: {
              type: import_genai.Type.STRING,
              description: "Must be exactly one of: 'cyan', 'purple', 'green', 'pink'."
            },
            description: {
              type: import_genai.Type.STRING,
              description: "Ambient terminal description of the grid environment."
            },
            words: {
              type: import_genai.Type.ARRAY,
              items: {
                type: import_genai.Type.OBJECT,
                required: ["word", "overlay", "tier"],
                properties: {
                  word: {
                    type: import_genai.Type.STRING,
                    description: "The target alphanumeric typing key string (3-14 chars, letters/digits only, NO spaces, NO dashes, NO punctuation)."
                  },
                  overlay: {
                    type: import_genai.Type.STRING,
                    description: "Short sci-fi telemetry meaning description (max 45 chars)."
                  },
                  tier: {
                    type: import_genai.Type.STRING,
                    description: "Target classification tier: 'common', 'rare', or 'legendary'."
                  }
                }
              }
            }
          }
        }
      }
    });
    const text = response.text;
    if (!text) {
      throw new Error("Received empty response from Gemini model.");
    }
    const dict = JSON.parse(text);
    return res.json(dict);
  } catch (err) {
    console.error("Gemini Lexicon Synthesis error:", err);
    return res.status(500).json({
      error: "Failed to synthesize algorithmic theme, utilizing fallbacks.",
      details: err.message,
      useFallback: true
    });
  }
});
app.get("/api/health", (req, res) => {
  res.json({ status: "active", timestamp: (/* @__PURE__ */ new Date()).toISOString(), model: "gemini-3.5-flash" });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CINEMATIC SERVER] Running safely at http://0.0.0.0:${PORT}`);
  });
}
startServer();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
