import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

// ── GET /api/analytics/overview ───────────────────────────
router.get('/overview', (req, res) => {
  const { projectId, userId = 'demo-user', days = 7 } = req.query;
  const db = getDb();

  let whereClause = `r.created_at > datetime('now', '-${parseInt(days)} days')`;
  const params = [];

  if (projectId) {
    whereClause += ' AND r.project_id = ?';
    params.push(projectId);
  } else {
    // All projects for this user
    whereClause += ` AND r.project_id IN (SELECT id FROM projects WHERE user_id = '${userId}')`;
  }

  const totalRequests = db.prepare(`SELECT COUNT(*) as count FROM api_requests r WHERE ${whereClause}`).get(...params);
  const successRequests = db.prepare(`SELECT COUNT(*) as count FROM api_requests r WHERE ${whereClause} AND r.status_code = 200`).get(...params);
  const avgLatency = db.prepare(`SELECT AVG(latency_ms) as avg FROM api_requests r WHERE ${whereClause} AND status_code = 200`).get(...params);
  const p95Latency = db.prepare(`
    SELECT latency_ms FROM api_requests r WHERE ${whereClause} AND status_code = 200
    ORDER BY latency_ms ASC
    LIMIT 1 OFFSET (SELECT COUNT(*) * 95 / 100 FROM api_requests r2 WHERE ${whereClause.replace(/r\./g, 'r2.')} AND status_code = 200)
  `).get(...params, ...params);

  res.json({
    totalRequests: totalRequests.count,
    successRequests: successRequests.count,
    errorRequests: totalRequests.count - successRequests.count,
    errorRate: totalRequests.count > 0 ? ((totalRequests.count - successRequests.count) / totalRequests.count * 100).toFixed(2) : '0',
    avgLatencyMs: Math.round(avgLatency.avg || 0),
    p95LatencyMs: p95Latency?.latency_ms || 0,
  });
});

// ── GET /api/analytics/timeseries ─────────────────────────
router.get('/timeseries', (req, res) => {
  const { projectId, userId = 'demo-user', days = 7 } = req.query;
  const db = getDb();

  const projectFilter = projectId
    ? `AND r.project_id = '${projectId}'`
    : `AND r.project_id IN (SELECT id FROM projects WHERE user_id = '${userId}')`;

  const rows = db.prepare(`
    SELECT 
      date(r.created_at) as date,
      COUNT(*) as requests,
      SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END) as success,
      SUM(CASE WHEN status_code != 200 THEN 1 ELSE 0 END) as errors,
      AVG(CASE WHEN status_code = 200 THEN latency_ms END) as avg_latency
    FROM api_requests r
    WHERE r.created_at > datetime('now', '-${parseInt(days)} days')
    ${projectFilter}
    GROUP BY date(r.created_at)
    ORDER BY date ASC
  `).all();

  res.json(rows.map(r => ({
    date: r.date,
    requests: r.requests,
    success: r.success,
    errors: r.errors,
    avgLatency: Math.round(r.avg_latency || 0),
  })));
});

// ── GET /api/analytics/requests ───────────────────────────
router.get('/requests', (req, res) => {
  const { projectId, limit = 50, offset = 0 } = req.query;

  let where = '1=1';
  const params = [];
  if (projectId) { where += ' AND r.project_id = ?'; params.push(projectId); }

  const rows = getDb().prepare(`
    SELECT r.*, p.name as project_name
    FROM api_requests r
    LEFT JOIN projects p ON p.id = r.project_id
    WHERE ${where}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), parseInt(offset));

  const total = getDb().prepare(`SELECT COUNT(*) as count FROM api_requests r WHERE ${where}`).get(...params);

  res.json({
    total: total.count,
    requests: rows.map(r => ({
      id: r.id,
      projectId: r.project_id,
      projectName: r.project_name,
      latencyMs: r.latency_ms,
      statusCode: r.status_code,
      modelVersion: r.model_version,
      createdAt: r.created_at,
    }))
  });
});

// ── GET /api/analytics/models ─────────────────────────────
router.get('/models', (req, res) => {
  const { userId = 'demo-user' } = req.query;

  const rows = getDb().prepare(`
    SELECT p.id, p.name, p.status, p.selected_approach, p.selected_model,
      p.model_health, p.updated_at,
      mv.version as current_version, mv.accuracy,
      COUNT(r.id) as total_requests,
      AVG(r.latency_ms) as avg_latency,
      SUM(CASE WHEN r.status_code != 200 THEN 1 ELSE 0 END) as error_count
    FROM projects p
    LEFT JOIN model_versions mv ON mv.project_id = p.id AND mv.status = 'production'
    LEFT JOIN api_requests r ON r.project_id = p.id AND r.created_at > datetime('now', '-1 day')
    WHERE p.user_id = ? AND p.status = 'production'
    GROUP BY p.id
  `).all(userId);

  res.json(rows.map(r => {
    const health = r.model_health ? JSON.parse(r.model_health) : null;
    return {
      id: r.id, name: r.name, status: r.status,
      approach: r.selected_approach, model: r.selected_model,
      currentVersion: r.current_version, accuracy: r.accuracy,
      healthScore: health?.score, requestsToday: r.total_requests,
      avgLatency: Math.round(r.avg_latency || 0),
      errorRate: r.total_requests > 0 ? ((r.error_count / r.total_requests) * 100).toFixed(1) : '0',
      updatedAt: r.updated_at,
    };
  }));
});

export default router;
