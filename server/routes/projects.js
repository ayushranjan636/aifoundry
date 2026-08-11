import { Router } from 'express';
import { getDb, parseJSON } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ── GET /api/projects ─────────────────────────────────────
router.get('/', (req, res) => {
  const { userId = 'demo-user' } = req.query;
  const rows = getDb().prepare(`
    SELECT p.*, 
      (SELECT COUNT(*) FROM model_versions WHERE project_id = p.id) as version_count,
      (SELECT COUNT(*) FROM api_requests WHERE project_id = p.id AND created_at > datetime('now','-1 day')) as requests_today
    FROM projects p
    WHERE p.user_id = ?
    ORDER BY p.updated_at DESC
  `).all(userId);

  const projects = rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    objective: row.objective,
    inputFormats: parseJSON(row.input_formats, []),
    outputFormats: parseJSON(row.output_formats, []),
    constraints: row.constraints,
    recommendedApproach: row.recommended_approach,
    selectedApproach: row.selected_approach,
    recommendedModel: row.recommended_model,
    selectedModel: row.selected_model,
    dataset: parseJSON(row.dataset_info),
    datasetAnalysis: parseJSON(row.dataset_analysis),
    buildPlan: parseJSON(row.build_plan),
    buildStatus: parseJSON(row.build_status),
    modelHealth: parseJSON(row.model_health),
    deployment: parseJSON(row.deployment),
    generatedSystemPrompt: row.generated_system_prompt,
    status: row.status,
    versionCount: row.version_count,
    requestsToday: row.requests_today,
    versions: [],
    testCases: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  res.json(projects);
});

// ── GET /api/projects/:id ─────────────────────────────────
router.get('/:id', (req, res) => {
  const row = getDb().prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Project not found' });

  const versions = getDb().prepare('SELECT * FROM model_versions WHERE project_id = ? ORDER BY created_at DESC').all(req.params.id);
  const testCases = getDb().prepare('SELECT * FROM test_cases WHERE project_id = ? ORDER BY created_at DESC LIMIT 20').all(req.params.id);

  res.json({
    id: row.id,
    name: row.name,
    description: row.description,
    objective: row.objective,
    inputFormats: parseJSON(row.input_formats, []),
    outputFormats: parseJSON(row.output_formats, []),
    constraints: row.constraints,
    recommendedApproach: row.recommended_approach,
    selectedApproach: row.selected_approach,
    recommendedModel: row.recommended_model,
    selectedModel: row.selected_model,
    dataset: parseJSON(row.dataset_info),
    datasetAnalysis: parseJSON(row.dataset_analysis),
    buildPlan: parseJSON(row.build_plan),
    buildStatus: parseJSON(row.build_status),
    modelHealth: parseJSON(row.model_health),
    deployment: parseJSON(row.deployment),
    generatedSystemPrompt: row.generated_system_prompt,
    status: row.status,
    versions: versions.map(v => ({
      id: v.id, version: v.version, status: v.status,
      accuracy: v.accuracy, f1Score: v.f1_score, datasetSize: v.dataset_size,
      notes: v.notes, createdAt: v.created_at
    })),
    testCases: testCases.map(t => ({
      id: t.id, name: t.name, type: t.type,
      input: parseJSON(t.input_data, {}),
      result: parseJSON(t.result),
      createdAt: t.created_at
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
});

// ── POST /api/projects ────────────────────────────────────
router.post('/', (req, res) => {
  const { name, description, objective, userId = 'demo-user' } = req.body;
  const id = `project-${Date.now()}`;
  const now = new Date().toISOString();

  getDb().prepare(`
    INSERT INTO projects (id, user_id, name, description, objective, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, name || 'Untitled AI', description || '', objective || '', now, now);

  res.status(201).json({ id, name, status: 'draft', createdAt: now });
});

// ── PATCH /api/projects/:id ────────────────────────────────
router.patch('/:id', (req, res) => {
  const updates = req.body;
  const now = new Date().toISOString();
  const fieldMap = {
    name: 'name', description: 'description', objective: 'objective',
    constraints: 'constraints', status: 'status',
    selectedApproach: 'selected_approach', recommendedApproach: 'recommended_approach',
    selectedModel: 'selected_model', recommendedModel: 'recommended_model',
    generatedSystemPrompt: 'generated_system_prompt',
    dataset: v => JSON.stringify(v),
    datasetAnalysis: v => JSON.stringify(v),
    buildPlan: v => JSON.stringify(v),
    buildStatus: v => JSON.stringify(v),
    modelHealth: v => JSON.stringify(v),
    deployment: v => JSON.stringify(v),
    inputFormats: v => JSON.stringify(v),
    outputFormats: v => JSON.stringify(v),
  };

  const setClauses = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    const col = {
      name: 'name', description: 'description', objective: 'objective',
      constraints: 'constraints', status: 'status',
      selectedApproach: 'selected_approach', recommendedApproach: 'recommended_approach',
      selectedModel: 'selected_model', recommendedModel: 'recommended_model',
      generatedSystemPrompt: 'generated_system_prompt',
      dataset: 'dataset_info', datasetAnalysis: 'dataset_analysis',
      buildPlan: 'build_plan', buildStatus: 'build_status',
      modelHealth: 'model_health', deployment: 'deployment',
      inputFormats: 'input_formats', outputFormats: 'output_formats',
    }[key];

    if (!col) continue;
    setClauses.push(`${col} = ?`);
    values.push(typeof value === 'object' ? JSON.stringify(value) : value);
  }

  if (setClauses.length === 0) return res.json({ ok: true });

  setClauses.push('updated_at = ?');
  values.push(now, req.params.id);

  getDb().prepare(`UPDATE projects SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  res.json({ ok: true, updatedAt: now });
});

// ── POST /api/projects/:id/versions ───────────────────────
router.post('/:id/versions', (req, res) => {
  const { version, status, accuracy, f1Score, datasetSize, notes, systemPrompt } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();

  getDb().prepare(`
    INSERT INTO model_versions (id, project_id, version, status, accuracy, f1_score, dataset_size, notes, system_prompt, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, version, status || 'production', accuracy || 0, f1Score || 0, datasetSize || 0, notes || '', systemPrompt || '', now);

  res.status(201).json({ id, version, status, createdAt: now });
});

// ── GET /api/projects/:id/versions ────────────────────────
router.get('/:id/versions', (req, res) => {
  const rows = getDb().prepare('SELECT * FROM model_versions WHERE project_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(rows.map(v => ({
    id: v.id, version: v.version, status: v.status,
    accuracy: v.accuracy, f1Score: v.f1_score, datasetSize: v.dataset_size,
    notes: v.notes, createdAt: v.created_at
  })));
});

// ── DELETE /api/projects/:id ───────────────────────────────
router.delete('/:id', (req, res) => {
  getDb().prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  getDb().prepare('DELETE FROM model_versions WHERE project_id = ?').run(req.params.id);
  getDb().prepare('DELETE FROM deployments WHERE project_id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
