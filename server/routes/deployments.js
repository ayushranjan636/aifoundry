import { Router } from 'express';
import { getDb, parseJSON } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ── GET /api/deployments ──────────────────────────────────
router.get('/', (req, res) => {
  const { userId = 'demo-user' } = req.query;

  const rows = getDb().prepare(`
    SELECT d.*, p.name as project_name, p.selected_model,
      COUNT(r.id) as requests_today,
      AVG(CASE WHEN r.created_at > datetime('now','-1 day') THEN r.latency_ms END) as avg_latency,
      SUM(CASE WHEN r.created_at > datetime('now','-1 day') AND r.status_code != 200 THEN 1 ELSE 0 END) as errors_today
    FROM deployments d
    LEFT JOIN projects p ON p.id = d.project_id AND p.user_id = ?
    LEFT JOIN api_requests r ON r.project_id = d.project_id AND r.created_at > datetime('now','-1 day')
    WHERE p.id IS NOT NULL
    GROUP BY d.id
    ORDER BY d.deployed_at DESC
  `).all(userId);

  res.json(rows.map(r => ({
    id: r.id,
    projectId: r.project_id,
    projectName: r.project_name,
    model: r.selected_model,
    status: r.status,
    endpoint: r.endpoint,
    region: r.region,
    latencyMs: r.avg_latency ? Math.round(r.avg_latency) : r.latency_ms,
    requestsToday: r.requests_today,
    errorRate: r.requests_today > 0 ? ((r.errors_today / r.requests_today) * 100).toFixed(1) : '0',
    deployedAt: r.deployed_at,
  })));
});

// ── POST /api/deployments ─────────────────────────────────
router.post('/', (req, res) => {
  const { projectId, versionId } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();

  const endpoint = `https://api.aifoundry.ai/v1/models/${projectId}/predict`;

  getDb().prepare(`
    INSERT INTO deployments (id, project_id, version_id, status, endpoint, region, latency_ms, deployed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, projectId, versionId || '', 'production', endpoint, 'us-east-1', 0, now);

  // Update project status
  getDb().prepare(`UPDATE projects SET status = 'production', deployment = ?, updated_at = ? WHERE id = ?`)
    .run(JSON.stringify({ status: 'production', endpoint, latencyMs: 0, requestsToday: 0, errorRate: 0, deployedAt: now, region: 'us-east-1' }), now, projectId);

  res.status(201).json({ id, projectId, endpoint, status: 'production', deployedAt: now });
});

// ── DELETE /api/deployments/:id ───────────────────────────
router.delete('/:id', (req, res) => {
  const now = new Date().toISOString();
  getDb().prepare('UPDATE deployments SET status = ?, stopped_at = ? WHERE id = ?').run('stopped', now, req.params.id);
  res.json({ ok: true });
});

export default router;
