# MockMind — Voice AI Mock Interview Bot

Real-time voice mock interviews powered by Gemini 2.0 Flash Multimodal Live API, with Google/YouTube-style evaluation rubric feedback.

## Architecture

```
React Frontend (Cloudflare Pages)
        │ WebSocket
Cloudflare Worker (WebSocket proxy)
        │ WebSocket
Gemini 2.0 Flash Multimodal Live API
```

The Worker proxies the WebSocket connection so the Gemini API key is never exposed to the browser.

## Features

- **Screen 1 — Job Input:** Paste a JD or provide a URL (Worker fetches + extracts text).
- **Screen 2 — Configuration:** Auto-parsed role/company/competencies. Choose interview type (Behavioral / Case Study / Company Knowledge) and duration (5/10/15 min).
- **Screen 3 — Voice Session:** Real-time voice conversation via Gemini Multimodal Live API. Live audio waveform visualizer. Rolling transcript.
- **Screen 4 — Feedback:** Full evaluation on Google's 4-dimension rubric (GCA, RRK, Leadership, Googleyness), strengths, improvements, sample stronger answers, PDF download.

## Local Development

### Prerequisites

- Node.js 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- A [Gemini API key](https://aistudio.google.com/app/apikey) with Gemini 2.0 Flash access

### 1. Start the Worker

```bash
cd worker
npm install
# Create a local .dev.vars file for secrets (NOT committed)
echo 'GEMINI_API_KEY=your_key_here' > .dev.vars
echo 'ALLOWED_ORIGIN=http://localhost:5173' >> .dev.vars
npm run dev
# Worker runs at http://localhost:8787
```

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:5173
# Vite proxies /api/* to the Worker automatically
```

Open http://localhost:5173 in your browser.

## Deployment

### Deploy the Worker

```bash
cd worker
npm install
wrangler secret put GEMINI_API_KEY    # paste your Gemini API key
# Update ALLOWED_ORIGIN in wrangler.toml to your Pages URL
wrangler deploy
# Note the Worker URL, e.g. https://mock-interview-worker.your-subdomain.workers.dev
```

### Deploy the Frontend

```bash
cd frontend
npm install
# Set the Worker URL
echo 'VITE_WORKER_URL=https://mock-interview-worker.your-subdomain.workers.dev' > .env.production
npm run build
wrangler pages deploy dist --project-name mock-interview-bot
```

Or connect the `frontend/` folder to Cloudflare Pages via GitHub for automatic deployments. Set `VITE_WORKER_URL` in the Pages environment variables.

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `GEMINI_API_KEY` | Worker secret | Your Google Gemini API key |
| `ALLOWED_ORIGIN` | Worker var | Frontend origin for CORS (e.g. `https://mock-interview-bot.pages.dev`) |
| `VITE_WORKER_URL` | Frontend build | Worker base URL (e.g. `https://mock-interview-worker.....workers.dev`) |

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| AI Voice | Gemini 2.0 Flash Multimodal Live API (WebSocket) |
| AI REST | Gemini 2.0 Flash (JD parsing + evaluation) |
| Backend | Cloudflare Workers (TypeScript) |
| Deployment | Cloudflare Pages + Workers |

## Key Implementation Notes

- **Audio pipeline:** Mic → Web Audio API (`AudioContext` at 16 kHz, `ScriptProcessorNode`) → Float32 → Int16 PCM → base64 → WebSocket to Worker → Gemini Live API.
- **Audio playback:** Gemini returns base64 Int16 PCM at 24 kHz → decode → `AudioBuffer` → `AudioContext` queue.
- **WebSocket proxy:** Worker creates a `WebSocketPair`, accepts the frontend connection, opens an outbound WebSocket to Gemini with the API key, and relays messages bidirectionally.
- **User transcript:** `webkitSpeechRecognition` runs in parallel as a fallback for displaying the user's speech in the transcript (Gemini's Live API does not echo user audio as text).
- **No server-side storage:** All state lives in the browser session.
