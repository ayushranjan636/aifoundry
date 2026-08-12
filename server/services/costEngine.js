import { getDb } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

// ─── Pricing Configuration ───────────────────────────────────
export function getConfig(key) {
  const row = getDb().prepare('SELECT value FROM pricing_config WHERE key = ?').get(key);
  return row ? row.value : null;
}

export function getAllConfig() {
  const rows = getDb().prepare('SELECT key, value, description FROM pricing_config').all();
  const config = {};
  for (const r of rows) config[r.key] = { value: r.value, description: r.description };
  return config;
}

export function updateConfig(key, value) {
  getDb().prepare('UPDATE pricing_config SET value = ?, updated_at = datetime("now") WHERE key = ?').run(value, key);
}

// ─── Provider Pricing ────────────────────────────────────────
export function getProviderPrice(provider, model) {
  return getDb().prepare(
    'SELECT * FROM provider_pricing WHERE provider = ? AND model = ? AND is_active = 1 ORDER BY effective_from DESC LIMIT 1'
  ).get(provider, model);
}

export function getAllProviderPricing() {
  return getDb().prepare('SELECT * FROM provider_pricing WHERE is_active = 1 ORDER BY provider, model').all();
}

export function getComputePricing(instanceType, region = 'us-east-1') {
  return getDb().prepare(
    'SELECT * FROM compute_pricing WHERE instance_type = ? AND region = ? AND is_active = 1'
  ).get(instanceType, region);
}

export function getGPUOptions(region = 'us-east-1') {
  return getDb().prepare(
    'SELECT * FROM compute_pricing WHERE gpu_count > 0 AND region = ? AND is_active = 1 ORDER BY on_demand_hourly'
  ).all(region);
}

export function getStoragePricing(provider, service, tier, region = 'us-east-1') {
  return getDb().prepare(
    'SELECT * FROM storage_pricing WHERE provider = ? AND service = ? AND tier = ? AND region = ? AND is_active = 1'
  ).get(provider, service, tier, region);
}

// ─── Token Cost Calculation ──────────────────────────────────
export function calculateTokenCost(provider, model, inputTokens, outputTokens) {
  const pricing = getProviderPrice(provider, model);
  if (!pricing) return { inputCost: 0, outputCost: 0, totalCost: 0, error: 'Pricing not found' };

  const inputCost = (inputTokens / 1_000_000) * (pricing.input_price_per_1m_tokens || 0);
  const outputCost = (outputTokens / 1_000_000) * (pricing.output_price_per_1m_tokens || 0);

  return {
    inputCost: roundCost(inputCost),
    outputCost: roundCost(outputCost),
    totalCost: roundCost(inputCost + outputCost),
    model: pricing.model,
    inputPricePer1M: pricing.input_price_per_1m_tokens,
    outputPricePer1M: pricing.output_price_per_1m_tokens,
  };
}

// ─── Embedding Cost ──────────────────────────────────────────
export function calculateEmbeddingCost(provider, model, totalTokens) {
  const pricing = getProviderPrice(provider, model);
  if (!pricing || !pricing.embedding_price_per_1m_tokens) return { totalCost: 0, error: 'Pricing not found' };

  const cost = (totalTokens / 1_000_000) * pricing.embedding_price_per_1m_tokens;
  return { totalCost: roundCost(cost), pricePer1M: pricing.embedding_price_per_1m_tokens };
}

// ─── Fine-tuning Cost ────────────────────────────────────────
export function calculateFineTuningCost(provider, model, trainingTokens, epochs = 3) {
  const pricing = getProviderPrice(provider, model);
  if (!pricing || !pricing.training_price_per_1m_tokens) {
    return estimateGPUFineTuningCost(trainingTokens, epochs);
  }

  const totalTrainingTokens = trainingTokens * epochs;
  const trainingCost = (totalTrainingTokens / 1_000_000) * pricing.training_price_per_1m_tokens;

  return {
    trainingCost: roundCost(trainingCost),
    totalTokensTrained: totalTrainingTokens,
    epochs,
    pricePer1MTokens: pricing.training_price_per_1m_tokens,
    type: 'api_fine_tuning',
  };
}

function estimateGPUFineTuningCost(datasetTokens, epochs) {
  const tokensPerSecond = 50_000;
  const totalTokens = datasetTokens * epochs;
  const estimatedHours = totalTokens / tokensPerSecond / 3600;

  const gpuPricing = getDb().prepare(
    "SELECT * FROM compute_pricing WHERE gpu_type = 'A10G' AND gpu_count = 1 AND region = 'us-east-1' AND is_active = 1 LIMIT 1"
  ).get();

  const gpuHourly = gpuPricing ? gpuPricing.on_demand_hourly : 1.00;
  const gpuCost = estimatedHours * gpuHourly;
  const storageCost = 0.50;
  const dataProcCost = estimatedHours * 0.10;

  return {
    trainingCost: roundCost(gpuCost + storageCost + dataProcCost),
    gpuCost: roundCost(gpuCost),
    storageCost,
    dataProcessingCost: roundCost(dataProcCost),
    estimatedHours: Math.round(estimatedHours * 100) / 100,
    gpuType: gpuPricing?.gpu_type || 'A10G',
    instanceType: gpuPricing?.instance_type || 'g5.xlarge',
    epochs,
    type: 'gpu_fine_tuning',
  };
}

// ─── RAG Cost ────────────────────────────────────────────────
export function calculateRAGCost(params) {
  const {
    documentCount = 0,
    totalChunks = 0,
    avgTokensPerChunk = 500,
    embeddingModel = 'text-embedding-3-small',
    llmModel = 'gpt-4o-mini',
    queriesPerDay = 100,
    storageGB = 1,
  } = params;

  // Ingestion cost
  const totalEmbeddingTokens = totalChunks * avgTokensPerChunk;
  const embeddingCost = calculateEmbeddingCost('openai', embeddingModel, totalEmbeddingTokens);

  // Vector DB storage
  const vectorDbMonthly = storageGB * (getConfig('vector_db_per_gb_month') || 0.25);

  // Per-query cost (embedding query + LLM call)
  const avgQueryTokens = 200;
  const avgContextTokens = 2000;
  const avgOutputTokens = 500;
  const queryEmbeddingCost = calculateEmbeddingCost('openai', embeddingModel, avgQueryTokens);
  const llmCost = calculateTokenCost('openai', llmModel, avgQueryTokens + avgContextTokens, avgOutputTokens);

  const perQueryCost = queryEmbeddingCost.totalCost + llmCost.totalCost;
  const dailyQueryCost = perQueryCost * queriesPerDay;
  const monthlyQueryCost = dailyQueryCost * 30;

  const vectorOpsMonthly = ((queriesPerDay * 30) / 1_000_000) * (getConfig('vector_db_per_1m_operations') || 0.10);

  return {
    ingestion: {
      embeddingCost: embeddingCost.totalCost,
      documentCount,
      totalChunks,
    },
    storage: {
      vectorDbMonthly: roundCost(vectorDbMonthly),
      storageGB,
    },
    runtime: {
      perQueryCost: roundCost(perQueryCost),
      dailyCost: roundCost(dailyQueryCost),
      monthlyCost: roundCost(monthlyQueryCost),
      vectorOpsMonthly: roundCost(vectorOpsMonthly),
    },
    totalMonthly: roundCost(monthlyQueryCost + vectorDbMonthly + vectorOpsMonthly),
    totalIngestion: roundCost(embeddingCost.totalCost),
  };
}

// ─── Deployment Cost ─────────────────────────────────────────
export function calculateDeploymentCost(params) {
  const {
    instanceType = 'g6.xlarge',
    region = 'us-east-1',
    hoursPerDay = 24,
    storageGB = 20,
    requestsPerDay = 1000,
    useSpot = false,
    scaleToZero = false,
  } = params;

  const compute = getComputePricing(instanceType, region);
  if (!compute) return { error: 'Instance type not found' };

  const hourlyRate = useSpot ? (compute.spot_hourly || compute.on_demand_hourly) : compute.on_demand_hourly;
  const effectiveHoursPerDay = scaleToZero ? Math.min(hoursPerDay, Math.max(2, requestsPerDay / 200)) : hoursPerDay;

  const dailyComputeCost = hourlyRate * effectiveHoursPerDay;
  const monthlyComputeCost = dailyComputeCost * 30;

  // Storage
  const storagePricing = getStoragePricing('aws', 'ebs', 'gp3', region);
  const monthlyStorageCost = storageGB * (storagePricing?.price_per_gb_month || 0.08);

  // Network (estimate based on requests)
  const avgResponseSizeKB = 2;
  const monthlyEgressGB = (requestsPerDay * 30 * avgResponseSizeKB) / 1_000_000;
  const networkCost = monthlyEgressGB * (getConfig('network_egress_per_gb') || 0.09);

  // Load balancer
  const lbCost = (getConfig('load_balancer_hourly') || 0.025) * effectiveHoursPerDay * 30;

  // Monitoring
  const monitoringCost = getConfig('monitoring_per_project_month') || 2.00;

  return {
    compute: {
      instanceType,
      hourlyRate: roundCost(hourlyRate),
      hoursPerDay: effectiveHoursPerDay,
      monthlyComputeCost: roundCost(monthlyComputeCost),
      isSpot: useSpot,
      scaleToZero,
    },
    storage: {
      gb: storageGB,
      monthlyCost: roundCost(monthlyStorageCost),
    },
    network: {
      estimatedEgressGB: roundCost(monthlyEgressGB),
      monthlyCost: roundCost(networkCost),
    },
    loadBalancer: { monthlyCost: roundCost(lbCost) },
    monitoring: { monthlyCost: monitoringCost },
    totalMonthly: roundCost(monthlyComputeCost + monthlyStorageCost + networkCost + lbCost + monitoringCost),
    gpu: compute.gpu_type ? { type: compute.gpu_type, count: compute.gpu_count, memoryGB: compute.gpu_memory_gb } : null,
  };
}

// ─── Training Job Cost Estimation ────────────────────────────
export function estimateTrainingJobCost(params) {
  const {
    approach = 'fine-tuning',
    model = 'qwen',
    datasetRows = 50000,
    datasetSizeGB = 0.5,
    estimatedTokens = null,
    epochs = 3,
    gpuType = 'g5.xlarge',
    gpuCount = 1,
    region = 'us-east-1',
  } = params;

  // Realistic GPU-hour estimation based on approach
  let estimatedTrainingHours;
  if (approach === 'fine-tuning') {
    // Fine-tuning: 8B model on 50K rows ~ 5hrs on A10G, scales with data
    const baseHours = model === 'gemma' ? 3 : model === 'qwen' ? 4 : model === 'llama' ? 5 : 4;
    const dataScale = Math.max(1, datasetRows / 50000);
    estimatedTrainingHours = baseHours * Math.sqrt(dataScale) * (epochs / 3);
  } else if (approach === 'slm') {
    // SLM: smaller model training + quantization/optimization passes
    const baseHours = model === 'gemma' ? 3 : 4;
    const dataScale = Math.max(1, datasetRows / 50000);
    estimatedTrainingHours = baseHours * Math.sqrt(dataScale) * (epochs / 3);
  } else {
    // RAG/Prompting: minimal compute (embedding generation, setup)
    estimatedTrainingHours = 0.5;
  }

  // GPU compute cost with realistic rates
  const compute = getComputePricing(gpuType, region);
  const gpuHourly = compute ? compute.on_demand_hourly : 3.00;
  const gpuCost = estimatedTrainingHours * gpuHourly * gpuCount;

  // Data processing (CPU-based, ~20% of training time)
  const dataProcHours = estimatedTrainingHours * 0.20;
  const cpuHourly = 0.50;
  const dataProcCost = dataProcHours * cpuHourly;

  // Storage (dataset + checkpoints + model artifacts) — realistic
  const storagePricing = getStoragePricing('aws', 's3', 'standard', region);
  const totalStorageGB = datasetSizeGB + (gpuCount * 10) + 5;
  const storageMonthly = totalStorageGB * (storagePricing?.price_per_gb_month || 0.023);
  const storageCost = Math.max(2.00, storageMonthly * (estimatedTrainingHours / 720) * 30);

  // Network (model download + data transfer)
  const networkCost = Math.max(1.00, (datasetSizeGB + 4) * (getConfig('network_egress_per_gb') || 0.09) + 0.80);

  // Evaluation cost (comprehensive eval after training)
  const evalCost = approach === 'fine-tuning' ? 3.50 : approach === 'slm' ? 2.50 : 0.50;

  // Monitoring & logging
  const monitoringCost = Math.max(1.00, (getConfig('monitoring_per_project_month') || 2.00) * (estimatedTrainingHours / 720) * 10);

  const directCost = gpuCost + dataProcCost + storageCost + networkCost + evalCost + monitoringCost;

  return {
    breakdown: {
      gpuCompute: roundCost(gpuCost),
      dataProcessing: roundCost(dataProcCost),
      storage: roundCost(storageCost),
      network: roundCost(networkCost),
      evaluation: roundCost(evalCost),
      monitoring: roundCost(monitoringCost),
    },
    directCost: roundCost(directCost),
    estimatedTrainingHours: Math.round(estimatedTrainingHours * 100) / 100,
    totalTokensTrained: (estimatedTokens || datasetRows * 150) * epochs,
    gpuType: compute?.gpu_type || 'A10G',
    instanceType: gpuType,
    gpuCount,
    epochs,
  };
}

// ─── Margin & Pricing Engine ─────────────────────────────────
export function calculateCustomerPrice(directCost) {
  const overheadPct = getConfig('shared_overhead_percentage') || 0.10;
  const bufferPct = getConfig('cost_buffer_percentage') || 0.05;
  const targetMargin = getConfig('target_gross_margin') || 0.50;
  const paymentFee = getConfig('payment_fee_percentage') || 0.03;
  const minTransaction = getConfig('minimum_transaction') || 0.50;

  const overheadAllocation = directCost * overheadPct;
  const costBuffer = directCost * bufferPct;
  const adjustedCost = directCost + overheadAllocation + costBuffer;

  // Price = AdjustedCost / (1 - targetMargin - paymentFee)
  const denominator = 1 - targetMargin - paymentFee;
  let customerPrice = adjustedCost / denominator;

  // Apply minimum
  customerPrice = Math.max(customerPrice, minTransaction);

  const grossProfit = customerPrice - adjustedCost;
  const actualMargin = customerPrice > 0 ? grossProfit / customerPrice : 0;
  const paymentFeeAmount = customerPrice * paymentFee;
  const netRevenue = customerPrice - paymentFeeAmount;
  const netMargin = netRevenue > 0 ? (netRevenue - adjustedCost) / netRevenue : 0;

  return {
    directCost: roundCost(directCost),
    overheadAllocation: roundCost(overheadAllocation),
    costBuffer: roundCost(costBuffer),
    adjustedCost: roundCost(adjustedCost),
    customerPrice: roundCost(customerPrice),
    grossProfit: roundCost(grossProfit),
    grossMargin: Math.round(actualMargin * 1000) / 10,
    paymentFee: roundCost(paymentFeeAmount),
    netRevenue: roundCost(netRevenue),
    targetMargin: targetMargin * 100,
    formula: {
      overheadPct: overheadPct * 100,
      bufferPct: bufferPct * 100,
      paymentFeePct: paymentFee * 100,
    },
  };
}

// ─── Full Project Cost Estimate ──────────────────────────────
export function estimateProjectCost(params) {
  const {
    approach = 'fine-tuning',
    model = 'qwen',
    datasetRows = 50000,
    datasetSizeGB = 0.5,
    queriesPerDay = 100,
    deploymentHoursPerDay = 24,
    includeDeployment = false,
    includeRAG = false,
    documentCount = 0,
    epochs = 3,
  } = params;

  // Training cost
  const training = estimateTrainingJobCost({ approach, model, datasetRows, datasetSizeGB, epochs });

  // Deployment cost — only include if explicitly requested
  let deployment = null;
  if (includeDeployment) {
    const instanceType = model === 'gemma' ? 'g6.xlarge' : 'g5.xlarge';
    deployment = calculateDeploymentCost({
      instanceType,
      hoursPerDay: deploymentHoursPerDay,
      requestsPerDay: queriesPerDay,
      scaleToZero: queriesPerDay < 500,
    });
  }

  // RAG cost
  let rag = null;
  if (includeRAG || approach === 'rag') {
    rag = calculateRAGCost({
      documentCount,
      totalChunks: documentCount * 10,
      queriesPerDay,
    });
  }

  // Calculate pricing
  const trainingPricing = calculateCustomerPrice(training.directCost);

  // Per-request cost estimate (pay-as-you-go reference)
  const perRequestCost = approach === 'fine-tuning' || approach === 'slm' ? 0.002 : 0.004;

  return {
    training: {
      ...training,
      pricing: trainingPricing,
    },
    deployment: deployment ? { ...deployment, pricing: calculateCustomerPrice(deployment.totalMonthly) } : null,
    rag,
    summary: {
      oneTimeTrainingCost: trainingPricing.customerPrice,
      estimatedMonthlyCost: 0,
      perRequestCost: roundCost(perRequestCost),
      per1KRequests: roundCost(perRequestCost * 1000),
    },
    costRange: {
      trainingMin: roundCost(trainingPricing.customerPrice * 0.85),
      trainingMax: roundCost(trainingPricing.customerPrice * 1.20),
      monthlyMin: 0,
      monthlyMax: 0,
    },
  };
}

// ─── Usage Recording ─────────────────────────────────────────
export function recordUsage(params) {
  const { projectId, userId, resourceType, metric, quantity, unit, provider, region, metadata } = params;
  const id = uuidv4();
  getDb().prepare(`
    INSERT INTO usage_meters (id, project_id, user_id, resource_type, metric, quantity, unit, provider, region, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, projectId, userId, resourceType, metric, quantity, unit, provider || null, region || null, metadata ? JSON.stringify(metadata) : null);
  return id;
}

// ─── Cost Ledger ─────────────────────────────────────────────
export function recordCost(params) {
  const {
    projectId, userId, costCategory, description,
    providerCost = 0, infrastructureCost = 0,
    jobId, usageMeterId, metadata,
  } = params;

  const pricing = calculateCustomerPrice(providerCost + infrastructureCost);
  const id = uuidv4();

  getDb().prepare(`
    INSERT INTO cost_ledger (id, project_id, user_id, cost_category, description, provider_cost, infrastructure_cost, overhead_allocation, cost_buffer, total_cost, customer_price, margin_percentage, job_id, usage_meter_id, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, projectId, userId, costCategory, description,
    providerCost, infrastructureCost,
    pricing.overheadAllocation, pricing.costBuffer,
    pricing.adjustedCost, pricing.customerPrice,
    pricing.grossMargin, jobId || null, usageMeterId || null,
    metadata ? JSON.stringify(metadata) : null
  );

  return { id, ...pricing };
}

// ─── Project Cost Summary ────────────────────────────────────
export function getProjectCostSummary(projectId) {
  const db = getDb();

  const totals = db.prepare(`
    SELECT
      SUM(provider_cost) as total_provider_cost,
      SUM(infrastructure_cost) as total_infra_cost,
      SUM(total_cost) as total_cost,
      SUM(customer_price) as total_revenue,
      COUNT(*) as event_count
    FROM cost_ledger WHERE project_id = ?
  `).get(projectId);

  const byCategory = db.prepare(`
    SELECT
      cost_category,
      SUM(provider_cost) as provider_cost,
      SUM(customer_price) as revenue,
      COUNT(*) as count
    FROM cost_ledger WHERE project_id = ?
    GROUP BY cost_category
  `).all(projectId);

  const revenue = totals.total_revenue || 0;
  const cost = totals.total_cost || 0;
  const grossProfit = revenue - cost;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  return {
    totals: {
      providerCost: roundCost(totals.total_provider_cost || 0),
      infrastructureCost: roundCost(totals.total_infra_cost || 0),
      totalCost: roundCost(cost),
      totalRevenue: roundCost(revenue),
      grossProfit: roundCost(grossProfit),
      grossMargin: Math.round(grossMargin * 10) / 10,
      eventCount: totals.event_count,
    },
    byCategory,
  };
}

// ─── Budget Management ───────────────────────────────────────
export function checkBudget(userId, projectId) {
  const db = getDb();
  const budgets = db.prepare(
    'SELECT * FROM budgets WHERE user_id = ? AND (project_id = ? OR project_id IS NULL)'
  ).all(userId, projectId);

  const alerts = [];
  for (const budget of budgets) {
    const ratio = budget.current_spend / budget.limit_amount;
    if (ratio >= 1.0 && budget.is_hard_limit) {
      alerts.push({ type: 'exceeded', budget, blocked: true });
    } else if (ratio >= budget.alert_threshold) {
      alerts.push({ type: 'warning', budget, blocked: false, percentUsed: Math.round(ratio * 100) });
    }
  }
  return alerts;
}

// ─── Cost Optimization Recommendations ───────────────────────
export function getCostOptimizations(projectId) {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) return [];

  const recommendations = [];

  // Check if project uses on-demand when spot would work
  const trainingCosts = db.prepare('SELECT * FROM training_costs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1').get(projectId);
  if (trainingCosts && trainingCosts.runtime_hours > 1) {
    const compute = getComputePricing(trainingCosts.gpu_type || 'g5.xlarge', 'us-east-1');
    if (compute && compute.spot_hourly && compute.spot_hourly < compute.on_demand_hourly * 0.6) {
      const savings = (compute.on_demand_hourly - compute.spot_hourly) * trainingCosts.runtime_hours;
      recommendations.push({
        type: 'use_spot',
        title: 'Use Spot instances for training',
        description: `Spot pricing for ${compute.instance_type} is ${Math.round((1 - compute.spot_hourly / compute.on_demand_hourly) * 100)}% cheaper.`,
        estimatedSavings: roundCost(savings),
        risk: 'Training may be interrupted (rare for short jobs)',
      });
    }
  }

  // Check deployment scale-to-zero opportunity
  const deployment = project.deployment ? JSON.parse(project.deployment || '{}') : null;
  if (deployment && deployment.requestsToday < 100) {
    recommendations.push({
      type: 'scale_to_zero',
      title: 'Enable scale-to-zero',
      description: 'Your model has low traffic. Scale-to-zero saves compute when idle.',
      estimatedSavings: roundCost(0.80 * 20),
      risk: 'First request after idle will have ~30s cold start',
    });
  }

  // Check if smaller model would suffice
  if (project.selected_model === 'gpt' || project.selected_model === 'deepseek') {
    recommendations.push({
      type: 'downsize_model',
      title: 'Consider a smaller model',
      description: 'If task accuracy allows, switching to Qwen or Gemma reduces inference cost significantly.',
      estimatedSavings: null,
      risk: 'May reduce output quality — test before switching',
    });
  }

  return recommendations;
}

// ─── Admin Profitability ─────────────────────────────────────
export function getAdminProfitability(period = '30d') {
  const db = getDb();
  const daysBack = parseInt(period) || 30;
  const since = new Date(Date.now() - daysBack * 86400000).toISOString();

  const overall = db.prepare(`
    SELECT
      SUM(customer_price) as total_revenue,
      SUM(total_cost) as total_cost,
      SUM(provider_cost) as provider_cost,
      COUNT(*) as transactions
    FROM cost_ledger WHERE created_at >= ?
  `).get(since);

  const revenue = overall.total_revenue || 0;
  const cost = overall.total_cost || 0;
  const grossMargin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;

  const byProject = db.prepare(`
    SELECT
      project_id,
      SUM(customer_price) as revenue,
      SUM(total_cost) as cost,
      COUNT(*) as transactions
    FROM cost_ledger WHERE created_at >= ?
    GROUP BY project_id
    ORDER BY revenue DESC
  `).all(since);

  const marginAlerts = byProject
    .filter(p => {
      const margin = p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0;
      return margin < 40;
    })
    .map(p => ({
      projectId: p.project_id,
      revenue: roundCost(p.revenue),
      cost: roundCost(p.cost),
      margin: Math.round(((p.revenue - p.cost) / p.revenue) * 100 * 10) / 10,
    }));

  return {
    period: `${daysBack}d`,
    revenue: roundCost(revenue),
    cost: roundCost(cost),
    grossProfit: roundCost(revenue - cost),
    grossMargin: Math.round(grossMargin * 10) / 10,
    targetMargin: (getConfig('target_gross_margin') || 0.50) * 100,
    transactions: overall.transactions,
    byProject: byProject.map(p => ({
      projectId: p.project_id,
      revenue: roundCost(p.revenue),
      cost: roundCost(p.cost),
      margin: p.revenue > 0 ? Math.round(((p.revenue - p.cost) / p.revenue) * 100 * 10) / 10 : 0,
    })),
    marginAlerts,
  };
}

// ─── Utility ─────────────────────────────────────────────────
function roundCost(n) {
  return Math.round((n || 0) * 10000) / 10000;
}
