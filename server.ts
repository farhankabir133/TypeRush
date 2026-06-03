/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Endpoint: Algorithmic Theme Synthesis (AI Lexicons)
app.post('/api/gemini/lexicon', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'A valid theme prompt is required.' });
  }

  if (!ai) {
    return res.status(503).json({
      error: 'Gemini API is not configured on the server. Please define GEMINI_API_KEY.',
      useFallback: true,
    });
  }

  try {
    const systemInstruction = 
      "You are a telemetry core for an atmospheric, cinematic typing survival game. " +
      "Generate high-fidelity dictionaries that match the user's creative prompt exactly.";

    const contents = 
      `Create a full customized game vocabulary centered around the concept: "${prompt}".\n` +
      `Generate 30 to 40 themed words (consisting of letters/numbers, no spaces or special symbols). ` +
      `Each word MUST have a matching scifi description (overlay) and a categoric tier. ` +
      `Suggest a neon theme color from the set ['cyan', 'purple', 'green', 'pink'].`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['themeName', 'neonAccent', 'description', 'words'],
          properties: {
            themeName: {
              type: Type.STRING,
              description: 'A stylized, sensory sci-fi style name for this theme pack.',
            },
            neonAccent: {
              type: Type.STRING,
              description: "Must be exactly one of: 'cyan', 'purple', 'green', 'pink'.",
            },
            description: {
              type: Type.STRING,
              description: 'Ambient terminal description of the grid environment.',
            },
            words: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['word', 'overlay', 'tier'],
                properties: {
                  word: {
                    type: Type.STRING,
                    description: 'The target alphanumeric typing key string (3-14 chars, letters/digits only, NO spaces, NO dashes, NO punctuation).',
                  },
                  overlay: {
                    type: Type.STRING,
                    description: 'Short sci-fi telemetry meaning description (max 45 chars).',
                  },
                  tier: {
                    type: Type.STRING,
                    description: "Target classification tier: 'common', 'rare', or 'legendary'.",
                  },
                },
              },
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Received empty response from Gemini model.');
    }

    const dict = JSON.parse(text);
    return res.json(dict);
  } catch (err: any) {
    console.error('Gemini Lexicon Synthesis error:', err);
    return res.status(500).json({
      error: 'Failed to synthesize algorithmic theme, utilizing fallbacks.',
      details: err.message,
      useFallback: true,
    });
  }
});

// For local testing & health monitoring
app.get('/api/health', (req, res) => {
  res.json({ status: 'active', timestamp: new Date().toISOString(), model: 'gemini-3.5-flash' });
});

// Vite server integrations
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CINEMATIC SERVER] Running safely at http://0.0.0.0:${PORT}`);
  });
}

startServer();
