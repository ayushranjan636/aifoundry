import { Router } from 'express';
import {
  getAllProviderPricing,
  getGPUOptions,
  getAllConfig,
  updateConfig,
  calculateTokenCost,
  calculateEmbeddingCost,
  calculateFineTuningCost,
  calculateRAGCost,
  calculateDeploymentCost,
  estimateTrainingJobCost,
  estimateProjectCost,
  calculateCustomerPrice,
  getProjectCostSummary,
  recordUsage,
  recordCost,
  checkBudget,
  getCostOptimizations,
  getAdminProfitability,
} from '../services/costEngine.js';
import { getDb } from '../db/database.js';

const router = Router();

// ─── Provider Pricing Registry ───────────────────────────────
router.get('/models', (_req, res) => {
  const pricing = getAllProviderPricing();
  res.json({ models: pricing });
});

router.get('/compute', (req, res) => {
  const region = req.query.region || 'us-east-1';
  const gpuOptions = getGPUOptions(region);
  res.json({ instances: gpuOptions });
});

router.get('/config', (_req, res) => {
  const config = getAllConfig();
  res.json({ config });
});

router.patch('/config', (req, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined) return res.status(400).json({ error: 'key and value required' });
  updateConfig(key, value);
  res.json({ ok: true, key, value });
});

// ─── Cost Estimation ─────────────────────────────────────────
router.post('/estimate', (req, res) => {
  const {
    operation,
    provider = 'openai',
    model,
    inputTokens,
    outputTokens,
    datasetTokens,
    datasetRows,
    datasetSizeGB,
    epochs,
    gpuType,
    gpuCount,
    queriesPerDay,
    hoursPerDay,
    documentCount,
    approach,
    includeDeployment,
    includeRAG,
    region,
  } = req.body;

  try {
    let result;

    switch (operation) {
      case 'inference':
        const tokenCost = calculateTokenCost(provider, model, inputTokens || 0, outputTokens || 0);
        result = { ...tokenCost, pricing: calculateCustomerPrice(tokenCost.totalCost) };
        break;

      case 'embedding':
        const embCost = calculateEmbeddingCost(provider, model, datasetTokens || 0);
        result = { ...embCost, pricing: calculateCustomerPrice(embCost.totalCost) };
        break;

      case 'fine_tuning':
        const ftCost = calculateFineTuningCost(provider, model, datasetTokens || 0, epochs || 3);
        result = { ...ftCost, pricing: calculateCustomerPrice(ftCost.trainingCost) };
        break;

      case 'training':
        const trainCost = estimateTrainingJobCost({
          approach, model, datasetRows, datasetSizeGB, epochs, gpuType, gpuCount, region,
        });
        result = { ...trainCost, pricing: calculateCustomerPrice(trainCost.directCost) };
        break;

      case 'rag':
        const ragCost = calculateRAGCost({ documentCount, queriesPerDay, totalChunks: (documentCount || 0) * 10 });
        result = {
          ...ragCost,
          ingestionPricing: calculateCustomerPrice(ragCost.totalIngestion),
          monthlyPricing: calculateCustomerPrice(ragCost.totalMonthly),
        };
        break;

      case 'deployment':
        const deployCost = calculateDeploymentCost({
          instanceType: gpuType || 'g6.xlarge', region, hoursPerDay, requestsPerDay: queriesPerDay,
        });
        result = { ...deployCost, pricing: calculateCustomerPrice(deployCost.totalMonthly) };
        break;

      case 'project':
        result = estimateProjectCost({
          approach, model, datasetRows, datasetSizeGB, queriesPerDay, epochs,
          deploymentHoursPerDay: hoursPerDay, includeDeployment, includeRAG, documentCount,
        });
        break;

      default:
        return res.status(400).json({ error: `Unknown operation: ${operation}` });
    }

    res.json({
      operation,
      estimate: result,
      currency: 'USD',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Quick Price Calculator ──────────────────────────────────
router.post('/calculate', (req, res) => {
  const { cost } = req.body;
  if (cost === undefined) return res.status(400).json({ error: 'cost is required' });
  const pricing = calculateCustomerPrice(parseFloat(cost));
  res.json(pricing);
});

// ─── Project Cost ────────────────────────────────────────────
router.get('/projects/:id/cost', (req, res) => {
  const summary = getProjectCostSummary(req.params.id);
  res.json(summary);
});

router.get('/projects/:id/margin', (req, res) => {
  const summary = getProjectCostSummary(req.params.id);
  const targetMargin = 50;
  const belowTarget = summary.totals.grossMargin < targetMargin;

  res.json({
    ...summary.totals,
    targetMargin,
    belowTarget,
    alert: belowTarget ? `Margin (${summary.totals.grossMargin}%) is below target (${targetMargin}%)` : null,
  });
});

router.get('/projects/:id/optimizations', (req, res) => {
  const optimizations = getCostOptimizations(req.params.id);
  res.json({ optimizations });
});

// ─── Usage Recording ─────────────────────────────────────────
router.post('/usage', (req, res) => {
  const { projectId, userId = 'demo-user', resourceType, metric, quantity, unit, provider, region, metadata } = req.body;
  if (!projectId || !resourceType || !metric || quantity === undefined || !unit) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const id = recordUsage({ projectId, userId, resourceType, metric, quantity, unit, provider, region, metadata });
  res.json({ id, recorded: true });
});

router.get('/usage/:projectId', (req, res) => {
  const { projectId } = req.params;
  const period = req.query.period || '30d';
  const daysBack = parseInt(period) || 30;
  const since = new Date(Date.now() - daysBack * 86400000).toISOString();

  const usage = getDb().prepare(`
    SELECT resource_type, metric, SUM(quantity) as total, unit
    FROM usage_meters
    WHERE project_id = ? AND recorded_at >= ?
    GROUP BY resource_type, metric
  `).all(projectId, since);

  res.json({ projectId, period, usage });
});

// ─── Billing ─────────────────────────────────────────────────
router.get('/billing/:projectId', (req, res) => {
  const { projectId } = req.params;
  const period = req.query.period || '30d';
  const daysBack = parseInt(period) || 30;
  const since = new Date(Date.now() - daysBack * 86400000).toISOString();

  const entries = getDb().prepare(`
    SELECT * FROM cost_ledger
    WHERE project_id = ? AND created_at >= ?
    ORDER BY created_at DESC
    LIMIT 100
  `).all(projectId, since);

  const summary = getProjectCostSummary(projectId);
  res.json({ projectId, period, entries, summary: summary.totals });
});

// ─── Budget Management ───────────────────────────────────────
router.get('/budgets', (req, res) => {
  const userId = req.query.userId || 'demo-user';
  const budgets = getDb().prepare('SELECT * FROM budgets WHERE user_id = ?').all(userId);
  res.json({ budgets });
});

router.post('/budgets', (req, res) => {
  const { userId = 'demo-user', projectId, budgetType, limitAmount, period, alertThreshold, isHardLimit } = req.body;
  if (!budgetType || !limitAmount || !period) {
    return res.status(400).json({ error: 'budgetType, limitAmount, period required' });
  }
  const id = `budget-${Date.now()}`;
  getDb().prepare(`
    INSERT INTO budgets (id, user_id, project_id, budget_type, limit_amount, period, alert_threshold, is_hard_limit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, projectId || null, budgetType, limitAmount, period, alertThreshold || 0.8, isHardLimit ? 1 : 0);

  res.json({ id, created: true });
});

router.delete('/budgets/:id', (req, res) => {
  getDb().prepare('DELETE FROM budgets WHERE id = ?').run(req.params.id);
  res.json({ deleted: true });
});

router.get('/budgets/check/:projectId', (req, res) => {
  const userId = req.query.userId || 'demo-user';
  const alerts = checkBudget(userId, req.params.projectId);
  res.json({ alerts, blocked: alerts.some(a => a.blocked) });
});

// ─── Admin Profitability ─────────────────────────────────────
router.get('/admin/profitability', (req, res) => {
  const period = req.query.period || '30d';
  const profitability = getAdminProfitability(period);
  res.json(profitability);
});

export default router;
