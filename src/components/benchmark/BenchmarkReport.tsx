import React from 'react';
import type { BenchmarkReport as BenchmarkReportType, UserFacingBenchmark } from '../../types/benchmark';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface BenchmarkReportProps {
  report: BenchmarkReportType;
  showTechnical?: boolean;
}

export function BenchmarkReportView({ report, showTechnical = false }: BenchmarkReportProps) {
  return (
    <div className="space-y-6">
      <UserFacingSection userFacing={report.userFacing} />
      {report.dataQuality && <DataQualitySection dataQuality={report.dataQuality} />}
      {report.reliability && <ReliabilitySection reliability={report.reliability} />}
      {showTechnical && report.taskMetrics && <TaskMetricsSection taskMetrics={report.taskMetrics} />}
      {report.baseline && <BaselineSection baseline={report.baseline} />}
      {report.alternatives && <AlternativesSection alternatives={report.alternatives} />}
      {report.compositeScore && <CompositeScoreSection score={report.compositeScore} />}
      {report.regressionTest && <RegressionSection regression={report.regressionTest} />}
      {report.knownWeaknesses.length > 0 && <WeaknessesSection weaknesses={report.knownWeaknesses} />}
    </div>
  );
}

function UserFacingSection({ userFacing }: { userFacing: UserFacingBenchmark }) {
  const speedLabels = { very_fast: 'Very Fast', fast: 'Fast', moderate: 'Moderate', slow: 'Slow' };
  const costLabels = { very_low: 'Very Low', low: 'Low', moderate: 'Moderate', high: 'High' };
  const reliabilityLabels = { very_high: 'Very High', high: 'High', moderate: 'Moderate', low: 'Low' };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your AI Performance</CardTitle>
        <CardDescription>Overall evaluation results for this model</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard
            label="Quality"
            value={userFacing.quality.display}
            color="text-primary"
          />
          <MetricCard
            label="Speed"
            value={speedLabels[userFacing.speed.category]}
            subtext={`${userFacing.speed.latencyMs}ms`}
            color="text-blue-500"
          />
          <MetricCard
            label="Cost"
            value={costLabels[userFacing.cost.category]}
            subtext={`$${userFacing.cost.costPer1000}/1K req`}
            color="text-emerald-500"
          />
          <MetricCard
            label="Reliability"
            value={reliabilityLabels[userFacing.reliability.category]}
            subtext={`${(userFacing.reliability.value * 100).toFixed(1)}%`}
            color="text-amber-500"
          />
        </div>

        {userFacing.improvement && (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
            <p className="mb-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">Compared with baseline model</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{userFacing.improvement.qualityDelta}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Quality</p>
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{userFacing.improvement.speedDelta}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Speed</p>
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{userFacing.improvement.costDelta}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Cost</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value, subtext, color }: { label: string; value: string; subtext?: string; color: string }) {
  return (
    <div className="rounded-lg border border-border p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
      {subtext && <p className="mt-0.5 text-xs text-muted-foreground">{subtext}</p>}
    </div>
  );
}

function DataQualitySection({ dataQuality }: { dataQuality: BenchmarkReportType['dataQuality'] }) {
  const qualityBadge = {
    high: { variant: 'success' as const, label: 'High' },
    medium: { variant: 'outline' as const, label: 'Medium' },
    low: { variant: 'destructive' as const, label: 'Low' },
  };
  const badge = qualityBadge[dataQuality.overallQuality];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Dataset Quality</CardTitle>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatItem label="Records" value={dataQuality.totalRecords.toLocaleString()} />
          <StatItem label="Valid" value={`${dataQuality.validPercentage.toFixed(1)}%`} />
          <StatItem label="Duplicates" value={`${dataQuality.duplicatePercentage.toFixed(1)}%`} />
          <StatItem label="Missing" value={`${dataQuality.missingPercentage.toFixed(1)}%`} />
        </div>

        {dataQuality.warnings.length > 0 && (
          <div className="mt-4 space-y-2">
            {dataQuality.warnings.slice(0, 5).map((warning, i) => (
              <div
                key={i}
                className={`rounded-md px-3 py-2 text-sm ${
                  warning.severity === 'critical'
                    ? 'border border-destructive/20 bg-destructive/10 text-destructive'
                    : warning.severity === 'warning'
                    ? 'border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
                    : 'border border-border bg-muted text-muted-foreground'
                }`}
              >
                {warning.message}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReliabilitySection({ reliability }: { reliability: BenchmarkReportType['reliability'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reliability</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatItem label="Failure Rate" value={`${(reliability.failureRate * 100).toFixed(2)}%`} />
          <StatItem label="Format Compliance" value={`${(reliability.formatCompliance * 100).toFixed(1)}%`} />
          <StatItem label="Timeout Rate" value={`${(reliability.timeoutRate * 100).toFixed(2)}%`} />
          <StatItem label="Error Rate" value={`${(reliability.errorRate * 100).toFixed(2)}%`} />
        </div>

        {reliability.worstPerformingCategories.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-foreground">Underperforming Categories</p>
            <div className="flex flex-wrap gap-2">
              {reliability.worstPerformingCategories.map((cat) => (
                <Badge key={cat} variant="destructive">{cat}: {((reliability.perClassFailureRate[cat] || 0) * 100).toFixed(1)}% fail</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TaskMetricsSection({ taskMetrics }: { taskMetrics: BenchmarkReportType['taskMetrics'] }) {
  if (taskMetrics.taskType === 'classification' || taskMetrics.taskType === 'binary_classification' || taskMetrics.taskType === 'fine_tuning') {
    const m = taskMetrics.metrics;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Classification Metrics</CardTitle>
          <CardDescription>Detailed task-specific evaluation on held-out test set</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatItem label="Accuracy" value={`${(m.accuracy * 100).toFixed(1)}%`} />
            <StatItem label="Precision" value={`${(m.precision * 100).toFixed(1)}%`} />
            <StatItem label="Recall" value={`${(m.recall * 100).toFixed(1)}%`} />
            <StatItem label="F1" value={`${(m.f1 * 100).toFixed(1)}%`} />
            <StatItem label="Macro F1" value={`${(m.macroF1 * 100).toFixed(1)}%`} />
            <StatItem label="Weighted F1" value={`${(m.weightedF1 * 100).toFixed(1)}%`} />
          </div>

          {m.perClassMetrics && m.perClassMetrics.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-foreground">Per-Class Performance</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 pr-4 text-muted-foreground">Class</th>
                      <th className="pb-2 pr-4 text-muted-foreground">Precision</th>
                      <th className="pb-2 pr-4 text-muted-foreground">Recall</th>
                      <th className="pb-2 pr-4 text-muted-foreground">F1</th>
                      <th className="pb-2 text-muted-foreground">Support</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.perClassMetrics.map((cls) => (
                      <tr key={cls.label} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-medium">{cls.label}</td>
                        <td className="py-2 pr-4">{(cls.precision * 100).toFixed(1)}%</td>
                        <td className="py-2 pr-4">{(cls.recall * 100).toFixed(1)}%</td>
                        <td className="py-2 pr-4">{(cls.f1 * 100).toFixed(1)}%</td>
                        <td className="py-2">{cls.support.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (taskMetrics.taskType === 'information_extraction') {
    const m = taskMetrics.metrics;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Extraction Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatItem label="Exact Match" value={`${(m.overallExactMatch * 100).toFixed(1)}%`} />
            <StatItem label="Extraction Success" value={`${(m.overallExtractionSuccess * 100).toFixed(1)}%`} />
          </div>
          <div className="mt-4 space-y-2">
            {m.fields.map((f) => (
              <div key={f.fieldName} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span className="text-sm font-medium">{f.fieldName}</span>
                <span className="text-sm text-muted-foreground">{(f.f1 * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (taskMetrics.taskType === 'rag' || taskMetrics.taskType === 'question_answering') {
    const m = taskMetrics.metrics;
    return (
      <Card>
        <CardHeader>
          <CardTitle>RAG Evaluation</CardTitle>
          <CardDescription>Retrieval and generation quality</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium">Retrieval (K={m.retrieval.k})</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatItem label="Recall@K" value={`${(m.retrieval.recallAtK * 100).toFixed(1)}%`} />
              <StatItem label="Precision@K" value={`${(m.retrieval.precisionAtK * 100).toFixed(1)}%`} />
              <StatItem label="Hit Rate" value={`${(m.retrieval.hitRate * 100).toFixed(1)}%`} />
              <StatItem label="Relevance" value={`${(m.retrieval.retrievalRelevance * 100).toFixed(1)}%`} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Generation</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatItem label="Correctness" value={`${(m.generation.answerCorrectness * 100).toFixed(1)}%`} />
              <StatItem label="Faithfulness" value={`${(m.generation.faithfulness * 100).toFixed(1)}%`} />
              <StatItem label="Context Relevance" value={`${(m.generation.contextRelevance * 100).toFixed(1)}%`} />
              <StatItem label="Hallucination" value={`${(m.generation.hallucinationRate * 100).toFixed(1)}%`} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

function BaselineSection({ baseline }: { baseline: BenchmarkReportType['baseline'] }) {
  if (!baseline) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Baseline Comparison</CardTitle>
        <CardDescription>{baseline.baselineDescription} vs {baseline.optimizedDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left text-muted-foreground">Metric</th>
                <th className="pb-2 text-right text-muted-foreground">Baseline</th>
                <th className="pb-2 text-right text-muted-foreground">Optimized</th>
                <th className="pb-2 text-right text-muted-foreground">Improvement</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-2 font-medium">Quality</td>
                <td className="py-2 text-right">{(baseline.baselineQuality * 100).toFixed(1)}%</td>
                <td className="py-2 text-right">{(baseline.optimizedQuality * 100).toFixed(1)}%</td>
                <td className="py-2 text-right text-emerald-600">+{(baseline.qualityImprovement * 100).toFixed(1)}%</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 font-medium">Latency</td>
                <td className="py-2 text-right">{baseline.baselineLatencyMs}ms</td>
                <td className="py-2 text-right">{baseline.optimizedLatencyMs}ms</td>
                <td className="py-2 text-right text-emerald-600">{(baseline.latencyImprovement * 100).toFixed(0)}% faster</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">Cost/1K</td>
                <td className="py-2 text-right">${baseline.baselineCostPer1000.toFixed(3)}</td>
                <td className="py-2 text-right">${baseline.optimizedCostPer1000.toFixed(3)}</td>
                <td className="py-2 text-right text-emerald-600">{(baseline.costReduction * 100).toFixed(0)}% lower</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function AlternativesSection({ alternatives }: { alternatives: BenchmarkReportType['alternatives'] }) {
  if (!alternatives) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alternative Models</CardTitle>
        <CardDescription>{alternatives.reasoning}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left text-muted-foreground">Model</th>
                <th className="pb-2 text-right text-muted-foreground">Quality</th>
                <th className="pb-2 text-right text-muted-foreground">Cost/1K</th>
                <th className="pb-2 text-right text-muted-foreground">Latency</th>
                <th className="pb-2 text-right text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {alternatives.candidates.map((c) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="py-2 font-medium">{c.name}</td>
                  <td className="py-2 text-right">{(c.quality * 100).toFixed(1)}%</td>
                  <td className="py-2 text-right">${c.costPer1000.toFixed(3)}</td>
                  <td className="py-2 text-right">{c.latencyMs}ms</td>
                  <td className="py-2 text-right">
                    {c.isRecommended && <Badge variant="success">Recommended</Badge>}
                    {c.isParetoEfficient && !c.isRecommended && <Badge variant="outline">Pareto</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function CompositeScoreSection({ score }: { score: BenchmarkReportType['compositeScore'] }) {
  if (!score) return null;
  const profileLabels: Record<string, string> = {
    accuracy_focused: 'Accuracy-Focused',
    cost_focused: 'Cost-Focused',
    latency_focused: 'Latency-Focused',
    balanced: 'Balanced',
    custom: 'Custom',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Composite Score</CardTitle>
          <Badge variant="outline">{profileLabels[score.profile]}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-center">
          <p className="text-4xl font-bold text-primary">{(score.overall * 100).toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">Overall Score</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ScoreBar label="Quality" value={score.qualityScore} weight={score.weights.quality} />
          <ScoreBar label="Cost" value={score.costEfficiencyScore} weight={score.weights.cost} />
          <ScoreBar label="Speed" value={score.latencyScore} weight={score.weights.latency} />
          <ScoreBar label="Reliability" value={score.reliabilityScore} weight={score.weights.reliability} />
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreBar({ label, value, weight }: { label: string; value: number; weight: number }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-1 h-20 w-6 overflow-hidden rounded-full bg-muted">
        <div
          className="w-full rounded-full bg-primary transition-all"
          style={{ height: `${value * 100}%`, marginTop: `${(1 - value) * 100}%` }}
        />
      </div>
      <p className="text-xs font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{(weight * 100).toFixed(0)}% weight</p>
    </div>
  );
}

function RegressionSection({ regression }: { regression: NonNullable<BenchmarkReportType['regressionTest']> }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Regression Test</CardTitle>
          <Badge variant={regression.regressionDetected ? 'destructive' : 'success'}>
            {regression.regressionDetected ? 'Regression Detected' : 'No Regression'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">{regression.previousVersion}</p>
            <p className="text-lg font-bold">{(regression.previousMetrics.quality * 100).toFixed(1)}%</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">{regression.currentVersion}</p>
            <p className={`text-lg font-bold ${regression.regressionDetected ? 'text-destructive' : 'text-emerald-600'}`}>
              {(regression.currentMetrics.quality * 100).toFixed(1)}%
            </p>
          </div>
        </div>
        {regression.regressionDetails && (
          <p className="mt-3 text-sm text-destructive">{regression.regressionDetails}</p>
        )}
      </CardContent>
    </Card>
  );
}

function WeaknessesSection({ weaknesses }: { weaknesses: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Known Weaknesses</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {weaknesses.map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
              {w}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
