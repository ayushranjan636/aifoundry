export type ApproachType = 'prompting' | 'rag' | 'fine-tuning' | 'slm';
export type ModelId = 'qwen' | 'llama' | 'mistral' | 'gemma' | 'deepseek' | 'gpt';
export type ProjectStatus = 'draft' | 'training' | 'evaluating' | 'production' | 'failed';
export type InputFormat = 'text' | 'documents' | 'tables' | 'images' | 'audio' | 'video' | 'multiple';
export type OutputFormat = 'text' | 'classification' | 'score' | 'prediction' | 'recommendation' | 'json' | 'multiple';
export type DeploymentStatus = 'idle' | 'deploying' | 'production' | 'stopped';

export interface DatasetAnalysis {
  rows: number;
  columns: number;
  missingValues: number;
  duplicates: number;
  dataTypes: string;
  targetBalance: string;
  fileSize: string;
  readinessScore: number;
  readinessBreakdown: {
    coverage: number;
    completeness: number;
    balance: number;
    consistency: number;
    volume: number;
  };
  recommendations: DatasetRecommendation[];
}

export interface DatasetRecommendation {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialImpact: string[];
}

export interface ArchitectureOption {
  id: ApproachType;
  name: string;
  fitScore: number;
  recommended: boolean;
  description: string;
  bestFor: string[];
  advantages: string[];
  limitations: string[];
}

export interface ModelOption {
  id: ModelId;
  name: string;
  provider: string;
  fitScore: number;
  recommended: boolean;
  description: string;
  capabilities: string[];
  costIndicator: 'low' | 'medium' | 'high';
  speedIndicator: 'fast' | 'medium' | 'slow';
  deploymentComplexity: 'simple' | 'moderate' | 'complex';
  useCases: string[];
  parameters: string;
}

export interface BuildStage {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
}

export interface BuildLog {
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'success';
}

export interface BuildMetrics {
  trainingLoss: number;
  validationLoss: number;
  accuracy: number;
  f1Score: number;
  epoch: number;
  totalEpochs: number;
}

export interface ModelHealth {
  score: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  latencyMs: number;
  modelSizeGb: number;
  interpretation: string;
  recommendation: string;
  classPerformance: ClassPerformance[];
  evaluationHistory: EvalPoint[];
}

export interface ClassPerformance {
  label: string;
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface EvalPoint {
  version: string;
  date: string;
  accuracy: number;
  f1: number;
}

export interface ModelVersion {
  id: string;
  version: string;
  status: 'production' | 'archived' | 'training';
  accuracy: number;
  f1Score: number;
  datasetSize: number;
  createdAt: string;
  notes: string;
}

export interface Deployment {
  status: DeploymentStatus;
  endpoint: string;
  latencyMs: number;
  requestsToday: number;
  errorRate: number;
  deployedAt: string;
  region: string;
}

export interface TestCase {
  id: string;
  name: string;
  type: 'normal' | 'edge' | 'adversarial' | 'custom';
  input: Record<string, string | number>;
  result?: TestResult;
  createdAt: string;
}

export interface TestResult {
  prediction: string;
  probability: number;
  confidence: 'high' | 'medium' | 'low';
  explanation: ExplanationFactor[];
  latencyMs: number;
}

export interface ExplanationFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  magnitude: 'high' | 'medium' | 'low';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  objective: string;
  inputFormats: InputFormat[];
  outputFormats: OutputFormat[];
  constraints: string;
  recommendedApproach: ApproachType | null;
  selectedApproach: ApproachType | null;
  recommendedModel: ModelId | null;
  selectedModel: ModelId | null;
  dataset: DatasetInfo | null;
  datasetAnalysis: DatasetAnalysis | null;
  buildPlan: BuildPlan | null;
  buildStatus: BuildStatus | null;
  modelHealth: ModelHealth | null;
  versions: ModelVersion[];
  deployment: Deployment | null;
  testCases: TestCase[];
  status: ProjectStatus;
  generatedSystemPrompt: string | null;
  // Suggested test input fields — generated at build time based on domain
  suggestedTestFields: Array<{ key: string; label: string; placeholder: string; defaultValue: string }> | null;
  createdAt: string;
  updatedAt: string;
}

export interface DatasetInfo {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface BuildPlan {
  estimatedMinutes: number;
  estimatedCostMin: number;
  estimatedCostMax: number;
  stages: BuildStage[];
}

export interface BuildStatus {
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: number;
  currentStage: string;
  logs: BuildLog[];
  metrics: BuildMetrics | null;
  startedAt: string | null;
  completedAt: string | null;
}
