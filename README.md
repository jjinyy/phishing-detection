# 5-Minute Shield AI — An AI that stands between you and scammers

[![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com)
[![Twilio](https://img.shields.io/badge/Twilio-F22F46?style=flat-square&logo=twilio&logoColor=white)](https://twilio.com)

---

## About

When an unknown call comes in, the AI answers on your behalf for up to 5 minutes and analyzes whether it's a phishing attempt. You only see the report afterward and decide what to do.

**Core values**
- You never have to talk to a scammer directly
- The threat is intercepted during the call, not after

---

## How it works
```
Unknown call received
    ↓
Tap "Let AI answer"
    ↓
AI picks up and holds the conversation (up to 5 min)
    ↓
Speech → Text (Whisper STT)
    ↓
Scam score calculated in real time (keyword scoring)
    ↓
GPT response strategy adjusts based on score
  0.0–0.4 → Normal conversation
  0.4–0.7 → Cautious, request verification
  0.7–1.0 → Stall for time + refuse to share info
    ↓
Call ends → Result report delivered to user
```

---

## Features

**AI proxy call (up to 5 minutes)**
The AI handles the call over VoIP. When asked for personal information, it responds with fake details.

**Real-time scam pattern analysis**
Five pattern types are scored with different weights.

| Pattern | Examples | Weight |
|---|---|---|
| Authority impersonation | Police, prosecutor's office, financial regulator | 0.30 |
| Personal info request | ID number, card number, OTP | 0.30 |
| Threats | Arrest, account freeze, asset seizure | 0.35 |
| Account/transfer request | Wire transfer, safe account | 0.25 |
| Urgency pressure | Right now, immediately, deadline | 0.20 |

**Call result report**
- Verdict: Normal / Suspicious / Confirmed phishing
- Evidence summary (up to 3 points)
- Estimated scam type
- Recommended actions

**User makes the final call**
The AI doesn't make decisions. It gives you the information, and you decide.

---

## Why it's built this way

Detection and response generation are kept separate.

For detection, rule-based keyword scoring was used instead of an LLM. Real-time phone calls can't afford latency, and it's easier to explain clearly why a call was flagged.

For response generation, GPT-3.5 made more sense because scammer conversations don't follow a fixed script. As the scam score rises, the GPT prompt shifts automatically toward a stalling strategy.

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python 3.9+, Flask |
| Speech recognition | OpenAI Whisper |
| Response generation | OpenAI GPT-3.5-turbo |
| Phone integration | Twilio VoIP |
| Frontend | React 18 (CDN), Web Speech API |
| Deployment | GitHub Pages (frontend), Render (backend) |

---

## Getting started

**Backend**
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd backend
python run.py
```

**Frontend**
```bash
cd docs
npx serve -s . -l 3000
```

Open `http://localhost:3000` in your browser.

**Environment variables (.env)**
```
OPENAI_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
GOOGLE_CLOUD_API_KEY=   # optional
```

---

## Project structure
```
phishing-detection/
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── services/
│   │   ├── ai_service.py      # GPT-3.5 response generation
│   │   ├── scam_analyzer.py   # Keyword scoring
│   │   └── stt_service.py     # Whisper STT
│   └── requirements.txt
└── docs/                      # GitHub Pages frontend
    ├── index.html
    └── app-full.js
```

---

## Privacy

- Call audio is never stored on the server
- All data is processed in real time and discarded immediately
- The service operates on a consent basis

---

## Limitations & next steps

Keyword-based detection is fragile against phishing patterns it hasn't seen before. Replacing it with an LLM-based classifier would help catch more sophisticated scripts. Switching to a Korean-optimized STT model like Clova Speech would also improve transcription accuracy.

