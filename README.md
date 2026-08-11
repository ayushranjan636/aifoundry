# AI Foundry

> **Build AI for your problem. Not someone else's.**

A production-quality AI Engineering Foundry — from data to production API without needing an ML team.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

**Demo login:** Click "Continue with Demo Account" on the login page.

---

## Adding your OpenAI API Key

The platform runs in demo mode without a key. To enable **real GPT-4o inference**:

**Option 1 — Settings page (recommended):**
1. Log in → Settings → paste your `sk-...` key → Test connection → Save

**Option 2 — Environment variable:**
```bash
cp .env.example .env
# Edit .env and add VITE_OPENAI_API_KEY=sk-your-key
npm run dev
```

**What the key enables:**
- Architecture analysis via GPT-4o-mini
- Model specification generation via GPT-4o (creates your "trained model" as a specialized system prompt)
- Live inference in the Testing Lab — your model actually responds
- AI-generated health interpretation
- Real API Playground responses

---

## Architecture

```
src/
├── config/         # API key management
├── services/
│   ├── openaiService.ts    # Real GPT-4o calls
│   ├── aiFoundryService.ts # Main service (uses real or mock)
│   └── mockData.ts         # Demo data + fallback functions
├── pages/
│   ├── LandingPage.tsx
│   ├── auth/               # Login, Signup
│   ├── console/            # Dashboard
│   ├── projects/           # Project overview, health, testing, deploy, API, versions
│   └── build/              # 6-step wizard: Define → Architecture → Model → Data → Checkpoint → Build
├── components/
│   ├── layout/             # AppLayout, WizardProgress, BuildWizardLayout
│   └── ui/                 # Button, Card, Badge, Input, Progress, Tabs, Skeleton
├── types/index.ts          # Full TypeScript types
└── lib/utils.ts            # Helpers
```

## How the "model" works

When you build an AI in Foundry:
1. You describe your objective, inputs, outputs, and constraints
2. You upload a dataset (analyzed for quality and readiness)  
3. During the "build" phase, **GPT-4o generates a specialized system prompt** — this IS your "trained model"
4. When you test: inputs are sent to GPT-4o-mini with your generated system prompt
5. The model responds with structured JSON: prediction, probability, confidence, and factor explanations

This is a legitimate AI product approach used in production systems. The system prompt encodes your domain knowledge, constraints, and output format.

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS (light/dark mode)
- React Router v6
- OpenAI SDK (`openai`)
- Recharts
- Lucide icons
