import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, GitBranch, BarChart3, Share2, CheckCircle2, Copy, X } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { aiFoundryService } from '../../services/aiFoundryService';
import { useToast } from '../../components/ui/Toast';
import { cn, formatNumber, formatDate } from '../../lib/utils';
import type { ModelVersion } from '../../types';

function VersionRow({ version, isLatest }: { version: ModelVersion; isLatest: boolean }) {
  return (
    <div className={cn(
      'rounded-xl border p-4',
      version.status === 'production'
        ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-950/10'
        : 'border-border bg-card'
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[13px] font-bold text-foreground">{version.version}</span>
            <Badge variant={version.status === 'production' ? 'success' : 'secondary'}>
              {version.status === 'production' ? '● Production' : version.status.charAt(0).toUpperCase() + version.status.slice(1)}
            </Badge>
          </div>
          <p className="text-[12px] text-muted-foreground">{version.notes}</p>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span>{formatDate(version.createdAt)}</span>
            <span>{formatNumber(version.datasetSize)} records</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[18px] font-bold text-foreground tabular">{version.accuracy}%</div>
          <div className="text-[11px] text-muted-foreground">F1: {version.f1Score.toFixed(3)}</div>
        </div>
      </div>
    </div>
  );
}

interface ShareModalProps {
  projectId: string;
  onClose: () => void;
}
function ShareModal({ projectId, onClose }: ShareModalProps) {
  const shareUrl = `${window.location.origin}/share/${projectId}`;
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4 animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-foreground">Share your AI</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Anyone with this link can test your model in a read-only Testing Lab.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={15} />
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
          <span className="font-mono text-[12px] text-foreground truncate flex-1">{shareUrl}</span>
          <button
            onClick={copy}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1 text-[12px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={12} className="text-emerald-500" /> Read-only — visitors can't change anything
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={12} className="text-emerald-500" /> Live inference on your actual model
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={12} className="text-emerald-500" /> No sign-in required
          </div>
        </div>

        <Button className="w-full" onClick={copy}>
          {copied ? 'Copied!' : 'Copy share link'}
          <Share2 size={13} />
        </Button>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
  borderRadius: '10px', fontSize: '11px',
};

export function ModelVersionsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success } = useToast();
  const [project, setProject] = useState(() => id ? aiFoundryService.getProject(id) : null);
  const [showShare, setShowShare] = useState(false);
  const [compare, setCompare] = useState(false);

  useEffect(() => {
    if (id) setProject(aiFoundryService.getProject(id) || null);
  }, [id]);

  const versions = project?.versions || [];
  const sorted = [...versions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const production = sorted.find((v) => v.status === 'production');
  const archived = sorted.filter((v) => v.status !== 'production');

  // Comparison chart data
  const chartData = sorted.slice(0, 5).reverse().map((v) => ({
    version: v.version,
    accuracy: v.accuracy,
    f1: parseFloat((v.f1Score * 100).toFixed(1)),
    dataset: Math.round(v.datasetSize / 1000),
  }));

  const improvementVsFirst = sorted.length >= 2
    ? {
        accuracy: (sorted[0].accuracy - sorted[sorted.length - 1].accuracy).toFixed(1),
        f1: (sorted[0].f1Score - sorted[sorted.length - 1].f1Score).toFixed(3),
        dataset: (sorted[0].datasetSize - sorted[sorted.length - 1].datasetSize),
      }
    : null;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Model Versions</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {project?.name} · {versions.length} version{versions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {project?.modelHealth && (
            <Button size="sm" variant="outline" onClick={() => setShowShare(true)}>
              <Share2 size={13} />
              Share
            </Button>
          )}
          {versions.length >= 2 && (
            <Button size="sm" variant="outline" onClick={() => setCompare((c) => !c)}>
              <BarChart3 size={13} />
              {compare ? 'Hide' : 'Compare'}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => navigate(`/projects/${id}/improve`)}>
            <GitBranch size={13} />
            New version
          </Button>
        </div>
      </div>

      {/* Improvement summary */}
      {improvementVsFirst && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Accuracy gain', value: `+${improvementVsFirst.accuracy}%`, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'F1 improvement', value: `+${improvementVsFirst.f1}`, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Dataset growth', value: `+${formatNumber(improvementVsFirst.dataset)}`, color: 'text-primary' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</div>
              <div className={cn('text-[18px] font-bold tabular mt-0.5', s.color)}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground">v1.0 → latest</div>
            </div>
          ))}
        </div>
      )}

      {/* Comparison chart */}
      {compare && chartData.length >= 2 && (
        <div className="rounded-xl border border-border bg-card p-4 animate-fade-in">
          <div className="text-[13px] font-semibold text-foreground mb-3">Version comparison</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="version" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} domain={[75, 100]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any, name: any) => [`${v}${name === 'f1' ? '' : '%'}`, name === 'accuracy' ? 'Accuracy' : 'F1 ×100']} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="accuracy" />
              <Bar dataKey="f1" fill="#10b981" radius={[3, 3, 0, 0]} opacity={0.8} name="f1 ×100" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Version list */}
      {versions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/10 p-10 text-center space-y-3">
          <GitBranch size={24} className="mx-auto text-muted-foreground/30" />
          <p className="text-[13px] text-muted-foreground">No model versions yet. Build your model to create v1.0.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {production && (
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Current</div>
              <VersionRow version={production} isLatest={true} />
            </div>
          )}
          {archived.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">History</div>
              <div className="space-y-2">
                {archived.map((v) => <VersionRow key={v.id} version={v} isLatest={false} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {showShare && id && <ShareModal projectId={id} onClose={() => setShowShare(false)} />}
    </div>
  );
}
