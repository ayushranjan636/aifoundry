import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { TrainingMetrics, FitDiagnosis } from '../../types/benchmark';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface TrainingMetricsChartProps {
  metrics: TrainingMetrics;
  className?: string;
}

const DIAGNOSIS_CONFIG: Record<FitDiagnosis, { label: string; variant: 'default' | 'success' | 'destructive' | 'outline'; description: string }> = {
  underfitting: {
    label: 'Underfitting',
    variant: 'destructive',
    description: 'Both training and validation loss remain high. The model is not learning the patterns in the data effectively.',
  },
  good_fit: {
    label: 'Good Fit',
    variant: 'success',
    description: 'Training and validation losses converge appropriately. The model generalizes well.',
  },
  overfitting: {
    label: 'Overfitting',
    variant: 'destructive',
    description: 'Training loss continues decreasing while validation loss is increasing. The model memorizes training data instead of learning general patterns.',
  },
  unstable: {
    label: 'Unstable Training',
    variant: 'outline',
    description: 'Training shows high variance. Consider reducing learning rate or using gradient clipping.',
  },
};

export function TrainingMetricsChart({ metrics, className }: TrainingMetricsChartProps) {
  const chartData = useMemo(() => {
    return metrics.trainingLoss.map((tl, i) => ({
      epoch: i + 1,
      'Training Loss': parseFloat(tl.toFixed(4)),
      'Validation Loss': metrics.validationLoss[i] ? parseFloat(metrics.validationLoss[i].toFixed(4)) : undefined,
      ...(metrics.trainingAccuracy ? { 'Training Accuracy': parseFloat((metrics.trainingAccuracy[i] * 100).toFixed(1)) } : {}),
      ...(metrics.validationAccuracy ? { 'Validation Accuracy': metrics.validationAccuracy[i] ? parseFloat((metrics.validationAccuracy[i] * 100).toFixed(1)) : undefined } : {}),
    }));
  }, [metrics]);

  const diagnosisConfig = DIAGNOSIS_CONFIG[metrics.fitDiagnosis];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Training Progress</CardTitle>
            <CardDescription>
              {metrics.epochs} epochs &middot; {metrics.steps} steps
            </CardDescription>
          </div>
          <Badge variant={diagnosisConfig.variant}>{diagnosisConfig.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="epoch"
                label={{ value: 'Epoch', position: 'insideBottomRight', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Training Loss"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Validation Loss"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                strokeDasharray="4 4"
              />
              {metrics.overfittingDetected && metrics.overfittingEpoch && (
                <ReferenceLine
                  x={metrics.overfittingEpoch}
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="3 3"
                  label={{ value: 'Overfitting', fill: 'hsl(var(--destructive))', fontSize: 11 }}
                />
              )}
              {metrics.convergenceEpoch && (
                <ReferenceLine
                  x={metrics.convergenceEpoch}
                  stroke="hsl(var(--success, 142 76% 36%))"
                  strokeDasharray="3 3"
                  label={{ value: 'Converged', fill: 'hsl(142 76% 36%)', fontSize: 11 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">{diagnosisConfig.description}</p>
          {metrics.overfittingDetected && metrics.overfittingEpoch && (
            <p className="mt-1 text-sm font-medium text-destructive">
              Validation loss started increasing after epoch {metrics.overfittingEpoch} while training loss continued decreasing.
            </p>
          )}
        </div>

        {metrics.trainingAccuracy && metrics.validationAccuracy && (
          <div className="mt-4 h-48 w-full">
            <p className="mb-2 text-sm font-medium text-foreground">Accuracy</p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="epoch" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Line type="monotone" dataKey="Training Accuracy" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Validation Accuracy" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
