import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Railway persistent volume or local path
const DB_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || __dirname;
const DB_PATH = join(DB_DIR, 'aifoundry.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      api_key TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      objective TEXT DEFAULT '',
      input_formats TEXT DEFAULT '[]',
      output_formats TEXT DEFAULT '[]',
      constraints TEXT DEFAULT '',
      recommended_approach TEXT,
      selected_approach TEXT,
      recommended_model TEXT,
      selected_model TEXT,
      dataset_info TEXT,
      dataset_analysis TEXT,
      build_plan TEXT,
      build_status TEXT,
      model_health TEXT,
      deployment TEXT,
      status TEXT DEFAULT 'draft',
      generated_system_prompt TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS model_versions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      version TEXT NOT NULL,
      status TEXT DEFAULT 'production',
      accuracy REAL DEFAULT 0,
      f1_score REAL DEFAULT 0,
      dataset_size INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      system_prompt TEXT,
      metrics TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS deployments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      version_id TEXT,
      status TEXT DEFAULT 'idle',
      endpoint TEXT NOT NULL,
      region TEXT DEFAULT 'us-east-1',
      latency_ms INTEGER DEFAULT 0,
      deployed_at TEXT,
      stopped_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      key_value TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1,
      last_used TEXT,
      requests_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS api_requests (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      deployment_id TEXT,
      api_key TEXT,
      input_data TEXT,
      output_data TEXT,
      latency_ms INTEGER DEFAULT 0,
      status_code INTEGER DEFAULT 200,
      error TEXT,
      model_version TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS test_cases (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'custom',
      input_data TEXT NOT NULL,
      result TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_api_requests_project ON api_requests(project_id);
    CREATE INDEX IF NOT EXISTS idx_api_requests_created ON api_requests(created_at);
    CREATE INDEX IF NOT EXISTS idx_model_versions_project ON model_versions(project_id);
  `);

  seedDemoData();
}

function seedDemoData() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existing.count > 0) return;

  console.log('🌱 Seeding demo data...');

  // Demo user
  const userId = 'demo-user';
  const apiKey = 'fnd_demo_' + uuidv4().replace(/-/g, '').slice(0, 24);

  db.prepare(`INSERT OR IGNORE INTO users (id, name, email, api_key) VALUES (?, ?, ?, ?)`)
    .run(userId, 'Ayush Ranjan', 'ayush@aifoundry.ai', apiKey);

  // Credit Risk AI
  const creditProjectId = 'credit-risk-ai';
  const creditSystemPrompt = `You are Credit Risk AI, an expert credit risk assessment system.

Your role: Analyze loan application data and predict default probability with explainability.

Output format — return ONLY this JSON:
{
  "prediction": "LOW RISK" | "MEDIUM RISK" | "HIGH RISK",
  "probability": <float 0.0-1.0>,
  "confidence": "high" | "medium" | "low",
  "explanation": [
    { "factor": "<name>", "impact": "positive" | "negative" | "neutral", "magnitude": "high" | "medium" | "low" }
  ]
}

Guidelines:
- Debt-to-income ratio > 40%: strong negative signal
- Credit score < 600: high risk; 600-699: medium; 700+: lower risk
- Loan-to-income ratio > 10x: significant risk factor
- Prioritize minimizing false negatives (missed defaults)
- Always include at least 3 explanation factors`;

  const creditHealth = JSON.stringify({
    score: 86, accuracy: 91.4, precision: 89.2, recall: 87.6, f1Score: 88.4,
    latencyMs: 142, modelSizeGb: 4.8,
    interpretation: 'The model performs strongly on common applicant profiles. High-income salaried applicants are classified with very high confidence.',
    recommendation: 'Collect more examples of self-employed applicants with medium credit scores to improve recall on that segment.',
    classPerformance: [
      { label: 'Low Risk', precision: 94.1, recall: 93.2, f1: 93.6, support: 12840 },
      { label: 'Medium Risk', precision: 87.4, recall: 85.9, f1: 86.6, support: 4210 },
      { label: 'High Risk', precision: 82.3, recall: 79.8, f1: 81.0, support: 1950 }
    ],
    evaluationHistory: [
      { version: 'v1.0', date: '2024-01-08', accuracy: 83.4, f1: 0.82 },
      { version: 'v1.1', date: '2024-01-09', accuracy: 87.2, f1: 0.85 },
      { version: 'v1.2', date: '2024-01-10', accuracy: 91.4, f1: 0.88 }
    ]
  });

  const creditDatasetAnalysis = JSON.stringify({
    rows: 82431, columns: 27, missingValues: 8.4, duplicates: 2.1,
    dataTypes: 'Mixed (numeric, categorical)', targetBalance: 'Imbalanced (minority ~12%)',
    fileSize: '8.4 MB', readinessScore: 72,
    readinessBreakdown: { coverage: 82, completeness: 71, balance: 63, consistency: 91, volume: 78 },
    recommendations: [
      { id: 'rec-1', severity: 'high', title: 'Class imbalance detected', description: 'Minority class ~12%. Consider augmentation.', potentialImpact: ['Recall ↓', 'False negatives ↑'] },
      { id: 'rec-2', severity: 'medium', title: '8.4% missing values', description: 'Imputation applied during preprocessing.', potentialImpact: ['Feature coverage ↓'] }
    ]
  });

  const creditDeployment = JSON.stringify({
    status: 'production', endpoint: `https://api.aifoundry.ai/v1/models/credit-risk-ai/predict`,
    latencyMs: 142, requestsToday: 2841, errorRate: 0.8, deployedAt: '2024-01-10T20:00:00Z', region: 'us-east-1'
  });

  db.prepare(`INSERT OR IGNORE INTO projects (id, user_id, name, description, objective, input_formats, output_formats, constraints, selected_approach, selected_model, dataset_analysis, model_health, deployment, status, generated_system_prompt, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(creditProjectId, userId,
      'Credit Risk AI',
      'AI system that predicts loan default probability from applicant and financial information.',
      'I want an AI that analyzes loan applications and predicts whether an applicant is likely to default.',
      '["tables"]', '["score","prediction"]',
      'Prioritize reducing false negatives and return a confidence score.',
      'fine-tuning', 'qwen',
      creditDatasetAnalysis, creditHealth, creditDeployment,
      'production', creditSystemPrompt, '2024-01-10T20:00:00Z'
    );

  // Model versions
  const versions = [
    { id: 'v1.2', version: 'v1.2', status: 'production', accuracy: 91.4, f1: 0.884, size: 82431, notes: 'Added augmented minority class samples.', days: 0 },
    { id: 'v1.1', version: 'v1.1', status: 'archived', accuracy: 87.2, f1: 0.851, size: 70000, notes: 'Improved dataset balance with SMOTE.', days: 1 },
    { id: 'v1.0', version: 'v1.0', status: 'archived', accuracy: 83.4, f1: 0.817, size: 50000, notes: 'Initial baseline model.', days: 2 },
  ];

  for (const v of versions) {
    const createdAt = new Date(Date.now() - v.days * 86400000).toISOString();
    db.prepare(`INSERT OR IGNORE INTO model_versions (id, project_id, version, status, accuracy, f1_score, dataset_size, notes, system_prompt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(`credit-${v.id}`, creditProjectId, v.version, v.status, v.accuracy, v.f1, v.size, v.notes, creditSystemPrompt, createdAt);
  }

  // Deployment record
  db.prepare(`INSERT OR IGNORE INTO deployments (id, project_id, version_id, status, endpoint, region, latency_ms, deployed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run('deploy-credit-1', creditProjectId, 'credit-v1.2', 'production',
      'https://api.aifoundry.ai/v1/models/credit-risk-ai/predict', 'us-east-1', 142, '2024-01-10T20:00:00Z');

  // Seed 7 days of API requests
  const baseTime = Date.now();
  const insertReq = db.prepare(`INSERT INTO api_requests (id, project_id, deployment_id, api_key, input_data, output_data, latency_ms, status_code, model_version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const seedRequests = db.transaction(() => {
    for (let day = 6; day >= 0; day--) {
      const reqCount = Math.floor(300 + Math.random() * 600);
      for (let i = 0; i < reqCount; i++) {
        const ts = new Date(baseTime - day * 86400000 - Math.random() * 86400000).toISOString();
        const latency = Math.floor(100 + Math.random() * 200);
        const isError = Math.random() < 0.01;
        insertReq.run(
          uuidv4(), creditProjectId, 'deploy-credit-1', apiKey,
          JSON.stringify({ income: Math.floor(30000 + Math.random() * 100000), loan_amount: Math.floor(100000 + Math.random() * 900000) }),
          isError ? null : JSON.stringify({ prediction: 'low_risk', probability: Math.random() * 0.4 }),
          latency, isError ? 500 : 200, 'v1.2', ts
        );
      }
    }
  });
  seedRequests();

  // Customer Support AI
  const supportId = 'customer-support-ai';
  db.prepare(`INSERT OR IGNORE INTO projects (id, user_id, name, description, objective, input_formats, output_formats, status, selected_approach, selected_model, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(supportId, userId, 'Customer Support AI',
      'AI that handles customer inquiries using company knowledge base.',
      'Answer customer support questions based on product documentation and past resolutions.',
      '["text","documents"]', '["text","recommendation"]',
      'training', 'rag', 'llama', '2024-01-12T14:30:00Z');

  // Student Risk
  db.prepare(`INSERT OR IGNORE INTO projects (id, user_id, name, description, objective, input_formats, output_formats, status, selected_approach, selected_model, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run('student-risk-ai', userId, 'Student Risk Predictor',
      'AI that identifies at-risk students early.',
      'Identify students likely to drop out before it happens.',
      '["tables"]', '["prediction","score"]',
      'draft', 'slm', null, '2024-01-14T10:00:00Z');

  console.log('✅ Demo data seeded. User API key:', apiKey);
}

export function getUserByApiKey(apiKey) {
  return getDb().prepare('SELECT * FROM users WHERE api_key = ?').get(apiKey);
}

export function getProjectById(id) {
  return getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

export function parseJSON(str, fallback = null) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}
