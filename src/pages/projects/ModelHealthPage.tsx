import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FlaskConical, Rocket, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { aiFoundryService } from '../../services/aiFoundryService';
import { cn, getHealthColor } from '../../lib/utils';

function ScoreRing({ score }: { score: number }) {
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444';
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className={cn('text-3xl font-bold tabular-nums', getHealthColor(score))}>{score}</div>
        <div className="text-xs text-muted-foreground">/ 100</div>
      </div>
    </div>
  );
}

export function ModelHealthPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = id ? aiFoundryService.getProject(id) : null;
  const health = project?.modelHealth;

  if (!health) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Model health data not available.</p>
        <p className="text-xs mt-1">Build your model first to see health metrics.</p>
      </div>
    );
  }

  const metrics = [
    { label: 'Accuracy', value: `${health.accuracy}%` },
    { label: 'Precision', value: `${health.precision}%` },
    { label: 'Recall', value: `${health.recall}%` },
    { label: 'F1 Score', value: health.f1Score.toFixed(3) },
    { label: 'Latency', value: `${health.latencyMs} ms` },
    { label: 'Model Size', value: `${health.modelSizeGb} GB` },
  ];

  const radarData = [
    { subject: 'Accuracy', A: health.accuracy },
    { subject: 'Precision', A: health.precision },
    { subject: 'Recall', A: health.recall },
    { subject: 'F1', A: health.f1Score * 100 },
    { subject: 'Latency', A: Math.max(0, 100 - health.latencyMs / 5) },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Model Health</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{project?.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}/test`)}>
            <FlaskConical size={14} />
            Test
          </Button>
          <Button size="sm" onClick={() => navigate(`/projects/${id}/deploy`)}>
            <Rocket size={14} />
            Deploy
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Score ring */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center">
          <div className="text-sm font-semibold text-foreground mb-3">Overall Score</div>
          <ScoreRing score={health.score} />
          <Badge
            variant={health.score >= 85 ? 'success' : health.score >= 70 ? 'warning' : 'destructive'}
            className="mt-3"
          >
            {health.score >= 85 ? 'Excellent' : health.score >= 70 ? 'Good' : 'Needs improvement'}
          </Badge>
        </div>

        {/* Metrics grid */}
        <div className="md:col-span-2 grid grid-cols-3 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-xl border border-border bg-card p-3">
              <div className="text-xs text-muted-foreground">{m.label}</div>
              <div className="text-lg font-bold text-foreground mt-0.5">{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Interpretation */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="text-sm font-semibold text-foreground">AI-generated interpretation</div>
        <p className="text-sm text-muted-foreground leading-relaxed">{health.interpretation}</p>
        <div className="border-t border-border pt-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Recommended improvement</div>
          <p className="text-sm text-foreground">{health.recommendation}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}/improve`)}>
          Improve model
          <ArrowRight size={12} />
        </Button>
      </div>

      {/* Class performance */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <div className="text-sm font-semibold text-foreground">Class performance</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Class</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Precision</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Recall</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">F1</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Support</th>
              </tr>
            </thead>
            <tbody>
              {health.classPerformance.map((cls) => (
                <tr key={cls.label} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-medium text-foreground">{cls.label}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{cls.precision}%</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{cls.recall}%</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{cls.f1}%</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{cls.support.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evaluation history chart */}
      {health.evaluationHistory.length > 1 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[13px] font-semibold text-foreground mb-4">Evaluation history</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={health.evaluationHistory} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="version" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} domain={[75, 100]} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
              <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Accuracy %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Confidence distribution */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="text-[13px] font-semibold text-foreground mb-3">Confidence distribution</div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart
            data={[
              { label: 'High', value: 64, color: '#10b981' },
              { label: 'Medium', value: 26, color: '#f59e0b' },
              { label: 'Low', value: 10, color: '#ef4444' },
            ]}
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }}
              formatter={(v: any) => [`${v}%`, 'Predictions']}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-[11px] text-muted-foreground mt-2">
          64% of predictions are high-confidence. Low-confidence predictions may benefit from more training data in those cases.
        </p>
      </div>
    </div>
  );
}
