# 🌌 TYPERUSH // COGNITIVE TERMINAL

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-06b6d4.svg)](https://opensource.org/licenses/Apache-2.0)
[![Framework: React 19](https://img.shields.io/badge/Framework-React_19-blue.svg)](https://react.dev/)
[![AI-Powered: Gemini 3.5](https://img.shields.io/badge/AI--Powered-Gemini_3.5_Flash-emerald.svg)](https://deepmind.google/technologies/gemini/)
[![Database: Firestore](https://img.shields.io/badge/Backend-Firebase_Firestore-orange.svg)](https://firebase.google.com/)

> An immersive, cinematic typing survival experience where typing is decoupled from boring lists of static text and converted into high-fidelity space debris interception and cockpit terminal defense.

---

## 🛰️ Tagline
*Interact with cosmic vocabularies. Coordinate with real-time neural music. Survive the orbital debris storm.*

---

## 📸 Preview
![TypeRush Cockpit Interface](./assets/preview.png)
*Figure 1.0: Real-time kinetic targeting grid, adaptive stellar radiation overlay and high-contrast HUD.*

---

## 🛸 About The Project

**TypeRush** redefines the speed practice paradigm by wrapping typing mechanics in an intense, atmospheric, terminal-themed sci-fi action space. Developed on React, Tailwind, and the Web Audio API, the application avoids dry calculations in favor of a responsive sensory ecosystem. Words are modeled as kinetic physics bodies drifting dynamically across the cockpit radar screen towards your core shielding barrier.

The experience incorporates several distinct sub-systems:
- **Neural Audio Synthesis:** Dynamic Web Audio API composition engine that generates procedural thuds, keyclick ticks, crystalline melodic arpeggios, and low-frequency sweeps based on player velocity and combo streaks.
- **AI-Synthesized Lexicons:** Connects to a server-side **Gemini 3.5 Flash** model to dynamically synthesize specialized vocabulary nodes and thematic flavor text descriptions in real-time.
- **Global Multiplayer Sync:** Real-time duals and co-op containment missions utilizing distributed document state hooks in **Firebase Firestore**.

---

## 🌟 Key Features

### 1. Neural-Link Multiplayer Battles (Real-time PvP & Co-op)
* **Payload Glitches:** Typing long or complex technical words triggers horizontal screen scrambles and speed drift spikes on your opponent's console over the network.
* **Interactive Co-op Containment:** Team up with a secondary player to defend a shared central containment shield. Divide tasks dynamically: one handles hyper-speed particles, while the other locks-on and dismantles heavy boss phrases.
* **Direct Firestore Matchmaking:** Instant matchmaking, lobby status synchronization, and latency-optimized tracking of live participant velocity (WPM), correct typing streaks, and shield health indexes.

### 2. Algorithmic Theme Synthesis (AI Lexicons)
* **Theme-on-Demand Input:** Bypasses pre-configured word files. Users type an arbitrary creative theme prompt inside the terminal lobby.
* **Proactive Gemini LLM Integration:** A secure server-side proxy directs structured JSON schema generation through Gemini 3.5 Flash, generating 30-40 custom sci-fi themed key strings coupled with telemetry descriptions, sorting them by tier, and modifying the frontend neon color palette.

### 3. Procedural Synthesizer & Dynamic Temp Tempo
* **Sub-Bass Heartbeat:** An ambient, repeating low-frequency sine synthesizer track that dynamically scales in Beats-Per-Minute (BPM) as active debris nears the danger zone threshold.
* **Streak-Dynamic Melodies:** Maintaining a high streak unlocks high-frequency crystalline chime arpeggios and high-hat stems, reinforcing accurate typing behavior through immediate acoustic validation.
* **Zero External Audio Assets:** Built entirely on Web Audio oscillators, biquad bandpass distortion filters, and physical exponential gain envelopes for zero network load.

### 4. Interactive Threat Profiles (Tactical Word Classes)
* **The "Cloaked" Phantom:** Word bodies that glide through the cockpit radar invisibly, flashing momentarily into view. Users must lock target or memorize keys to complete interception.
* **The "Regenerative" Construct:** Cybernetic phrases that restore their typed letter count sequentially if left untyped/inactive for more than two seconds.
* **The "Shield Charger":** Glowing gold celestial items that rebuild 12% of the terminal's structural containment shield when successfully neutralized.

### 5. Persistent Personal Archives (Cloud Diagnostics)
* **Telemetry Diagnostics Graphing:** Captures run analytics and records them to `/users/{uid}/diagnostics` on Firestore. Renders a retro, glowing SVG line graph showing historic WPM, accuracy, and score trends across your last 50 runs.
* **Google and Anonymous Auth:** Securely login using Google Sign-In or Anonymous Bypasses to save custom profiles, colors, sound styles, and settings.

---

## 🛠️ Tech Stack

* **Frontend Framework:** React 19 (Hooks, useRef cache buffers, stable callbacks)
* **Styling & Theme Engine:** Tailwind CSS + CSS variable neon box glowing + CRT scanline styling
* **State Management:** Local concurrent component loops and high-precision `requestAnimationFrame` render engine running at stable 60fps
* **Audio Layer:** Vanilla HTML5 Web Audio API Synthesizer Context
* **Backend:** Express Server (TypeScript) + Vite Middleware Integrations + ESBuild bundle compilers
* **AI Core Integration:** Google GenAI SDK (`@google/genai` TypeScript client proxy)
* **Database & Authentication:** Firebase Cloud Store (Firestore SDK) & Real-time Listeners

---

## 📂 Project Structure

```bash
├── assets/                    # Static graphics, screenshots, and visual branding assets
├── src/                       # Primary React Client application
│   ├── components/            # Visual dashboard interface modules
│   │   ├── HUD.tsx            # Multiplier, accuracy, scale, and focus-controls header
│   │   ├── WordEntity.tsx     # Animated text entity with tactical state overlays
│   │   ├── EffectsLayer.tsx   # Canvas layer for particle explosions and key flashes
│   │   └── EndScreen.tsx      # Diagnostic scoring summary, charts, and reset console
│   ├── lib/                   # Integrations and network protocols
│   │   └── firebase.ts        # Cloud database initialization and auth handles
│   ├── audio.ts               # Procedural synthesizer and musical stem triggers
│   ├── words.ts               # Local dictionary fallbacks
│   ├── types.ts               # Core model interfaces and data classifications
│   ├── index.css              # CRT filters, fonts, and tailwind styling configurations
│   └── main.tsx               # Client bootstrap node
│
├── server.ts                  # Express production backend & Gemini API proxy routing
├── firebase-blueprint.json    # Firestore collection schematics
├── firestore.rules            # Granular security logic and data restrictions
├── metadata.json              # Applet deployment properties
├── tsconfig.json              # TypeScript compilation specifications
├── vite.config.ts             # Bundler configs
└── package.json               # Package manifests and dependency controls
```

---

## 🚀 Getting Started

Ensure you have [Node.js (v18+)](https://nodejs.org/) installed on your machine.

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/typerush.git
cd typerush
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Create a `.env` file in the root directory based on the `.env.example`:
```env
GEMINI_API_KEY=your_google_ai_studio_api_key_here
```

### 4. Setup Firebase configuration
Create a helper configuration interface in the root workspace as `firebase-applet-config.json` containing your web credentials:
```json
{
  "apiKey": "AIzaSy...",
  "authDomain": "...firebaseapp.com",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}
```

### 5. Start the development server
```bash
npm run dev
```
Navigate to `http://localhost:3000` to start piloting your typing terminal.

---

## 🏗️ Build & Deployment

### Production Compilation
We bundle our client files and compile our Node Express backend using `esbuild` down to a single compact CommonJS executable under `dist/server.cjs` for robust launch characteristics:

```bash
npm run build
```

This execution outputs:
- Static client application inside `dist/`
- Compiled, single-file server node inside `dist/server.cjs` with optimized import mappings to avoid runtime path resolution issues.

### Executing compiled build locally
```bash
npm run start
```

---

## 🧠 Core Functional Mechanics

### Zero-Re-render Character Handling
We avoid standard React state re-rendering bottlenecks by storing active words arrays and selected target reference handles within synchronous React `useRef` buffers:

```ts
const wordsRef = useRef<Word[]>([]);
const activeWordIdRef = useRef<string | null>(null);
```

This prevents keyboard latency on extreme WPM typing tests. Key inputs are evaluated instantaneously on the window's `keydown` listener, with direct coordinates fed into the `<canvas>` effects layer for particle explosions.

### Structured Gemini Response Parsing
The theme synthesizer maps AI prompt contexts into active game variables using the modern `@google/genai` library, verifying safety restrictions via rigid JSON structures:

```ts
const response = await ai.models.generateContent({
  model: 'gemini-3.5-flash',
  contents: promptContents,
  config: {
    responseMimeType: 'application/json',
    responseSchema: { ... }
  }
});
```

---

## 🤝 Contribution Guidelines

We highly encourage open-source optimization, performance enhancements, and game balancing!

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/stellar-audio`).
3. Commit your Changes (`git commit -m 'feat: Add mechanical keyboard synth style'`).
4. Push to the Branch (`git push origin feature/stellar-audio`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file or the header cards in our src directory files for licensing details.

---

## 🛰️ Human Terminal Connection

* **Project Maintainer:** [Farhan Kabir](mailto:farhankabir236@gmail.com)
* **Open Source Repository:** [TypeRush GitHub](https://github.com/farhankabir/typerush)
* **Launch Control App URL:** [Live Preview Platform](https://ais-pre-wu63bsm7ek4ih6z7tcfsbl-544858969369.asia-southeast1.run.app)
