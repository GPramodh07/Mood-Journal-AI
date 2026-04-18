# Mood Journal AI

**An AI Hackfest 2026 project that helps users feel heard by turning journal entries into emotionally intelligent voice responses.**

## About The Project
Mood Journal AI is a secure journaling experience built for emotional support, not just text storage.
Users authenticate, share what they're feeling, and receive uplifting AI-generated responses spoken back in a human-like voice—all protected by a gatekeeper security system that safeguards API credits.

## Demo Video
🎥 **[Watch the Demo](https://example.com/demo-video)** - See Mood Journal AI in action!

## Live Project
🌐 **[GitHub Repository](https://github.com/GPramodh07/Mood-Journal-AI)** - View the complete source code and documentation

## Why It Matters
In stressful moments, people often need immediate emotional reassurance.
This project demonstrates how AI can provide compassionate, low-friction support through both language and voice, while maintaining security and controlling API usage through authentication.

## Key Features
✨ **Core Features:**
- Emotion-aware, intelligent AI response generation (single-sentence format)
- Real-time TTS playback using ElevenLabs multilingual voice synthesis
- Modern glassmorphic dark UI with purple/blue gradient theme
- Retry + model fallback logic for Gemini high-demand errors (503 handling)

🔒 **Security Features:**
- **Gatekeeper Authentication System** - Login page with access code protection
- **API Header Validation** - Custom `X-Access-Code` header validation
- **Frontend Session Protection** - SessionStorage-based access control
- **Backend Middleware Protection** - 403 Forbidden responses for unauthorized requests
- **Protects API Credits** - Prevents unauthorized Gemini and ElevenLabs API calls

## How It Works

### User Flow:
1. **Login Portal** → User enters access code (HACK2026) at `login.html`
2. **Session Verification** → Credentials stored in sessionStorage
3. **Journal Entry** → User writes thoughts and clicks "Listen to AI"
4. **API Security Check** → Backend validates `X-Access-Code` header
5. **Emotion-Aware Generation** → Gemini processes input with emotional intelligence prompt
6. **Voice Synthesis** → ElevenLabs converts response to speech
7. **Playback** → Audio streams to browser automatically

### Technical Architecture:
```text
login.html (authentication)
        |
        v
sessionStorage.access_granted = true
        |
        v
index.html (main app)
        |
        v
fetch /api/journal
  + header: X-Access-Code: HACK2026
        |
        v
backend checkAccessCode middleware
  → If valid: generate response + TTS
  → If invalid: return 403 Forbidden
        |
        v
audio/mpeg stream → browser playback
```

## Tech Stack
| Layer | Technology | Purpose |
|---|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript | Journal UI, auth flow, audio playback |
| Backend | Node.js, Express 5 | API orchestration, middleware security |
| AI Text | `@google/genai` (Gemini) | Emotion-aware single-sentence generation |
| AI Voice | ElevenLabs `eleven_multilingual_v2` | Human-like multilingual speech |
| Security | SessionStorage + Header Validation | Access control + API protection |

## Project Structure
```text
AI-Hackfest/
├─ backend/
│  ├─ server.js                 (API + checkAccessCode middleware)
│  ├─ package.json
│  └─ package-lock.json
├─ frontend/
│  ├─ login.html                (authentication portal)
│  ├─ index.html                (main journal app)
│  └─ public/
│     ├─ css/
│     │  ├─ login.css           (login page styles)
│     │  └─ index.css           (app styles - glassmorphic)
│     └─ js/
│        ├─ login.js            (authentication logic)
│        └─ index.js            (journal app + API calls)
├─ .env                         (API keys)
├─ .gitignore
└─ README.md
```

## Security Architecture

### Frontend Protection (`frontend/public/js/index.js`):
- Checks `sessionStorage.access_granted` on page load
- Redirects unauthorized users to `login.html`
- Includes `X-Access-Code` header in all API requests

### Backend Middleware (`backend/server.js`):
```javascript
function checkAccessCode(req, res, next) {
    const providedCode = req.headers['x-access-code'];
    if (!providedCode || providedCode !== 'HACK2026') {
        return res.status(403).json({ error: 'Access denied.' });
    }
    next(); // Proceed to generate response
}
```

### API Protection:
- `/api/journal` endpoint protected by middleware
- Unauthorized requests return **403 Forbidden** without calling Gemini/ElevenLabs
- **Saves API credits** from malicious or accidental unauthorized calls

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

## 🔐 Quick Access Credentials
For testing and evaluation, use these credentials:
- **Access Code**: `HACK2026`
- **Backend URL**: `http://localhost:5000`
- **Frontend Entry**: `frontend/login.html`

## Run Locally

### Setup:
```bash
cd backend
npm install
```

### Start Backend:
```bash
cd backend
node server.js
```
Server runs on `http://localhost:5000`

### Access Frontend:
1. Open `frontend/login.html` in your browser
2. Enter access code: **`HACK2026`**
3. Click "Unlock Access"
4. You're now authenticated and can use the journal
5. Write your thoughts and click **"Listen to AI"**

## API Reference

### Authentication
- **Access Code**: `HACK2026`
- **Location**: Session-based (frontend) + Header-based (backend)

### Endpoint: `/api/journal`
**Method**: `POST`  
**Auth**: Required `X-Access-Code` header  
**Status on Auth Failure**: `403 Forbidden`

### Request Headers
```http
POST /api/journal HTTP/1.1
Content-Type: application/json
X-Access-Code: HACK2026
```

### Request Body
```json
{
  "thoughts": "I feel anxious about tomorrow",
  "timestamp": "2026-04-18T12:00:00.000Z"
}
```
*Or alternatively:* `{ "message": "..." }`

### Response (Success: 200)
- **Content-Type**: `audio/mpeg`
- **Body**: Binary audio stream (3-5 seconds of speech)
- **Example Flow**:
  - Input: "I'm worried about the presentation"
  - Output: Audio playing: "You've prepared well, and you'll handle this. Your effort matters."

### Response (Auth Failed: 403)
```json
{
  "error": "Access denied. Invalid or missing access code."
}
```

## Project Highlights for Judges

✅ **Security-First Design**:
- Demonstrates real-world API credit protection
- Multi-layer authentication (frontend + backend)
- Clean middleware pattern for extensibility

✅ **Emotional Intelligence**:
- Single-sentence targeted responses
- Context-aware prompt engineering
- Model fallback strategy for reliability

✅ **Production-Ready Code**:
- Clean separation of concerns (auth/app logic)
- Student-written comments (authentic)
- Proper error handling and fallbacks

✅ **UI/UX Excellence**:
- Glassmorphic dark theme throughout
- Smooth animations and transitions
- Responsive design for all devices

## Built During
**AI Hackfest 2026** - Built with ❤️ as a fast, meaningful prototype focused on emotionally supportive AI interaction with security in mind.
