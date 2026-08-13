import type {
  Project,
  ArchitectureOption,
  ModelOption,
  BuildLog,
  TestResult,
  DeliveryMode,
  ModelVisibility,
  TrainingDataType,
} from '../types';

export const DEMO_PROJECTS: Project[] = [
  {
    id: 'credit-risk-ai',
    name: 'Credit Risk AI',
    description: 'AI system that predicts loan default probability from applicant and financial information.',
    objective: 'I want an AI that analyzes loan applications and predicts whether an applicant is likely to default. It should return a risk score and explain the key factors.',
    inputFormats: ['tables'],
    outputFormats: ['score', 'prediction'],
    constraints: 'The model should prioritize reducing false negatives and return a confidence score with each prediction.',
    deliveryMode: 'api',
    modelVisibility: 'private',
    trainingDataTypes: ['structured'],
    requirementProfile: null,
    clarifyingQuestions: [],
    aiRecommendation: null,
    recommendedApproach: 'fine-tuning',
    selectedApproach: 'fine-tuning',
    recommendedModel: 'qwen',
    selectedModel: 'qwen',
    dataset: {
      name: 'loan_applications_2023.csv',
      size: 8_430_000,
      type: 'CSV',
      uploadedAt: '2024-01-10T14:30:00Z',
    },
    datasetAnalysis: {
      rows: 82431,
      columns: 27,
      missingValues: 8.4,
      duplicates: 2.1,
      dataTypes: 'Mixed',
      targetBalance: 'Imbalanced',
      fileSize: '8.4 MB',
      readinessScore: 72,
      readinessBreakdown: {
        coverage: 82,
        completeness: 71,
        balance: 63,
        consistency: 91,
        volume: 78,
      },
      recommendations: [
        {
          id: 'rec-1',
          severity: 'high',
          title: 'Class imbalance detected',
          description: 'The target class (default) represents only 12% of your dataset. We recommend adding 15,000–25,000 additional examples for the minority class.',
          potentialImpact: ['Recall ↓', 'Rare-case performance ↓', 'False negatives ↑', 'Generalization ↓'],
        },
        {
          id: 'rec-2',
          severity: 'medium',
          title: 'Missing values in key columns',
          description: '8.4% missing values detected, concentrated in credit_history and employment_duration columns. Consider imputation or collection.',
          potentialImpact: ['Feature coverage ↓', 'Model accuracy ↓'],
        },
        {
          id: 'rec-3',
          severity: 'low',
          title: 'Duplicate records',
          description: '2.1% duplicate rows detected. These will be removed before training.',
          potentialImpact: ['Training efficiency ↓'],
        },
      ],
    },
    buildPlan: {
      estimatedMinutes: 120,
      estimatedCostMin: 18,
      estimatedCostMax: 27,
      stages: [
        { id: 'prepare', label: 'Preparing dataset', status: 'completed' },
        { id: 'validate', label: 'Validating schema', status: 'completed' },
        { id: 'split', label: 'Creating training split', status: 'completed' },
        { id: 'configure', label: 'Selecting configuration', status: 'completed' },
        { id: 'train', label: 'Training model', status: 'completed' },
        { id: 'evaluate', label: 'Running evaluation', status: 'completed' },
        { id: 'optimize', label: 'Optimizing', status: 'completed' },
        { id: 'deploy-prep', label: 'Preparing deployment', status: 'completed' },
      ],
    },
    buildStatus: {
      status: 'completed',
      progress: 100,
      currentStage: 'Completed',
      logs: [],
      metrics: {
        trainingLoss: 0.22,
        validationLoss: 0.31,
        accuracy: 91.4,
        f1Score: 0.88,
        epoch: 10,
        totalEpochs: 10,
      },
      startedAt: '2024-01-10T16:00:00Z',
      completedAt: '2024-01-10T18:02:00Z',
    },
    modelHealth: {
      score: 86,
      accuracy: 91.4,
      precision: 89.2,
      recall: 87.6,
      f1Score: 88.4,
      latencyMs: 142,
      modelSizeGb: 4.8,
      interpretation: 'The model performs well on common cases but shows weaker performance on low-frequency applications. High-income applicants and standard employment types are predicted with high confidence.',
      recommendation: 'Add more examples from the minority class and evaluate performance specifically on rare-case loan profiles. Consider targeted data collection for self-employed applicants.',
      classPerformance: [
        { label: 'Low Risk', precision: 94.1, recall: 93.2, f1: 93.6, support: 12840 },
        { label: 'Medium Risk', precision: 87.4, recall: 85.9, f1: 86.6, support: 4210 },
        { label: 'High Risk', precision: 82.3, recall: 79.8, f1: 81.0, support: 1950 },
      ],
      evaluationHistory: [
        { version: 'v1.0', date: '2024-01-08', accuracy: 83.4, f1: 0.82 },
        { version: 'v1.1', date: '2024-01-09', accuracy: 87.2, f1: 0.85 },
        { version: 'v1.2', date: '2024-01-10', accuracy: 91.4, f1: 0.88 },
      ],
    },
    versions: [
      {
        id: 'v1.2',
        version: 'v1.2',
        status: 'production',
        accuracy: 91.4,
        f1Score: 0.884,
        datasetSize: 82431,
        createdAt: '2024-01-10T18:02:00Z',
        notes: 'Added augmented minority class samples. Improved recall on high-risk cases.',
      },
      {
        id: 'v1.1',
        version: 'v1.1',
        status: 'archived',
        accuracy: 87.2,
        f1Score: 0.851,
        datasetSize: 70000,
        createdAt: '2024-01-09T12:30:00Z',
        notes: 'Improved dataset balance with SMOTE. Better F1 across all classes.',
      },
      {
        id: 'v1.0',
        version: 'v1.0',
        status: 'archived',
        accuracy: 83.4,
        f1Score: 0.817,
        datasetSize: 50000,
        createdAt: '2024-01-08T09:00:00Z',
        notes: 'Initial baseline model.',
      },
    ],
    deployment: {
      status: 'production',
      endpoint: 'https://api.deeployment.ai/v1/models/credit-risk/predict',
      latencyMs: 142,
      requestsToday: 2841,
      errorRate: 0.8,
      deployedAt: '2024-01-10T20:00:00Z',
      region: 'us-east-1',
    },
    testCases: [
      {
        id: 'tc-1',
        name: 'Standard salaried applicant',
        type: 'normal',
        input: { age: 42, income: 75000, loan_amount: 800000, employment: 'Salaried', credit_score: 740 },
        result: {
          prediction: 'LOW RISK',
          probability: 0.184,
          confidence: 'high',
          explanation: [
            { factor: 'Income stability', impact: 'positive', magnitude: 'high' },
            { factor: 'Loan / income ratio', impact: 'positive', magnitude: 'medium' },
            { factor: 'Credit history', impact: 'positive', magnitude: 'high' },
            { factor: 'Existing debt', impact: 'negative', magnitude: 'low' },
          ],
          latencyMs: 138,
        },
        createdAt: '2024-01-11T09:00:00Z',
      },
    ],
    status: 'production',
    generatedSystemPrompt: `You are Credit Risk AI, an expert credit risk assessment system trained on loan application data.

Your role: Analyze loan application data and predict the probability of default with high accuracy and explainability.

Input format: JSON object with applicant fields such as age, income, loan_amount, employment, credit_score, existing_debt, etc.

Output format — return ONLY this JSON structure, no other text:
{
  "prediction": "LOW RISK" | "MEDIUM RISK" | "HIGH RISK",
  "probability": <float 0.0-1.0 representing default probability>,
  "confidence": "high" | "medium" | "low",
  "explanation": [
    { "factor": "<factor name>", "impact": "positive" | "negative" | "neutral", "magnitude": "high" | "medium" | "low" }
  ]
}

Domain guidelines:
- Debt-to-income ratio > 40%: strong negative signal
- Credit score < 600: high risk indicator; 600-699: medium risk; 700+: lower risk
- Self-employed or unemployed: higher variance, reduce confidence
- Loan-to-income ratio > 10x: significant risk factor
- Existing debt significantly increases risk
- Salaried employment with stable tenure: positive signal
- CRITICAL: Prioritize minimizing false negatives (missed defaults). When uncertain, lean toward higher risk classification.
- Always include at least 3 explanation factors covering income, credit, and loan characteristics.`,
    suggestedTestFields: [
      { key: 'income', label: 'Annual Income', placeholder: '75000', defaultValue: '75000' },
      { key: 'loan_amount', label: 'Loan Amount', placeholder: '800000', defaultValue: '800000' },
      { key: 'credit_score', label: 'Credit Score', placeholder: '740', defaultValue: '740' },
      { key: 'employment', label: 'Employment Type', placeholder: 'Salaried', defaultValue: 'Salaried' },
      { key: 'existing_debt', label: 'Existing Debt', placeholder: '50000', defaultValue: '50000' },
      { key: 'age', label: 'Age', placeholder: '42', defaultValue: '42' },
    ],
    createdAt: '2024-01-08T09:00:00Z',
    updatedAt: '2024-01-10T20:00:00Z',
  },
  {
    id: 'customer-support-ai',
    name: 'Customer Support AI',
    description: 'AI that handles customer inquiries, routes tickets, and suggests resolutions using company knowledge base.',
    objective: 'I want an AI that answers customer support questions based on our product documentation and past ticket resolutions.',
    inputFormats: ['text', 'documents'],
    outputFormats: ['text', 'recommendation'],
    constraints: 'Must cite sources. Should escalate when confidence is below 80%.',
    deliveryMode: 'chat',
    modelVisibility: 'private',
    trainingDataTypes: ['text', 'documents'],
    requirementProfile: null,
    clarifyingQuestions: [],
    aiRecommendation: null,
    recommendedApproach: 'rag',
    selectedApproach: 'rag',
    recommendedModel: 'llama',
    selectedModel: 'llama',
    dataset: {
      name: 'support_kb_v2.jsonl',
      size: 12_600_000,
      type: 'JSONL',
      uploadedAt: '2024-01-12T10:00:00Z',
    },
    datasetAnalysis: null,
    buildPlan: {
      estimatedMinutes: 45,
      estimatedCostMin: 8,
      estimatedCostMax: 14,
      stages: [
        { id: 'prepare', label: 'Preparing dataset', status: 'completed' },
        { id: 'validate', label: 'Validating schema', status: 'completed' },
        { id: 'split', label: 'Creating training split', status: 'completed' },
        { id: 'configure', label: 'Selecting configuration', status: 'completed' },
        { id: 'train', label: 'Training model', status: 'running', progress: 68 },
        { id: 'evaluate', label: 'Running evaluation', status: 'pending' },
        { id: 'optimize', label: 'Optimizing', status: 'pending' },
        { id: 'deploy-prep', label: 'Preparing deployment', status: 'pending' },
      ],
    },
    buildStatus: {
      status: 'running',
      progress: 68,
      currentStage: 'Training model',
      logs: [],
      metrics: {
        trainingLoss: 0.38,
        validationLoss: 0.44,
        accuracy: 84.7,
        f1Score: 0.81,
        epoch: 7,
        totalEpochs: 10,
      },
      startedAt: '2024-01-12T14:00:00Z',
      completedAt: null,
    },
    modelHealth: null,
    versions: [],
    deployment: null,
    testCases: [],
    status: 'training',
    generatedSystemPrompt: null,
    suggestedTestFields: null,
    createdAt: '2024-01-12T09:00:00Z',
    updatedAt: '2024-01-12T14:30:00Z',
  },
  {
    id: 'student-risk-ai',
    name: 'Student Risk Predictor',
    description: 'AI that identifies at-risk students early using academic, attendance, and behavioral data.',
    objective: 'I want an AI that can identify students who are likely to drop out or underperform before it happens, so advisors can intervene early.',
    inputFormats: ['tables'],
    outputFormats: ['prediction', 'score'],
    constraints: 'Must be explainable. Cannot use protected attributes directly.',
    deliveryMode: 'api',
    modelVisibility: 'public',
    trainingDataTypes: ['structured'],
    requirementProfile: null,
    clarifyingQuestions: [],
    aiRecommendation: null,
    recommendedApproach: 'slm',
    selectedApproach: null,
    recommendedModel: 'gemma',
    selectedModel: null,
    dataset: null,
    datasetAnalysis: null,
    buildPlan: null,
    buildStatus: null,
    modelHealth: null,
    versions: [],
    deployment: null,
    testCases: [],
    status: 'draft',
    generatedSystemPrompt: null,
    suggestedTestFields: null,
    createdAt: '2024-01-14T10:00:00Z',
    updatedAt: '2024-01-14T10:00:00Z',
  },
];

export const ARCHITECTURE_OPTIONS: ArchitectureOption[] = [
  {
    id: 'prompting',
    name: 'Prompting',
    fitScore: 48,
    recommended: false,
    description: 'Use a general-purpose model with carefully crafted prompts to guide behavior.',
    bestFor: ['Simple tasks', 'Rapid prototyping', 'Low setup complexity'],
    advantages: ['Zero training required', 'Fastest to deploy', 'Easy to iterate'],
    limitations: ['Inconsistent outputs', 'Not domain-specialized', 'Higher inference cost at scale'],
  },
  {
    id: 'rag',
    name: 'RAG',
    fitScore: 71,
    recommended: false,
    description: 'Retrieve relevant context from your knowledge base and use it to generate grounded responses.',
    bestFor: ['Knowledge retrieval', 'Frequently changing information', 'Document-based systems'],
    advantages: ['Always uses latest data', 'Explainable sources', 'No retraining needed for new data'],
    limitations: ['Retrieval quality matters', 'Latency from retrieval step', 'Complex infra setup'],
  },
  {
    id: 'fine-tuning',
    name: 'Fine-tuning',
    fitScore: 87,
    recommended: true,
    description: 'Train a foundation model on your labeled data to specialize its behavior for your exact task.',
    bestFor: ['Specialized behavior', 'Consistent structured outputs', 'Domain-specific tasks'],
    advantages: ['Highest task accuracy', 'Consistent outputs', 'Smaller model needed at inference'],
    limitations: ['Requires labeled data', 'Longer setup time', 'Retraining on data changes'],
  },
  {
    id: 'slm',
    name: 'Small Language Model',
    fitScore: 82,
    recommended: false,
    description: 'Train or run a compact model optimized for your specific task, for low-latency and private deployments.',
    bestFor: ['Low latency requirements', 'Lower inference cost', 'Edge or private deployments'],
    advantages: ['Fast inference', 'Low cost per request', 'Can run fully on-premise'],
    limitations: ['Lower capability ceiling', 'More limited task range', 'May need more training data'],
  },
];

export const MODEL_OPTIONS: ModelOption[] = [
  // ── Local/Open-weight models (for Fine-tuning & SLM) ──────
  {
    id: 'llama',
    name: 'Llama 3.1',
    provider: 'Meta',
    fitScore: 91,
    recommended: false,
    description: 'Open-weight model with strong general capabilities. Excellent for fine-tuning domain-specific tasks.',
    capabilities: ['Open weights', 'Strong reasoning', 'Fine-tuning friendly', 'Community ecosystem'],
    costIndicator: 'low',
    speedIndicator: 'medium',
    deploymentComplexity: 'simple',
    useCases: ['Classification', 'Domain adaptation', 'Instruction following'],
    parameters: '8B / 70B',
  },
  {
    id: 'gemma',
    name: 'Gemma 2',
    provider: 'Google',
    fitScore: 88,
    recommended: false,
    description: 'Lightweight Google model optimized for on-device, edge, and resource-constrained deployments.',
    capabilities: ['Lightweight', 'On-device', 'Instruction-tuned', 'Fast inference'],
    costIndicator: 'low',
    speedIndicator: 'fast',
    deploymentComplexity: 'simple',
    useCases: ['Edge deployment', 'Resource-constrained', 'Simple classification', 'Mobile'],
    parameters: '2B / 9B / 27B',
  },
  {
    id: 'qwen',
    name: 'Qwen 2.5',
    provider: 'Alibaba',
    fitScore: 90,
    recommended: true,
    description: 'Strong multilingual model with excellent fine-tuning characteristics and structured output quality.',
    capabilities: ['Strong task adaptation', 'Structured output', 'Multilingual', 'Efficient fine-tuning'],
    costIndicator: 'low',
    speedIndicator: 'fast',
    deploymentComplexity: 'simple',
    useCases: ['Classification', 'Structured prediction', 'Domain adaptation'],
    parameters: '4B / 7B / 14B / 72B',
  },
  {
    id: 'mistral',
    name: 'Mistral',
    provider: 'Mistral AI',
    fitScore: 85,
    recommended: false,
    description: 'Efficient model with strong code and structured output capabilities. Great for fine-tuning.',
    capabilities: ['Efficient architecture', 'Code generation', 'Structured output', 'Low VRAM'],
    costIndicator: 'low',
    speedIndicator: 'fast',
    deploymentComplexity: 'simple',
    useCases: ['Code tasks', 'Structured extraction', 'Text generation'],
    parameters: '7B / 8x7B',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    fitScore: 82,
    recommended: false,
    description: 'High-performance model with strong reasoning and code capabilities at competitive cost.',
    capabilities: ['Strong reasoning', 'Code tasks', 'Math', 'Long context'],
    costIndicator: 'low',
    speedIndicator: 'medium',
    deploymentComplexity: 'moderate',
    useCases: ['Complex reasoning', 'Technical tasks', 'Long-context analysis'],
    parameters: '7B / 16B / 67B',
  },
  // ── API-based models (for RAG & Prompting) ─────────────────
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    fitScore: 94,
    recommended: false,
    description: 'Most capable API model. Best for complex reasoning, RAG pipelines, and prompt engineering workflows.',
    capabilities: ['Top-tier reasoning', 'Function calling', 'Vision', 'JSON mode', 'Large context (128K)'],
    costIndicator: 'high',
    speedIndicator: 'fast',
    deploymentComplexity: 'simple',
    useCases: ['RAG pipelines', 'Complex prompting', 'Multi-step reasoning', 'Document understanding'],
    parameters: 'API',
  },
  {
    id: 'claude',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    fitScore: 92,
    recommended: false,
    description: 'Excellent for long-context retrieval, careful reasoning, and nuanced text generation via API.',
    capabilities: ['Long context (200K)', 'Careful reasoning', 'Strong writing', 'Low hallucination'],
    costIndicator: 'high',
    speedIndicator: 'fast',
    deploymentComplexity: 'simple',
    useCases: ['RAG with long docs', 'Summarization', 'Complex prompting', 'Content generation'],
    parameters: 'API',
  },
  {
    id: 'gemini',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    fitScore: 89,
    recommended: false,
    description: 'Google\'s multimodal API model with massive context window, ideal for RAG and document-heavy prompting.',
    capabilities: ['Multimodal', 'Massive context (1M)', 'Grounding', 'Strong retrieval'],
    costIndicator: 'medium',
    speedIndicator: 'fast',
    deploymentComplexity: 'simple',
    useCases: ['Document RAG', 'Multimodal prompting', 'Large context retrieval', 'Search grounding'],
    parameters: 'API',
  },
  {
    id: 'gpt',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    fitScore: 80,
    recommended: false,
    description: 'Cost-effective API model for simpler prompting and RAG tasks. Great balance of speed and quality.',
    capabilities: ['Fast inference', 'Function calling', 'JSON mode', 'Cost-effective'],
    costIndicator: 'low',
    speedIndicator: 'fast',
    deploymentComplexity: 'simple',
    useCases: ['Simple RAG', 'Basic prompting', 'High-volume API tasks', 'Chatbots'],
    parameters: 'API',
  },
];

export function generateBuildLogs(): BuildLog[] {
  const now = new Date();
  const logs: BuildLog[] = [];
  const entries = [
    { offset: 0, msg: 'Dataset validation complete', level: 'success' },
    { offset: 5, msg: 'Training configuration selected: lr=2e-4, epochs=10, batch=32', level: 'info' },
    { offset: 31, msg: 'Training epoch 1/10 — loss: 0.84', level: 'info' },
    { offset: 62, msg: 'Training epoch 2/10 — loss: 0.71', level: 'info' },
    { offset: 93, msg: 'Training epoch 3/10 — loss: 0.58', level: 'info' },
    { offset: 124, msg: 'Training epoch 4/10 — loss: 0.47', level: 'info' },
    { offset: 155, msg: 'Training epoch 5/10 — loss: 0.38', level: 'info' },
    { offset: 186, msg: 'Training epoch 6/10 — loss: 0.32', level: 'info' },
    { offset: 217, msg: 'Training epoch 7/10 — loss: 0.27', level: 'info' },
    { offset: 248, msg: 'Training epoch 8/10 — loss: 0.25', level: 'info' },
    { offset: 279, msg: 'Training epoch 9/10 — loss: 0.23', level: 'info' },
    { offset: 310, msg: 'Training epoch 10/10 — loss: 0.22', level: 'success' },
    { offset: 315, msg: 'Evaluation started', level: 'info' },
    { offset: 340, msg: 'Evaluation complete — accuracy: 91.4%, F1: 0.884', level: 'success' },
    { offset: 345, msg: 'Optimization pass 1/2', level: 'info' },
    { offset: 360, msg: 'Optimization pass 2/2 — model size reduced by 12%', level: 'success' },
    { offset: 365, msg: 'Deployment package prepared', level: 'success' },
  ] as const;

  for (const entry of entries) {
    const ts = new Date(now.getTime() - (370 - entry.offset) * 1000);
    const h = ts.getHours().toString().padStart(2, '0');
    const m = ts.getMinutes().toString().padStart(2, '0');
    const s = ts.getSeconds().toString().padStart(2, '0');
    logs.push({ timestamp: `${h}:${m}:${s}`, message: entry.msg, level: entry.level as 'info' | 'warn' | 'success' });
  }
  return logs;
}

export function mockRunTest(input: Record<string, string | number>): Promise<TestResult> {
  return new Promise((resolve) => {
    const income = Number(input.income ?? 75000);
    const loan = Number(input.loan_amount ?? 800000);
    const ratio = loan / income;
    const creditScore = Number(input.credit_score ?? 700);
    const employment = String(input.employment ?? 'salaried').toLowerCase();

    let risk = 0.2;
    if (ratio > 15) risk += 0.3;
    else if (ratio > 10) risk += 0.15;
    if (creditScore < 600) risk += 0.25;
    else if (creditScore < 700) risk += 0.1;
    if (employment.includes('self') || employment.includes('unemploy')) risk += 0.2;
    risk = Math.min(0.95, Math.max(0.05, risk + (Math.random() - 0.5) * 0.05));

    const prediction = risk < 0.3 ? 'LOW RISK' : risk < 0.6 ? 'MEDIUM RISK' : 'HIGH RISK';
    const confidence = risk < 0.25 || risk > 0.75 ? 'high' : risk < 0.4 || risk > 0.6 ? 'medium' : 'low';

    setTimeout(() => {
      resolve({
        prediction,
        probability: parseFloat(risk.toFixed(3)),
        confidence,
        explanation: [
          { factor: 'Income stability', impact: income > 50000 ? 'positive' : 'negative', magnitude: 'high' },
          { factor: 'Loan / income ratio', impact: ratio < 12 ? 'positive' : 'negative', magnitude: ratio < 8 ? 'high' : 'medium' },
          { factor: 'Credit history', impact: creditScore >= 700 ? 'positive' : 'negative', magnitude: creditScore >= 750 ? 'high' : 'medium' },
          { factor: 'Employment type', impact: employment.includes('salar') ? 'positive' : 'negative', magnitude: 'medium' },
        ],
        latencyMs: Math.floor(120 + Math.random() * 60),
      });
    }, 800 + Math.random() * 400);
  });
}

export function mockAnalyzeUseCase(objective: string): Promise<{ architectureOptions: ArchitectureOption[] }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const opts = [...ARCHITECTURE_OPTIONS];
      if (objective.toLowerCase().includes('predict') || objective.toLowerCase().includes('classify')) {
        opts.find(o => o.id === 'fine-tuning')!.fitScore = 89;
        opts.find(o => o.id === 'fine-tuning')!.recommended = true;
        opts.find(o => o.id === 'rag')!.fitScore = 55;
      } else if (objective.toLowerCase().includes('search') || objective.toLowerCase().includes('document') || objective.toLowerCase().includes('knowledge')) {
        opts.find(o => o.id === 'rag')!.fitScore = 91;
        opts.find(o => o.id === 'rag')!.recommended = true;
        opts.find(o => o.id === 'fine-tuning')!.fitScore = 72;
        opts.find(o => o.id === 'fine-tuning')!.recommended = false;
      }
      resolve({ architectureOptions: opts });
    }, 1800);
  });
}
