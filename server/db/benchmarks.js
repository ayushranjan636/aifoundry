import { getDb } from './database.js';
import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────────────
// Benchmark & Evaluation Database Schema
// ─────────────────────────────────────────────────────────────────────────────

export function initBenchmarkSchema() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS benchmark_reports (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      model_version TEXT NOT NULL,
      dataset_version TEXT DEFAULT 'v1',
      evaluation_version TEXT DEFAULT 'v1',
      training_run_id TEXT,
      task_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      
      -- Structured JSON columns
      task_metrics TEXT,
      training_metrics TEXT,
      data_quality TEXT,
      data_split TEXT,
      reliability TEXT,
      calibration TEXT,
      data_slices TEXT,
      baseline_comparison TEXT,
      alternatives TEXT,
      composite_score TEXT,
      regression_test TEXT,
      golden_test_results TEXT,
      user_facing TEXT,
      known_weaknesses TEXT,
      recommendations TEXT,

      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS golden_test_sets (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT DEFAULT 'Golden Test Set',
      records_count INTEGER DEFAULT 0,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS benchmark_candidates (
      id TEXT PRIMARY KEY,
      benchmark_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      quality REAL DEFAULT 0,
      cost_per_1000 REAL DEFAULT 0,
      latency_ms REAL DEFAULT 0,
      context_window INTEGER,
      is_recommended INTEGER DEFAULT 0,
      is_pareto_efficient INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (benchmark_id) REFERENCES benchmark_reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recommendation_benchmarks (
      id TEXT PRIMARY KEY,
      total_tasks INTEGER DEFAULT 0,
      tasks_evaluated INTEGER DEFAULT 0,
      success_rate REAL DEFAULT 0,
      quality_regret REAL DEFAULT 0,
      cost_regret REAL DEFAULT 0,
      latency_regret REAL DEFAULT 0,
      evaluated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_benchmarks_project ON benchmark_reports(project_id);
    CREATE INDEX IF NOT EXISTS idx_benchmarks_version ON benchmark_reports(model_version);
    CREATE INDEX IF NOT EXISTS idx_benchmarks_status ON benchmark_reports(status);
    CREATE INDEX IF NOT EXISTS idx_golden_sets_project ON golden_test_sets(project_id);
  `);
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD Operations
// ─────────────────────────────────────────────────────────────────────────────

export function createBenchmarkReport(projectId, modelVersion, taskType, trainingRunId = null) {
  const db = getDb();
  const id = `bench-${uuidv4().slice(0, 8)}`;

  db.prepare(`
    INSERT INTO benchmark_reports (id, project_id, model_version, task_type, training_run_id, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(id, projectId, modelVersion, taskType, trainingRunId);

  return id;
}

export function updateBenchmarkReport(id, updates) {
  const db = getDb();
  const allowed = [
    'status', 'task_metrics', 'training_metrics', 'data_quality', 'data_split',
    'reliability', 'calibration', 'data_slices', 'baseline_comparison', 'alternatives',
    'composite_score', 'regression_test', 'golden_test_results', 'user_facing',
    'known_weaknesses', 'recommendations', 'completed_at'
  ];

  const sets = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowed.includes(key)) {
      sets.push(`${key} = ?`);
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
    }
  }

  if (sets.length === 0) return null;
  values.push(id);

  db.prepare(`UPDATE benchmark_reports SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getBenchmarkReport(id);
}

export function getBenchmarkReport(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM benchmark_reports WHERE id = ?').get(id);
  if (!row) return null;
  return parseBenchmarkRow(row);
}

export function getProjectBenchmarks(projectId, limit = 20) {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM benchmark_reports WHERE project_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(projectId, limit);
  return rows.map(parseBenchmarkRow);
}

export function getLatestBenchmark(projectId) {
  const db = getDb();
  const row = db.prepare(
    'SELECT * FROM benchmark_reports WHERE project_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1'
  ).get(projectId, 'completed');
  if (!row) return null;
  return parseBenchmarkRow(row);
}

export function deleteBenchmarkReport(id) {
  const db = getDb();
  db.prepare('DELETE FROM benchmark_reports WHERE id = ?').run(id);
}

// ─── Golden Test Sets ────────────────────────────────────────────────────────

export function createGoldenTestSet(projectId, data, name = 'Golden Test Set') {
  const db = getDb();
  const id = `golden-${uuidv4().slice(0, 8)}`;
  const records = Array.isArray(data) ? data : [];

  db.prepare(`
    INSERT INTO golden_test_sets (id, project_id, name, records_count, data)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, projectId, name, records.length, JSON.stringify(records));

  return id;
}

export function getGoldenTestSet(projectId) {
  const db = getDb();
  const row = db.prepare(
    'SELECT * FROM golden_test_sets WHERE project_id = ? ORDER BY created_at DESC LIMIT 1'
  ).get(projectId);
  if (!row) return null;
  return { ...row, data: safeJsonParse(row.data, []) };
}

export function updateGoldenTestSet(id, data) {
  const db = getDb();
  const records = Array.isArray(data) ? data : [];
  db.prepare(`
    UPDATE golden_test_sets SET data = ?, records_count = ?, updated_at = datetime('now') WHERE id = ?
  `).run(JSON.stringify(records), records.length, id);
}

// ─── Recommendation Benchmark ────────────────────────────────────────────────

export function saveRecommendationBenchmark(metrics) {
  const db = getDb();
  const id = `recbench-${uuidv4().slice(0, 8)}`;
  db.prepare(`
    INSERT INTO recommendation_benchmarks (id, total_tasks, tasks_evaluated, success_rate, quality_regret, cost_regret, latency_regret)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, metrics.totalTasks, metrics.tasksEvaluated, metrics.successRate, metrics.qualityRegret, metrics.costRegret, metrics.latencyRegret);
  return id;
}

export function getLatestRecommendationBenchmark() {
  const db = getDb();
  return db.prepare('SELECT * FROM recommendation_benchmarks ORDER BY evaluated_at DESC LIMIT 1').get() || null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseBenchmarkRow(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    modelVersion: row.model_version,
    datasetVersion: row.dataset_version,
    evaluationVersion: row.evaluation_version,
    trainingRunId: row.training_run_id,
    taskType: row.task_type,
    status: row.status,
    taskMetrics: safeJsonParse(row.task_metrics),
    trainingMetrics: safeJsonParse(row.training_metrics),
    dataQuality: safeJsonParse(row.data_quality),
    dataSplit: safeJsonParse(row.data_split),
    reliability: safeJsonParse(row.reliability),
    calibration: safeJsonParse(row.calibration),
    dataSlices: safeJsonParse(row.data_slices, []),
    baselineComparison: safeJsonParse(row.baseline_comparison),
    alternatives: safeJsonParse(row.alternatives),
    compositeScore: safeJsonParse(row.composite_score),
    regressionTest: safeJsonParse(row.regression_test),
    goldenTestResults: safeJsonParse(row.golden_test_results),
    userFacing: safeJsonParse(row.user_facing),
    knownWeaknesses: safeJsonParse(row.known_weaknesses, []),
    recommendations: safeJsonParse(row.recommendations, []),
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function safeJsonParse(str, fallback = null) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}
