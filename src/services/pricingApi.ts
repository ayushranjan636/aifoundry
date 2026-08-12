const API_BASE = import.meta.env.VITE_API_URL || 'https://aifoundry-production.up.railway.app';

async function fetchPricing(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}/api/pricing${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`Pricing API error: ${res.status}`);
  return res.json();
}

export interface CostEstimate {
  directCost: number;
  overheadAllocation: number;
  costBuffer: number;
  adjustedCost: number;
  customerPrice: number;
  grossProfit: number;
  grossMargin: number;
  paymentFee: number;
  netRevenue: number;
  targetMargin: number;
}

export interface TrainingCostBreakdown {
  gpuCompute: number;
  dataProcessing: number;
  storage: number;
  network: number;
  evaluation: number;
  monitoring: number;
}

export interface ProjectCostEstimate {
  training: {
    breakdown: TrainingCostBreakdown;
    directCost: number;
    estimatedTrainingHours: number;
    pricing: CostEstimate;
  };
  deployment: {
    totalMonthly: number;
    pricing: CostEstimate;
    compute: { instanceType: string; hourlyRate: number; monthlyComputeCost: number };
  } | null;
  rag: {
    totalMonthly: number;
    totalIngestion: number;
  } | null;
  summary: {
    oneTimeTrainingCost: number;
    estimatedMonthlyCost: number;
    perRequestCost: number;
    per1KRequests: number;
  };
  costRange: {
    trainingMin: number;
    trainingMax: number;
    monthlyMin: number;
    monthlyMax: number;
  };
}

export const pricingApi = {
  async getProviderModels() {
    return fetchPricing('/models');
  },

  async getComputeOptions(region = 'us-east-1') {
    return fetchPricing(`/compute?region=${region}`);
  },

  async getConfig() {
    return fetchPricing('/config');
  },

  async estimateProject(params: {
    approach: string;
    model: string;
    datasetRows?: number;
    datasetSizeGB?: number;
    queriesPerDay?: number;
    epochs?: number;
    includeDeployment?: boolean;
    includeRAG?: boolean;
    documentCount?: number;
  }): Promise<{ operation: string; estimate: ProjectCostEstimate }> {
    return fetchPricing('/estimate', {
      method: 'POST',
      body: JSON.stringify({ operation: 'project', ...params }),
    });
  },

  async estimateTraining(params: {
    approach: string;
    model: string;
    datasetRows?: number;
    datasetSizeGB?: number;
    epochs?: number;
    gpuType?: string;
  }) {
    return fetchPricing('/estimate', {
      method: 'POST',
      body: JSON.stringify({ operation: 'training', ...params }),
    });
  },

  async estimateInference(provider: string, model: string, inputTokens: number, outputTokens: number) {
    return fetchPricing('/estimate', {
      method: 'POST',
      body: JSON.stringify({ operation: 'inference', provider, model, inputTokens, outputTokens }),
    });
  },

  async estimateDeployment(params: {
    gpuType?: string;
    hoursPerDay?: number;
    queriesPerDay?: number;
    region?: string;
  }) {
    return fetchPricing('/estimate', {
      method: 'POST',
      body: JSON.stringify({ operation: 'deployment', ...params }),
    });
  },

  async getProjectCost(projectId: string) {
    return fetchPricing(`/projects/${projectId}/cost`);
  },

  async getProjectMargin(projectId: string) {
    return fetchPricing(`/projects/${projectId}/margin`);
  },

  async getOptimizations(projectId: string) {
    return fetchPricing(`/projects/${projectId}/optimizations`);
  },

  async getBudgets() {
    return fetchPricing('/budgets');
  },

  async createBudget(params: {
    budgetType: string;
    limitAmount: number;
    period: string;
    projectId?: string;
    alertThreshold?: number;
    isHardLimit?: boolean;
  }) {
    return fetchPricing('/budgets', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async checkBudget(projectId: string) {
    return fetchPricing(`/budgets/check/${projectId}`);
  },

  async getAdminProfitability(period = '30d') {
    return fetchPricing(`/admin/profitability?period=${period}`);
  },

  async getBilling(projectId: string, period = '30d') {
    return fetchPricing(`/billing/${projectId}?period=${period}`);
  },
};

// ─── Local fallback cost estimation (when backend is down) ───
export function estimateProjectCostLocal(params: {
  approach: string;
  model: string;
  datasetRows: number;
  queriesPerDay: number;
  includeRAG: boolean;
}): ProjectCostEstimate {
  const { approach, model, datasetRows, queriesPerDay, includeRAG } = params;

  // Realistic training cost calculation based on approach
  let baseTrainingCost: number;
  let estimatedHours: number;

  if (approach === 'fine-tuning') {
    // Fine-tuning requires significant GPU compute, data prep, evaluation
    // Based on real rates: A100 GPU ~$3.50/hr, training 8B model ~4-8hrs
    const gpuHourly = model === 'gemma' ? 2.50 : model === 'qwen' ? 3.00 : model === 'llama' ? 3.50 : 3.00;
    estimatedHours = datasetRows < 20000 ? 3 : datasetRows < 50000 ? 5 : datasetRows < 100000 ? 8 : 12;
    const gpuCost = estimatedHours * gpuHourly;
    const dataPrepCost = estimatedHours * 0.80;
    const storageCost = 2.50;
    const networkCost = 1.20;
    const evalCost = 3.50;
    const monitoringCost = 1.50;
    baseTrainingCost = gpuCost + dataPrepCost + storageCost + networkCost + evalCost + monitoringCost;
  } else if (approach === 'slm') {
    // SLM: smaller model but still requires compute for optimization/quantization
    const gpuHourly = 2.50;
    estimatedHours = datasetRows < 20000 ? 3 : datasetRows < 50000 ? 4.5 : 7;
    const gpuCost = estimatedHours * gpuHourly;
    const optimizationCost = 5.00;
    const storageCost = 2.00;
    const networkCost = 1.00;
    const evalCost = 3.00;
    const monitoringCost = 1.20;
    baseTrainingCost = gpuCost + optimizationCost + storageCost + networkCost + evalCost + monitoringCost;
  } else {
    // RAG/Prompting: no heavy training, just setup costs
    estimatedHours = 0.5;
    baseTrainingCost = 2.50;
  }

  // Apply overhead (10%) + buffer (5%)
  const directCost = baseTrainingCost;
  const adjustedCost = directCost * 1.15;
  // Target 50% margin + 3% payment fee
  const customerPrice = adjustedCost / (1 - 0.50 - 0.03);

  // GPU compute breakdown
  const gpuRatio = 0.55;
  const gpuCompute = round(directCost * gpuRatio);
  const dataProcCost = round(directCost * 0.12);
  const storageCost = round(directCost * 0.10);
  const networkCost = round(directCost * 0.08);
  const evalCost = round(directCost * 0.10);
  const monitoringCost = round(directCost * 0.05);

  // Per-request cost (for pay-as-you-go reference)
  const perRequestCost = approach === 'fine-tuning' || approach === 'slm'
    ? 0.002
    : 0.004;

  let ragMonthly = 0;
  if (includeRAG) {
    ragMonthly = queriesPerDay * 30 * 0.004 + 2.50;
  }

  return {
    training: {
      breakdown: {
        gpuCompute,
        dataProcessing: dataProcCost,
        storage: storageCost,
        network: networkCost,
        evaluation: evalCost,
        monitoring: monitoringCost,
      },
      directCost: round(directCost),
      estimatedTrainingHours: round(estimatedHours),
      pricing: {
        directCost: round(directCost),
        overheadAllocation: round(directCost * 0.10),
        costBuffer: round(directCost * 0.05),
        adjustedCost: round(adjustedCost),
        customerPrice: round(customerPrice),
        grossProfit: round(customerPrice - adjustedCost),
        grossMargin: 50,
        paymentFee: round(customerPrice * 0.03),
        netRevenue: round(customerPrice * 0.97),
        targetMargin: 50,
      },
    },
    deployment: null,
    rag: includeRAG ? { totalMonthly: round(ragMonthly), totalIngestion: 1.50 } : null,
    summary: {
      oneTimeTrainingCost: round(customerPrice),
      estimatedMonthlyCost: 0,
      perRequestCost: round(perRequestCost),
      per1KRequests: round(perRequestCost * 1000),
    },
    costRange: {
      trainingMin: round(customerPrice * 0.85),
      trainingMax: round(customerPrice * 1.20),
      monthlyMin: 0,
      monthlyMax: 0,
    },
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
