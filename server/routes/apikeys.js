import { Router } from 'express';
import { getDb } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Generate OpenAI-style API key
function generateApiKey(prefix = 'fnd_sk') {
  const rand = Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('');
  return `${prefix}_${rand}`;
}

// GET /api/apikeys/:projectId — list keys for a project
router.get('/:projectId', (req, res) => {
  const rows = getDb().prepare(
    'SELECT * FROM api_keys WHERE project_id = ? ORDER BY created_at DESC'
  ).all(req.params.projectId);

  res.json(rows.map((k) => ({
    id: k.id,
    name: k.name,
    keyPreview: k.key_value.slice(0, 16) + '…',
    keyValue: k.key_value,
    isActive: !!k.is_active,
    requestsCount: k.requests_count,
    lastUsed: k.last_used,
    createdAt: k.created_at,
  })));
});

// POST /api/apikeys/:projectId — create new key
router.post('/:projectId', (req, res) => {
  const { name = 'API Key' } = req.body;
  const id = uuidv4();
  const keyValue = generateApiKey();
  const now = new Date().toISOString();

  getDb().prepare(
    'INSERT INTO api_keys (id, project_id, name, key_value, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, req.params.projectId, name, keyValue, now);

  res.status(201).json({ id, name, keyValue, isActive: true, requestsCount: 0, createdAt: now });
});

// PATCH /api/apikeys/:id — toggle active/inactive
router.patch('/:id', (req, res) => {
  const { isActive } = req.body;
  getDb().prepare('UPDATE api_keys SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/apikeys/:id — revoke key
router.delete('/:id', (req, res) => {
  getDb().prepare('DELETE FROM api_keys WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
