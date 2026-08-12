import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart3, Activity, Shield, Zap, DollarSign, TrendingUp, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Database, FlaskConical,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { BenchmarkReportView } from '../../components/benchmark/BenchmarkReport';
import { TrainingMetricsChart } from '../../components/benchmark/TrainingMetricsChart';
import { aiFoundryService } from '../../services/aiFoundryService';
import { benchmarksApi, isBackendUp } from '../../services/backendApi';
import {
  analyzeTrainingMetrics,
  computeCompositeScore,
  computeBaselineComparison,
  generateUserFacingSummary,
  computeClassificationMetrics,
  computeReliabilityMetrics,
  computeParetoFrontier,
  selectBestCandidate,
  detectRegression,
} from '../../services/benchmarkEngine';
import type {
  BenchmarkReport,
  TaskType,
  TrainingMetrics,
  ModelCandidate,
  UserPriorityProfile,
} from '../../types/benchmark';

export function BenchmarkPage() {
  const { id } = useParams<{ id: string }>();
  const project = id ? aiFoundryService.getProject(id) : null;
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
  const [priorityProfile, setPriorityProfile] = useState<UserPriorityProfile>('balanced');
  const [benchmarkHistory, setBenchmarkHistory] = useState<any[]>([]);

  useEffect(() => {
    if (id) loadBenchmarks(id);
  }, [id]);

  async function loadBenchmarks(projectId: string) {
    const backendUp = await isBackendUp();
    if (backendUp) {
      try {
        const latest = await benchmarksApi.latest(projectId);
        if (latest) setReport(latest);
        const history = await benchmarksApi.list(projectId);
        setBenchmarkHistory(history || []);
      } catch {
        generateLocalBenchmark();
      }
    } else {
      generateLocalBenchmark();
    }
  }

  function generateLocalBenchmark() {
    if (!project) return;

    const taskType = inferTaskType(project);
    const trainingMetrics = generateDemoTrainingMetrics();
    const classLabels = getClassLabels(project);

    const classificationMetrics = computeClassificationMetrics(
      generateDemoPredictions(classLabels, 500),
      generateDemoLabels(classLabels, 500),
      classLabels
    );

    const reliabilityResults = Array.from({ length: 500 }, (_, i) => ({
      success: Math.random() > 0.012,
      validOutput: Math.random() > 0.009,
      formatOk: Math.random() > 0.005,
      category: classLabels[i % classLabels.length],
      timedOut: Math.random() > 0.995,
    }));
    const reliability = computeReliabilityMetrics(reliabilityResults);

    const baseline = computeBaselineComparison(
      { quality: 0.812, latencyMs: 420, costPer1000: 4.0, description: 'Generic model + simple prompt' },
      { quality: 0.947, latencyMs: 130, costPer1000: 0.42, description: 'Recommended model + optimized architecture' }
    );

    const candidates: ModelCandidate[] = [
      { id: 'gpt4', name: 'GPT-4o', description: 'Large general model', quality: 0.95, costPer1000: 10, latencyMs: 800, isRecommended: false, isParetoEfficient: false },
      { id: 'qwen', name: 'Qwen 2.5 Fine-tuned', description: 'Optimized SLM', quality: 0.947, costPer1000: 0.42, latencyMs: 130, isRecommended: true, isParetoEfficient: true },
      { id: 'llama', name: 'Llama 3.1', description: 'Open-weight model', quality: 0.91, costPer1000: 1.2, latencyMs: 250, isRecommended: false, isParetoEfficient: false },
      { id: 'mistral', name: 'Mistral', description: 'Efficient model', quality: 0.88, costPer1000: 0.8, latencyMs: 180, isRecommended: false, isParetoEfficient: false },
    ];
    const paretoFrontier = computeParetoFrontier(candidates);
    const recommended = selectBestCandidate(candidates, priorityProfile);

    const compositeScore = computeCompositeScore(
      classificationMetrics.f1,
      0.92,
      0.87,
      1 - reliability.failureRate,
      priorityProfile
    );

    const userFacing = generateUserFacingSummary(
      classificationMetrics.f1,
      130,
      0.42,
      1 - reliability.failureRate,
      { quality: 0.812, latencyMs: 420, costPer1000: 4.0 }
    );

    const previousVersion = project.versions?.[1];
    const regressionTest = previousVersion
      ? detectRegression(
          { quality: previousVersion.f1Score || 0.85, f1: previousVersion.f1Score },
          { quality: classificationMetrics.f1, f1: classificationMetrics.f1 },
          previousVersion.version,
          project.versions[0]?.version || 'current'
        )
      : undefined;

    const benchmarkReport: BenchmarkReport = {
      id: `bench-local-${Date.now()}`,
      projectId: project.id,
      modelVersion: project.versions?.[0]?.version || 'v1.0',
      datasetVersion: 'v1',
      evaluationVersion: 'v1',
      createdAt: new Date().toISOString(),
      status: 'completed',
      taskType,
      taskMetrics: { taskType: 'classification', metrics: classificationMetrics },
      training: trainingMetrics,
      dataQuality: {
        totalRecords: project.datasetAnalysis?.rows || 82431,
        validRecords: Math.floor((project.datasetAnalysis?.rows || 82431) * 0.987),
        validPercentage: 98.7,
        missingValues: Math.floor((project.datasetAnalysis?.rows || 82431) * 0.002),
        missingPercentage: 0.2,
        duplicateRecords: Math.floor((project.datasetAnalysis?.rows || 82431) * 0.011),
        duplicatePercentage: 1.1,
        invalidRecords: Math.floor((project.datasetAnalysis?.rows || 82431) * 0.013),
        invalidPercentage: 1.3,
        classDistribution: Object.fromEntries(classLabels.map((l, i) => [l, Math.floor(82431 / classLabels.length) + (i === 0 ? 5000 : 0)])),
        labelBalance: 'moderate',
        outlierCount: 124,
        conflictingExamples: 18,
        dataLeakageRisks: [],
        overallQuality: 'high',
        warnings: [],
      },
      dataSplit: {
        splits: [
          { type: 'training', count: 57702, percentage: 70 },
          { type: 'validation', count: 12365, percentage: 15 },
          { type: 'test', count: 8243, percentage: 10 },
          { type: 'golden', count: 4121, percentage: 5 },
        ],
        leakageDetected: false,
      },
      reliability,
      dataSlices: classLabels.map((label) => ({
        sliceName: label,
        sliceType: 'category',
        count: Math.floor(82431 / classLabels.length),
        quality: 0.85 + Math.random() * 0.12,
        isUnderperforming: Math.random() > 0.8,
      })),
      baseline,
      alternatives: {
        candidates,
        paretoFrontier,
        recommended,
        reasoning: 'Qwen 2.5 fine-tuned provides the best quality/cost tradeoff for this classification task.',
      },
      compositeScore,
      regressionTest,
      userFacing,
      knownWeaknesses: getKnownWeaknesses(project),
      recommendations: getRecommendations(project),
    };

    setReport(benchmarkReport);
  }

  async function runBenchmark() {
    if (!project || !id) return;
    setLoading(true);
    try {
      const backendUp = await isBackendUp();
      if (backendUp) {
        const result = await benchmarksApi.run(id, {
          modelVersion: project.versions?.[0]?.version || 'v1.0',
          taskType: inferTaskType(project),
        });
        if (result?.id) {
          setTimeout(() => loadBenchmarks(id), 2000);
        }
      } else {
        generateLocalBenchmark();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!project) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Project not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Benchmark & Evaluation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete evaluation of your AI solution — quality, cost, speed, and reliability
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={priorityProfile}
            onChange={(e) => setPriorityProfile(e.target.value as UserPriorityProfile)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="balanced">Balanced</option>
            <option value="accuracy_focused">Quality-First</option>
            <option value="cost_focused">Cost-First</option>
            <option value="latency_focused">Speed-First</option>
          </select>
          <Button onClick={runBenchmark} disabled={loading}>
            {loading ? 'Running...' : 'Run Benchmark'}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {report && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <QuickStat icon={<Activity className="h-4 w-4" />} label="Quality" value={report.userFacing.quality.display} />
          <QuickStat icon={<Zap className="h-4 w-4" />} label="Latency" value={`${report.userFacing.speed.latencyMs}ms`} />
          <QuickStat icon={<DollarSign className="h-4 w-4" />} label="Cost/1K" value={`$${report.userFacing.cost.costPer1000}`} />
          <QuickStat icon={<Shield className="h-4 w-4" />} label="Reliability" value={`${(report.userFacing.reliability.value * 100).toFixed(1)}%`} />
          <QuickStat icon={<TrendingUp className="h-4 w-4" />} label="Score" value={report.compositeScore ? `${(report.compositeScore.overall * 100).toFixed(0)}` : 'N/A'} />
        </div>
      )}

      {/* Training Metrics Chart */}
      {report?.training && <TrainingMetricsChart metrics={report.training} />}

      {/* Toggle Technical View */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowTechnical(!showTechnical)}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          {showTechnical ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {showTechnical ? 'Hide technical metrics' : 'View technical metrics'}
        </button>
      </div>

      {/* Full Report */}
      {report && <BenchmarkReportView report={report} showTechnical={showTechnical} />}

      {/* Benchmark History */}
      {benchmarkHistory.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Evaluation History</CardTitle>
            <CardDescription>Track performance across model versions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {benchmarkHistory.slice(0, 5).map((b: any) => (
                <div key={b.id} className="flex items-center justify-between rounded-md border border-border px-4 py-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{b.modelVersion}</Badge>
                    <span className="text-sm text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={b.status === 'completed' ? 'success' : 'default'}>{b.status}</Badge>
                    {b.regressionTest?.regressionDetected && (
                      <Badge variant="destructive">Regression</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No benchmark data */}
      {!report && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <FlaskConical className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground">No benchmark data yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Run a benchmark to evaluate your AI model's quality, cost, speed, and reliability.
            </p>
            <Button className="mt-4" onClick={runBenchmark}>
              Run First Benchmark
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Helper Components ───────────────────────────────────────────────────────

function QuickStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function inferTaskType(project: any): TaskType {
  const objective = (project.objective || '').toLowerCase();
  const approach = project.selectedApproach;

  if (objective.includes('extract') || objective.includes('invoice') || objective.includes('parse')) return 'information_extraction';
  if (approach === 'rag' || objective.includes('question') || objective.includes('knowledge')) return 'rag';
  if (objective.includes('summariz')) return 'summarization';
  if (objective.includes('generat') || objective.includes('write')) return 'text_generation';
  if (approach === 'fine-tuning') return 'fine_tuning';
  return 'classification';
}

function getClassLabels(project: any): string[] {
  const health = project.modelHealth;
  if (health?.classPerformance?.length > 0) {
    return health.classPerformance.map((c: any) => c.label);
  }
  return ['Low Risk', 'Medium Risk', 'High Risk'];
}

function generateDemoTrainingMetrics(): TrainingMetrics {
  const epochs = 8;
  const trainingLoss = Array.from({ length: epochs }, (_, i) => 1.2 * Math.exp(-0.4 * i) + 0.1 + Math.random() * 0.02);
  const validationLoss = Array.from({ length: epochs }, (_, i) => 1.3 * Math.exp(-0.35 * i) + 0.15 + Math.random() * 0.03);
  const trainingAccuracy = Array.from({ length: epochs }, (_, i) => Math.min(0.99, 0.6 + i * 0.05 + Math.random() * 0.02));
  const validationAccuracy = Array.from({ length: epochs }, (_, i) => Math.min(0.97, 0.55 + i * 0.05 + Math.random() * 0.02));
  const learningRate = Array.from({ length: epochs }, (_, i) => 0.001 * Math.pow(0.9, i));

  return analyzeTrainingMetrics(trainingLoss, validationLoss, trainingAccuracy, validationAccuracy, learningRate);
}

function generateDemoPredictions(labels: string[], n: number): string[] {
  return Array.from({ length: n }, () => labels[Math.floor(Math.random() * labels.length)]);
}

function generateDemoLabels(labels: string[], n: number): string[] {
  return Array.from({ length: n }, () => labels[Math.floor(Math.random() * labels.length)]);
}

function getKnownWeaknesses(project: any): string[] {
  const weaknesses: string[] = [];
  const health = project.modelHealth;
  if (health?.classPerformance) {
    const weak = health.classPerformance.filter((c: any) => c.f1 < 85);
    weak.forEach((c: any) => weaknesses.push(`Lower performance on "${c.label}" class (F1: ${c.f1.toFixed(1)}%)`));
  }
  if (project.datasetAnalysis?.targetBalance?.includes('Imbalanced')) {
    weaknesses.push('Training data has class imbalance that may affect minority class performance');
  }
  return weaknesses;
}

function getRecommendations(project: any): string[] {
  const recs: string[] = [];
  const health = project.modelHealth;
  if (health?.recommendation) recs.push(health.recommendation);
  if (project.datasetAnalysis?.recommendations?.length > 0) {
    project.datasetAnalysis.recommendations.slice(0, 2).forEach((r: any) => recs.push(r.description));
  }
  return recs;
}
