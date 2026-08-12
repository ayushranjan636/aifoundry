// ─────────────────────────────────────────────────────────────────────────────
// Benchmark & Model Evaluation System — Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export type TaskType =
  | 'classification'
  | 'binary_classification'
  | 'information_extraction'
  | 'rag'
  | 'text_generation'
  | 'summarization'
  | 'question_answering'
  | 'fine_tuning';

export type BenchmarkStatus = 'pending' | 'running' | 'completed' | 'failed';
export type DataSplitType = 'training' | 'validation' | 'test' | 'golden';
export type FitDiagnosis = 'underfitting' | 'good_fit' | 'overfitting' | 'unstable';
export type UserPriorityProfile = 'accuracy_focused' | 'cost_focused' | 'balanced' | 'latency_focused' | 'custom';

// ─── Layer 1: Training Metrics ───────────────────────────────────────────────

export interface TrainingMetrics {
  trainingLoss: number[];
  validationLoss: number[];
  trainingAccuracy?: number[];
  validationAccuracy?: number[];
  learningRate: number[];
  epochs: number;
  steps: number;
  fitDiagnosis: FitDiagnosis;
  overfittingDetected: boolean;
  overfittingEpoch?: number;
  convergenceEpoch?: number;
}

// ─── Layer 2: Data Split Info ────────────────────────────────────────────────

export interface DataSplit {
  type: DataSplitType;
  count: number;
  percentage: number;
}

export interface DataSplitConfig {
  splits: DataSplit[];
  leakageDetected: boolean;
  leakageDetails?: string[];
}

// ─── Layer 3: Data Quality ───────────────────────────────────────────────────

export interface DataQualityReport {
  totalRecords: number;
  validRecords: number;
  validPercentage: number;
  missingValues: number;
  missingPercentage: number;
  duplicateRecords: number;
  duplicatePercentage: number;
  invalidRecords: number;
  invalidPercentage: number;
  classDistribution: Record<string, number>;
  labelBalance: 'good' | 'moderate' | 'poor';
  outlierCount: number;
  conflictingExamples: number;
  dataLeakageRisks: string[];
  overallQuality: 'high' | 'medium' | 'low';
  warnings: DataQualityWarning[];
}

export interface DataQualityWarning {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  category: string;
  affectedRecords?: number;
}

// ─── Layer 4: Task-Specific Metrics ─────────────────────────────────────────

export interface ClassificationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  macroF1: number;
  weightedF1: number;
  confusionMatrix: number[][];
  classLabels: string[];
  perClassMetrics: PerClassMetric[];
}

export interface PerClassMetric {
  label: string;
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface BinaryClassificationMetrics extends ClassificationMetrics {
  rocAuc?: number;
  prAuc?: number;
  threshold: number;
  thresholdOptimizable: boolean;
}

export interface ExtractionMetrics {
  fields: ExtractionFieldMetric[];
  overallExactMatch: number;
  overallExtractionSuccess: number;
}

export interface ExtractionFieldMetric {
  fieldName: string;
  precision: number;
  recall: number;
  f1: number;
  exactMatch: number;
}

export interface RAGMetrics {
  retrieval: {
    recallAtK: number;
    precisionAtK: number;
    hitRate: number;
    retrievalRelevance: number;
    k: number;
  };
  generation: {
    answerCorrectness: number;
    faithfulness: number;
    contextRelevance: number;
    citationCorrectness?: number;
    hallucinationRate: number;
  };
}

export interface GenerationMetrics {
  factuality?: number;
  relevance?: number;
  instructionFollowing?: number;
  formatCorrectness?: number;
  humanEvaluation?: number;
  llmJudgeScore?: number;
  llmJudgeModel?: string;
}

export interface SummarizationMetrics {
  factuality: number;
  informationCoverage: number;
  relevance: number;
  conciseness: number;
  hallucinationRate: number;
  qualityScore: number;
}

// ─── Union of all task-specific metrics ──────────────────────────────────────

export type TaskMetrics =
  | { taskType: 'classification'; metrics: ClassificationMetrics }
  | { taskType: 'binary_classification'; metrics: BinaryClassificationMetrics }
  | { taskType: 'information_extraction'; metrics: ExtractionMetrics }
  | { taskType: 'rag'; metrics: RAGMetrics }
  | { taskType: 'text_generation'; metrics: GenerationMetrics }
  | { taskType: 'summarization'; metrics: SummarizationMetrics }
  | { taskType: 'question_answering'; metrics: RAGMetrics }
  | { taskType: 'fine_tuning'; metrics: ClassificationMetrics };

// ─── Baseline & Model Comparison ─────────────────────────────────────────────

export interface ModelCandidate {
  id: string;
  name: string;
  description: string;
  quality: number;
  costPer1000: number;
  latencyMs: number;
  contextWindow?: number;
  deploymentRequirements?: string;
  isRecommended: boolean;
  isParetoEfficient: boolean;
}

export interface BaselineComparison {
  baselineQuality: number;
  optimizedQuality: number;
  qualityImprovement: number;
  baselineLatencyMs: number;
  optimizedLatencyMs: number;
  latencyImprovement: number;
  baselineCostPer1000: number;
  optimizedCostPer1000: number;
  costReduction: number;
  baselineDescription: string;
  optimizedDescription: string;
}

export interface AlternativeModelBenchmark {
  candidates: ModelCandidate[];
  paretoFrontier: ModelCandidate[];
  recommended: ModelCandidate;
  reasoning: string;
}

// ─── Quality-Cost-Speed Composite Score ──────────────────────────────────────

export interface CompositeWeights {
  quality: number;
  cost: number;
  latency: number;
  reliability: number;
}

export interface CompositeScore {
  overall: number;
  qualityScore: number;
  costEfficiencyScore: number;
  latencyScore: number;
  reliabilityScore: number;
  weights: CompositeWeights;
  profile: UserPriorityProfile;
}

// ─── Reliability ─────────────────────────────────────────────────────────────

export interface ReliabilityMetrics {
  failureRate: number;
  invalidOutputRate: number;
  formatCompliance: number;
  hallucinationRate?: number;
  timeoutRate: number;
  errorRate: number;
  perClassFailureRate: Record<string, number>;
  worstPerformingCategories: string[];
}

// ─── Confidence & Calibration ────────────────────────────────────────────────

export interface CalibrationMetrics {
  expectedCalibrationError: number;
  highConfidenceErrorRate: number;
  calibrationBins: CalibrationBin[];
  isWellCalibrated: boolean;
}

export interface CalibrationBin {
  confidenceRange: [number, number];
  predictedProbability: number;
  actualAccuracy: number;
  count: number;
}

// ─── Data Slice Evaluation ───────────────────────────────────────────────────

export interface DataSlice {
  sliceName: string;
  sliceType: string;
  count: number;
  quality: number;
  f1?: number;
  accuracy?: number;
  failureRate?: number;
  isUnderperforming: boolean;
}

// ─── Regression Testing ──────────────────────────────────────────────────────

export interface RegressionTestResult {
  previousVersion: string;
  currentVersion: string;
  previousMetrics: { quality: number; f1?: number; accuracy?: number };
  currentMetrics: { quality: number; f1?: number; accuracy?: number };
  regressionDetected: boolean;
  regressionDetails?: string;
  metricDelta: number;
}

// ─── Recommendation Engine Benchmark ─────────────────────────────────────────

export interface RecommendationBenchmark {
  successRate: number;
  qualityRegret: number;
  costRegret: number;
  latencyRegret: number;
  totalTasks: number;
  tasksEvaluated: number;
}

// ─── User-Facing Summary ─────────────────────────────────────────────────────

export interface UserFacingBenchmark {
  quality: { label: string; value: number; display: string };
  speed: { label: string; category: 'very_fast' | 'fast' | 'moderate' | 'slow'; latencyMs: number };
  cost: { label: string; category: 'very_low' | 'low' | 'moderate' | 'high'; costPer1000: number };
  reliability: { label: string; category: 'very_high' | 'high' | 'moderate' | 'low'; value: number };
  improvement?: {
    qualityDelta: string;
    speedDelta: string;
    costDelta: string;
  };
}

// ─── Full Benchmark Report ───────────────────────────────────────────────────

export interface BenchmarkReport {
  id: string;
  projectId: string;
  modelVersion: string;
  datasetVersion: string;
  evaluationVersion: string;
  trainingRunId?: string;
  createdAt: string;
  status: BenchmarkStatus;

  taskType: TaskType;
  taskMetrics: TaskMetrics;

  training?: TrainingMetrics;
  dataQuality: DataQualityReport;
  dataSplit: DataSplitConfig;
  reliability: ReliabilityMetrics;
  calibration?: CalibrationMetrics;
  dataSlices: DataSlice[];

  baseline?: BaselineComparison;
  alternatives?: AlternativeModelBenchmark;
  compositeScore: CompositeScore;

  regressionTest?: RegressionTestResult;
  goldenTestSetResults?: {
    quality: number;
    f1?: number;
    accuracy?: number;
    evaluatedAt: string;
  };

  userFacing: UserFacingBenchmark;

  knownWeaknesses: string[];
  recommendations: string[];
}

// ─── Backend API response shape ──────────────────────────────────────────────

export interface BenchmarkAPIResponse {
  quality: {
    primaryMetric: string;
    value: number;
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1?: number;
    macroF1?: number;
  };
  performance: {
    latencyMs: number;
    estimatedCostPer1000: number;
  };
  reliability: {
    failureRate: number;
    formatCompliance: number;
    hallucinationRate?: number;
  };
  comparison?: {
    baselineQuality: number;
    qualityImprovement: number;
    latencyImprovement: number;
    costReduction: number;
  };
  training?: {
    trainingLoss: number;
    validationLoss: number;
    epochs: number;
    overfittingDetected: boolean;
  };
}
