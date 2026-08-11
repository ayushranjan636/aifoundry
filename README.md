# AI Foundry

> **Build AI for your problem. Not someone else's.**

A production AI Engineering Foundry — from data to production API without needing an ML team.

**Live:** https://aifoundry-iitm.vercel.app  
**API:** https://aifoundry-production.up.railway.app

---

## Quick Start (Local)

```bash
npm install
npm run dev              # Frontend → localhost:5173
cd server && npm install && node index.js  # Backend → localhost:3001
```

---

## Production URLs

| Service | URL |
|---|---|
| Frontend | https://aifoundry-iitm.vercel.app |
| Backend API | https://aifoundry-production.up.railway.app |
| Inference | `POST /api/v1/models/:modelId` |
| Health | `GET /api/health` |
| Analytics | `GET /api/analytics/overview` |

---

## Test the API

```bash
# Health check
curl https://aifoundry-production.up.railway.app/api/health

# Run inference
curl -X POST https://aifoundry-production.up.railway.app/api/v1/models/credit-risk-ai \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"income": 75000, "loan_amount": 800000, "credit_score": 740, "employment": "salaried"}'

# Get API key
curl https://aifoundry-production.up.railway.app/api/apikey
```

---

## Architecture

```
Frontend (Vercel)        → React + TypeScript + Vite + Tailwind
Backend (Railway)        → Express + SQLite + OpenAI
Database                 → SQLite (persistent volume on Railway)
AI Engine                → OpenAI GPT-4o (runs in background)
```

## How the model works

1. User describes their AI (objective, inputs, outputs, constraints)
2. User uploads a dataset (analyzed for quality and readiness)
3. During build: a specialized system prompt is generated — this IS the "trained model"
4. When testing: inputs are sent to the AI engine with the generated prompt
5. The model responds with structured JSON: prediction, probability, confidence, explanations

---

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS (light/dark mode)
- React Router v6
- Express + SQLite (better-sqlite3)
- OpenAI SDK
- Recharts
- Lucide icons

---

## Team

Built by Ayush Ranjan, Shubansh Gupta, Gati, Sreenidhi, Arvin Subramaniam, Jaydev, and Sanjay Suman.
