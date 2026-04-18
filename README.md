# Mood Journal AI

**An AI Hackfest 2026 project that helps users feel heard by turning journal entries into short, emotionally supportive voice responses.**

## About The Project
Mood Journal AI is a journaling experience built for emotional support, not just text storage.
Users share what they are feeling, and the app responds with an uplifting AI-generated message spoken back in a human-like voice.

## Why It Matters
In stressful moments, people often need immediate emotional reassurance.
This project demonstrates how AI can provide compassionate, low-friction support through both language and voice.

## How It Works
1. **User Input**
   The user writes thoughts in the frontend and clicks **Listen to AI**.

2. **Emotion-Aware Generation (Gemini)**
   The backend sends input to Gemini using a supportive emotional prompt.
   The response is normalized to exactly **3 short lines** with positive, calming tone.

3. **Voice Playback (ElevenLabs)**
   The generated text is converted to speech (`audio/mpeg`) and played automatically in the browser.

## Key Features
- Emotion-aware supportive AI response formatting.
- Exactly 3 concise uplifting lines.
- Retry + model fallback logic for Gemini high-demand errors (including 503).
- Real-time TTS playback using ElevenLabs.
- Modern glassmorphic dark UI for hackathon demo impact.

## Tech Stack
| Layer | Technology | Purpose |
|---|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript | Journal UI, loading states, audio playback |
| Backend | Node.js, Express 5 | API orchestration, AI integration, audio streaming |
| AI Text | `@google/genai` (Gemini) | Emotion-aware response generation |
| AI Voice | ElevenLabs `eleven_multilingual_v2` | Human-like speech synthesis |

## Architecture
```text
frontend (index.html + js/css)
        |
        v
POST /api/journal --------------> backend/server.js
                                   | 1) Gemini response generation
                                   | 2) Response normalization (3 lines)
                                   | 3) ElevenLabs TTS
                                   v
                             audio/mpeg stream
        |
        v
browser audio autoplay
```

## Project Structure
```text
AI-Hackfest/
├─ backend/
│  ├─ server.js
│  └─ package.json
├─ frontend/
│  ├─ index.html
│  └─ public/
│     ├─ css/index.css
│     └─ js/index.js
├─ .env
└─ README.md
```

## Environment Setup
Create `.env` at project root:

```env
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Optional
GEMINI_MODEL=gemini-3-flash
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
PORT=5000
```

## Run Locally
1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Start backend server:
```bash
cd backend
node server.js
```

3. Open frontend:
- Open `frontend/index.html` in your browser.
- Enter a journal message and click **Listen to AI**.

## API Reference
### Endpoint
`POST /api/journal`

### Request Body
Supports either payload style:

```json
{ "message": "I feel anxious about tomorrow" }
```

or

```json
{ "thoughts": "I feel anxious about tomorrow" }
```

### Response
- **200 OK** with `audio/mpeg` binary stream
- **400** when input is missing
- **500** for missing keys or upstream provider failure

## AI Hackfest 2026
Built during **AI Hackfest 2026** as a fast, meaningful prototype focused on emotionally supportive AI interaction.
