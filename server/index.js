import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

// Load env
try {
  const { config } = await import('dotenv');
  config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });
} catch {}

import { getDb } from './db/database.js';
import projectsRouter from './routes/projects.js';
import apiKeysRouter from './routes/apikeys.js';
import inferenceRouter from './routes/inference.js';
import analyticsRouter from './routes/analytics.js';
import deploymentsRouter from './routes/deployments.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow localhost + any vercel preview + your custom domain
    const allowed = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ];
    // Allow all Vercel deployments and custom domains
    if (origin.includes('vercel.app') || origin.includes('aifoundry') || allowed.includes(origin)) {
      return callback(null, true);
    }
    callback(null, true); // Allow all in demo mode
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Health check ──────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const db = getDb();
  const counts = {
    projects: db.prepare('SELECT COUNT(*) as c FROM projects').get().c,
    requests: db.prepare('SELECT COUNT(*) as c FROM api_requests').get().c,
    deployments: db.prepare('SELECT COUNT(*) as c FROM deployments').get().c,
  };
  res.json({
    status: 'healthy',
    version: '1.0.0',
    engine: !!process.env.OPENAI_API_KEY,
    database: counts,
    uptime: process.uptime(),
  });
});

// ── User info / API key ───────────────────────────────────
app.get('/api/user', (_req, res) => {
  const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get('demo-user');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, name: user.name, email: user.email, apiKey: user.api_key });
});

// ── Routes ─────────────────────────────────────────────────
app.use('/api/projects', projectsRouter);
app.use('/api/v1/models', inferenceRouter);        // external API endpoint
app.use('/api/analytics', analyticsRouter);
app.use('/api/deployments', deploymentsRouter);
app.use('/api/apikeys', apiKeysRouter);

// ── API key info endpoint ─────────────────────────────────
app.get('/api/apikey', (_req, res) => {
  const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get('demo-user');
  res.json({ apiKey: user?.api_key || 'fnd_demo_xxx' });
});

// ── Error handler ─────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message });
});

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 AI Foundry API Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${getDb().name}`);
  console.log(`⚡ AI Engine: ${process.env.OPENAI_API_KEY ? '✅ configured' : '⚠️  not configured (demo mode)'}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET  http://localhost:${PORT}/api/health`);
  console.log(`  GET  http://localhost:${PORT}/api/projects`);
  console.log(`  POST http://localhost:${PORT}/api/v1/models/:projectId  (inference)`);
  console.log(`  GET  http://localhost:${PORT}/api/analytics/timeseries\n`);
});
