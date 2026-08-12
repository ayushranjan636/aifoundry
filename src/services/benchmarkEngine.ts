import type {
  TaskType,
  TrainingMetrics,
  FitDiagnosis,
  DataSplitConfig,
  ClassificationMetrics,
  BinaryClassificationMetrics,
  ExtractionMetrics,
  RAGMetrics,
  GenerationMetrics,
  SummarizationMetrics,
  BaselineComparison,
  ModelCandidate,
  AlternativeModelBenchmark,
  CompositeScore,
  CompositeWeights,
  UserPriorityProfile,
  ReliabilityMetrics,
  CalibrationMetrics,
  CalibrationBin,
  DataSlice,
  RegressionTestResult,
  UserFacingBenchmark,
  BenchmarkReport,
  BenchmarkAPIResponse,
} from '../types/benchmark';

// ─────────────────────────────────────────────────────────────────────────────
// Training Metrics Analysis
// ─────────────────────────────────────────────────────────────────────────────

export function diagnoseFit(
  trainingLoss: number[],
  validationLoss: number[]
): { diagnosis: FitDiagnosis; overfittingEpoch?: number; convergenceEpoch?: number } {
  if (trainingLoss.length < 2) {
    return { diagnosis: 'underfitting' };
  }

  const lastTrainLoss = trainingLoss[trainingLoss.length - 1];
  const lastValLoss = validationLoss[validationLoss.length - 1];
  const minValLoss = Math.min(...validationLoss);
  const minValEpoch = validationLoss.indexOf(minValLoss);

  const lossVariance = validationLoss
    .slice(-5)
    .reduce((sum, v, _, arr) => {
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      return sum + (v - mean) ** 2;
    }, 0) / Math.min(5, validationLoss.length);

  if (lossVariance > 0.1) {
    return { diagnosis: 'unstable' };
  }

  if (lastTrainLoss > 0.5 && lastValLoss > 0.5) {
    return { diagnosis: 'underfitting' };
  }

  const divergenceThreshold = 0.05;
  if (lastValLoss - minValLoss > divergenceThreshold && lastTrainLoss < minValLoss) {
    return { diagnosis: 'overfitting', overfittingEpoch: minValEpoch + 1 };
  }

  const convergenceThreshold = 0.01;
  let convergenceEpoch: number | undefined;
  for (let i = 1; i < validationLoss.length; i++) {
    if (Math.abs(validationLoss[i] - validationLoss[i - 1]) < convergenceThreshold) {
      convergenceEpoch = i + 1;
      break;
    }
  }

  return { diagnosis: 'good_fit', convergenceEpoch };
}

export function analyzeTrainingMetrics(
  trainingLoss: number[],
  validationLoss: number[],
  trainingAccuracy?: number[],
  validationAccuracy?: number[],
  learningRate?: number[]
): TrainingMetrics {
  const { diagnosis, overfittingEpoch, convergenceEpoch } = diagnoseFit(trainingLoss, validationLoss);

  return {
    trainingLoss,
    validationLoss,
    trainingAccuracy,
    validationAccuracy,
    learningRate: learningRate || [],
    epochs: trainingLoss.length,
    steps: trainingLoss.length * 100,
    fitDiagnosis: diagnosis,
    overfittingDetected: diagnosis === 'overfitting',
    overfittingEpoch,
    convergenceEpoch,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Data Split Validation
// ─────────────────────────────────────────────────────────────────────────────

export function validateDataSplit(
  totalRecords: number,
  trainCount: number,
  valCount: number,
  testCount: number,
  goldenCount?: number
): DataSplitConfig {
  const splits = [
    { type: 'training' as const, count: trainCount, percentage: (trainCount / totalRecords) * 100 },
    { type: 'validation' as const, count: valCount, percentage: (valCount / totalRecords) * 100 },
    { type: 'test' as const, count: testCount, percentage: (testCount / totalRecords) * 100 },
  ];

  if (goldenCount) {
    splits.push({ type: 'golden' as const, count: goldenCount, percentage: (goldenCount / totalRecords) * 100 });
  }

  const leakageDetails: string[] = [];
  if (trainCount + valCount + testCount + (goldenCount || 0) > totalRecords) {
    leakageDetails.push('Split counts exceed total records — possible overlap detected');
  }
  if (testCount < totalRecords * 0.1) {
    leakageDetails.push('Test set is less than 10% of data — may not be representative');
  }

  return {
    splits,
    leakageDetected: leakageDetails.length > 0,
    leakageDetails: leakageDetails.length > 0 ? leakageDetails : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Task-Specific Metric Computation
// ─────────────────────────────────────────────────────────────────────────────

export function computeClassificationMetrics(
  predictions: string[],
  labels: string[],
  classLabels: string[]
): ClassificationMetrics {
  const n = predictions.length;
  const numClasses = classLabels.length;
  const confusionMatrix: number[][] = Array.from({ length: numClasses }, () => Array(numClasses).fill(0));

  for (let i = 0; i < n; i++) {
    const predIdx = classLabels.indexOf(predictions[i]);
    const trueIdx = classLabels.indexOf(labels[i]);
    if (predIdx >= 0 && trueIdx >= 0) {
      confusionMatrix[trueIdx][predIdx]++;
    }
  }

  let correct = 0;
  for (let i = 0; i < numClasses; i++) correct += confusionMatrix[i][i];
  const accuracy = correct / n;

  const perClassMetrics = classLabels.map((label, idx) => {
    const tp = confusionMatrix[idx][idx];
    const fp = confusionMatrix.reduce((sum, row, r) => sum + (r !== idx ? row[idx] : 0), 0);
    const fn = confusionMatrix[idx].reduce((sum, val, c) => sum + (c !== idx ? val : 0), 0);
    const support = confusionMatrix[idx].reduce((a, b) => a + b, 0);

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return { label, precision, recall, f1, support };
  });

  const macroF1 = perClassMetrics.reduce((sum, m) => sum + m.f1, 0) / numClasses;
  const totalSupport = perClassMetrics.reduce((sum, m) => sum + m.support, 0);
  const weightedF1 = perClassMetrics.reduce((sum, m) => sum + m.f1 * (m.support / totalSupport), 0);

  const precision = perClassMetrics.reduce((sum, m) => sum + m.precision, 0) / numClasses;
  const recall = perClassMetrics.reduce((sum, m) => sum + m.recall, 0) / numClasses;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    accuracy,
    precision,
    recall,
    f1,
    macroF1,
    weightedF1,
    confusionMatrix,
    classLabels,
    perClassMetrics,
  };
}

export function computeBinaryClassificationMetrics(
  predictions: number[],
  labels: number[],
  threshold = 0.5
): BinaryClassificationMetrics {
  const binaryPreds = predictions.map((p) => (p >= threshold ? '1' : '0'));
  const binaryLabels = labels.map((l) => String(l));
  const base = computeClassificationMetrics(binaryPreds, binaryLabels, ['0', '1']);

  const sortedPairs = predictions
    .map((p, i) => ({ score: p, label: labels[i] }))
    .sort((a, b) => b.score - a.score);

  let rocAuc = 0;
  const positives = labels.filter((l) => l === 1).length;
  const negatives = labels.length - positives;
  if (positives > 0 && negatives > 0) {
    let tpCount = 0;
    let fpCount = 0;
    let prevTpr = 0;
    let prevFpr = 0;

    for (const pair of sortedPairs) {
      if (pair.label === 1) tpCount++;
      else fpCount++;
      const tpr = tpCount / positives;
      const fpr = fpCount / negatives;
      rocAuc += (fpr - prevFpr) * (tpr + prevTpr) / 2;
      prevTpr = tpr;
      prevFpr = fpr;
    }
  }

  return {
    ...base,
    rocAuc,
    prAuc: undefined,
    threshold,
    thresholdOptimizable: true,
  };
}

export function computeExtractionMetrics(
  predictions: Record<string, string>[],
  groundTruth: Record<string, string>[],
  fields: string[]
): ExtractionMetrics {
  const fieldMetrics = fields.map((fieldName) => {
    let tp = 0, fp = 0, fn = 0, exactMatches = 0;

    for (let i = 0; i < predictions.length; i++) {
      const pred = predictions[i][fieldName]?.trim();
      const truth = groundTruth[i][fieldName]?.trim();

      if (pred && truth) {
        if (pred === truth) { tp++; exactMatches++; }
        else { tp++; }
      } else if (pred && !truth) { fp++; }
      else if (!pred && truth) { fn++; }
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const exactMatch = predictions.length > 0 ? exactMatches / predictions.length : 0;

    return { fieldName, precision, recall, f1, exactMatch };
  });

  const overallExactMatch = fieldMetrics.reduce((sum, f) => sum + f.exactMatch, 0) / fields.length;
  const overallExtractionSuccess = fieldMetrics.reduce((sum, f) => sum + f.f1, 0) / fields.length;

  return { fields: fieldMetrics, overallExactMatch, overallExtractionSuccess };
}

// ─────────────────────────────────────────────────────────────────────────────
// Composite Score Computation
// ─────────────────────────────────────────────────────────────────────────────

const PRIORITY_WEIGHTS: Record<UserPriorityProfile, CompositeWeights> = {
  accuracy_focused: { quality: 0.50, reliability: 0.20, cost: 0.15, latency: 0.15 },
  cost_focused: { quality: 0.35, cost: 0.35, latency: 0.20, reliability: 0.10 },
  latency_focused: { quality: 0.30, latency: 0.35, cost: 0.20, reliability: 0.15 },
  balanced: { quality: 0.35, reliability: 0.25, cost: 0.20, latency: 0.20 },
  custom: { quality: 0.25, reliability: 0.25, cost: 0.25, latency: 0.25 },
};

export function computeCompositeScore(
  qualityScore: number,
  costEfficiency: number,
  latencyScore: number,
  reliabilityScore: number,
  profile: UserPriorityProfile,
  customWeights?: CompositeWeights
): CompositeScore {
  const weights = profile === 'custom' && customWeights ? customWeights : PRIORITY_WEIGHTS[profile];

  const overall =
    qualityScore * weights.quality +
    costEfficiency * weights.cost +
    latencyScore * weights.latency +
    reliabilityScore * weights.reliability;

  return {
    overall,
    qualityScore,
    costEfficiencyScore: costEfficiency,
    latencyScore,
    reliabilityScore,
    weights,
    profile,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Baseline Comparison
// ─────────────────────────────────────────────────────────────────────────────

export function computeBaselineComparison(
  baseline: { quality: number; latencyMs: number; costPer1000: number; description: string },
  optimized: { quality: number; latencyMs: number; costPer1000: number; description: string }
): BaselineComparison {
  return {
    baselineQuality: baseline.quality,
    optimizedQuality: optimized.quality,
    qualityImprovement: baseline.quality > 0 ? (optimized.quality - baseline.quality) / baseline.quality : 0,
    baselineLatencyMs: baseline.latencyMs,
    optimizedLatencyMs: optimized.latencyMs,
    latencyImprovement: baseline.latencyMs > 0 ? (baseline.latencyMs - optimized.latencyMs) / baseline.latencyMs : 0,
    baselineCostPer1000: baseline.costPer1000,
    optimizedCostPer1000: optimized.costPer1000,
    costReduction: baseline.costPer1000 > 0 ? (baseline.costPer1000 - optimized.costPer1000) / baseline.costPer1000 : 0,
    baselineDescription: baseline.description,
    optimizedDescription: optimized.description,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Pareto Frontier
// ─────────────────────────────────────────────────────────────────────────────

export function computeParetoFrontier(candidates: ModelCandidate[]): ModelCandidate[] {
  const frontier: ModelCandidate[] = [];

  for (const candidate of candidates) {
    const isDominated = candidates.some(
      (other) =>
        other.id !== candidate.id &&
        other.quality >= candidate.quality &&
        other.costPer1000 <= candidate.costPer1000 &&
        other.latencyMs <= candidate.latencyMs &&
        (other.quality > candidate.quality || other.costPer1000 < candidate.costPer1000 || other.latencyMs < candidate.latencyMs)
    );

    if (!isDominated) {
      frontier.push({ ...candidate, isParetoEfficient: true });
    }
  }

  return frontier;
}

export function selectBestCandidate(
  candidates: ModelCandidate[],
  profile: UserPriorityProfile
): ModelCandidate {
  const weights = PRIORITY_WEIGHTS[profile];
  const maxQuality = Math.max(...candidates.map((c) => c.quality));
  const maxCost = Math.max(...candidates.map((c) => c.costPer1000));
  const maxLatency = Math.max(...candidates.map((c) => c.latencyMs));

  const scored = candidates.map((c) => ({
    candidate: c,
    score:
      (c.quality / maxQuality) * weights.quality +
      (1 - c.costPer1000 / maxCost) * weights.cost +
      (1 - c.latencyMs / maxLatency) * weights.latency,
  }));

  scored.sort((a, b) => b.score - a.score);
  return { ...scored[0].candidate, isRecommended: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Reliability Analysis
// ─────────────────────────────────────────────────────────────────────────────

export function computeReliabilityMetrics(
  results: Array<{ success: boolean; validOutput: boolean; formatOk: boolean; category?: string; timedOut?: boolean }>,
): ReliabilityMetrics {
  const n = results.length;
  const failures = results.filter((r) => !r.success).length;
  const invalidOutputs = results.filter((r) => !r.validOutput).length;
  const formatFails = results.filter((r) => !r.formatOk).length;
  const timeouts = results.filter((r) => r.timedOut).length;

  const categoryFailures: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  for (const r of results) {
    const cat = r.category || 'unknown';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    if (!r.success) categoryFailures[cat] = (categoryFailures[cat] || 0) + 1;
  }

  const perClassFailureRate: Record<string, number> = {};
  for (const [cat, count] of Object.entries(categoryCounts)) {
    perClassFailureRate[cat] = (categoryFailures[cat] || 0) / count;
  }

  const worstPerformingCategories = Object.entries(perClassFailureRate)
    .filter(([, rate]) => rate > 0.1)
    .sort(([, a], [, b]) => b - a)
    .map(([cat]) => cat);

  return {
    failureRate: failures / n,
    invalidOutputRate: invalidOutputs / n,
    formatCompliance: 1 - formatFails / n,
    timeoutRate: timeouts / n,
    errorRate: failures / n,
    perClassFailureRate,
    worstPerformingCategories,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Calibration
// ─────────────────────────────────────────────────────────────────────────────

export function computeCalibrationMetrics(
  confidences: number[],
  correct: boolean[],
  numBins = 10
): CalibrationMetrics {
  const bins: CalibrationBin[] = [];
  const binSize = 1 / numBins;

  for (let i = 0; i < numBins; i++) {
    const lo = i * binSize;
    const hi = (i + 1) * binSize;
    const inBin = confidences
      .map((c, idx) => ({ c, correct: correct[idx] }))
      .filter(({ c }) => c >= lo && c < hi);

    if (inBin.length > 0) {
      const avgConf = inBin.reduce((s, { c }) => s + c, 0) / inBin.length;
      const actualAcc = inBin.filter((b) => b.correct).length / inBin.length;
      bins.push({ confidenceRange: [lo, hi], predictedProbability: avgConf, actualAccuracy: actualAcc, count: inBin.length });
    }
  }

  const ece = bins.reduce((sum, bin) => sum + (bin.count / confidences.length) * Math.abs(bin.predictedProbability - bin.actualAccuracy), 0);

  const highConfItems = confidences
    .map((c, i) => ({ c, correct: correct[i] }))
    .filter(({ c }) => c >= 0.9);
  const highConfErrorRate = highConfItems.length > 0
    ? highConfItems.filter((i) => !i.correct).length / highConfItems.length
    : 0;

  return {
    expectedCalibrationError: ece,
    highConfidenceErrorRate: highConfErrorRate,
    calibrationBins: bins,
    isWellCalibrated: ece < 0.05,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Regression Testing
// ─────────────────────────────────────────────────────────────────────────────

export function detectRegression(
  previousMetrics: { quality: number; f1?: number; accuracy?: number },
  currentMetrics: { quality: number; f1?: number; accuracy?: number },
  previousVersion: string,
  currentVersion: string,
  threshold = 0.02
): RegressionTestResult {
  const delta = currentMetrics.quality - previousMetrics.quality;
  const regressionDetected = delta < -threshold;

  return {
    previousVersion,
    currentVersion,
    previousMetrics,
    currentMetrics,
    regressionDetected,
    regressionDetails: regressionDetected
      ? `Quality decreased by ${(Math.abs(delta) * 100).toFixed(1)}% from ${previousVersion} to ${currentVersion}`
      : undefined,
    metricDelta: delta,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// User-Facing Summary Generation
// ─────────────────────────────────────────────────────────────────────────────

export function generateUserFacingSummary(
  quality: number,
  latencyMs: number,
  costPer1000: number,
  reliability: number,
  baseline?: { quality: number; latencyMs: number; costPer1000: number }
): UserFacingBenchmark {
  const speedCategory = latencyMs < 100 ? 'very_fast' : latencyMs < 300 ? 'fast' : latencyMs < 1000 ? 'moderate' : 'slow';
  const costCategory = costPer1000 < 0.5 ? 'very_low' : costPer1000 < 2 ? 'low' : costPer1000 < 10 ? 'moderate' : 'high';
  const reliabilityCategory = reliability > 0.99 ? 'very_high' : reliability > 0.95 ? 'high' : reliability > 0.9 ? 'moderate' : 'low';

  const result: UserFacingBenchmark = {
    quality: { label: 'Quality', value: quality, display: `${(quality * 100).toFixed(1)}%` },
    speed: { label: 'Speed', category: speedCategory, latencyMs },
    cost: { label: 'Cost', category: costCategory, costPer1000 },
    reliability: { label: 'Reliability', category: reliabilityCategory, value: reliability },
  };

  if (baseline) {
    const qualityDelta = baseline.quality > 0 ? ((quality - baseline.quality) / baseline.quality) * 100 : 0;
    const speedDelta = baseline.latencyMs > 0 ? ((baseline.latencyMs - latencyMs) / baseline.latencyMs) * 100 : 0;
    const costDelta = baseline.costPer1000 > 0 ? ((baseline.costPer1000 - costPer1000) / baseline.costPer1000) * 100 : 0;

    result.improvement = {
      qualityDelta: `${qualityDelta >= 0 ? '+' : ''}${qualityDelta.toFixed(1)}%`,
      speedDelta: `${speedDelta.toFixed(0)}% faster`,
      costDelta: `${costDelta.toFixed(0)}% lower`,
    };
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Format API Response
// ─────────────────────────────────────────────────────────────────────────────

export function formatBenchmarkAPIResponse(report: BenchmarkReport): BenchmarkAPIResponse {
  const taskMetrics = report.taskMetrics;
  let primaryMetric = 'quality';
  let value = 0;
  let accuracy: number | undefined;
  let precision: number | undefined;
  let recall: number | undefined;
  let f1: number | undefined;
  let macroF1: number | undefined;

  if (taskMetrics.taskType === 'classification' || taskMetrics.taskType === 'binary_classification' || taskMetrics.taskType === 'fine_tuning') {
    const m = taskMetrics.metrics;
    primaryMetric = 'f1';
    value = m.f1;
    accuracy = m.accuracy;
    precision = m.precision;
    recall = m.recall;
    f1 = m.f1;
    macroF1 = m.macroF1;
  } else if (taskMetrics.taskType === 'information_extraction') {
    primaryMetric = 'extraction_success';
    value = taskMetrics.metrics.overallExtractionSuccess;
  } else if (taskMetrics.taskType === 'rag' || taskMetrics.taskType === 'question_answering') {
    primaryMetric = 'answer_correctness';
    value = taskMetrics.metrics.generation.answerCorrectness;
  } else if (taskMetrics.taskType === 'text_generation') {
    primaryMetric = 'relevance';
    value = taskMetrics.metrics.relevance || 0;
  } else if (taskMetrics.taskType === 'summarization') {
    primaryMetric = 'quality_score';
    value = taskMetrics.metrics.qualityScore;
  }

  return {
    quality: { primaryMetric, value, accuracy, precision, recall, f1, macroF1 },
    performance: {
      latencyMs: report.userFacing.speed.latencyMs,
      estimatedCostPer1000: report.userFacing.cost.costPer1000,
    },
    reliability: {
      failureRate: report.reliability.failureRate,
      formatCompliance: report.reliability.formatCompliance,
      hallucinationRate: report.reliability.hallucinationRate,
    },
    comparison: report.baseline ? {
      baselineQuality: report.baseline.baselineQuality,
      qualityImprovement: report.baseline.qualityImprovement,
      latencyImprovement: report.baseline.latencyImprovement,
      costReduction: report.baseline.costReduction,
    } : undefined,
    training: report.training ? {
      trainingLoss: report.training.trainingLoss[report.training.trainingLoss.length - 1],
      validationLoss: report.training.validationLoss[report.training.validationLoss.length - 1],
      epochs: report.training.epochs,
      overfittingDetected: report.training.overfittingDetected,
    } : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Determine appropriate metrics for task type
// ─────────────────────────────────────────────────────────────────────────────

export function getMetricsForTaskType(taskType: TaskType): string[] {
  switch (taskType) {
    case 'classification':
      return ['accuracy', 'precision', 'recall', 'f1', 'macroF1', 'weightedF1', 'confusionMatrix', 'perClassMetrics'];
    case 'binary_classification':
      return ['accuracy', 'precision', 'recall', 'f1', 'rocAuc', 'prAuc', 'confusionMatrix', 'threshold'];
    case 'information_extraction':
      return ['fieldPrecision', 'fieldRecall', 'fieldF1', 'exactMatch', 'extractionSuccess'];
    case 'rag':
    case 'question_answering':
      return ['recallAtK', 'precisionAtK', 'hitRate', 'answerCorrectness', 'faithfulness', 'hallucinationRate'];
    case 'text_generation':
      return ['factuality', 'relevance', 'instructionFollowing', 'formatCorrectness'];
    case 'summarization':
      return ['factuality', 'informationCoverage', 'relevance', 'conciseness', 'hallucinationRate'];
    case 'fine_tuning':
      return ['trainingLoss', 'validationLoss', 'accuracy', 'f1', 'overfittingDetection'];
    default:
      return ['accuracy', 'f1'];
  }
}
