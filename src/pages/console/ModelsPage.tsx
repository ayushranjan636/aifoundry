import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Cpu, Activity, TrendingUp, ChevronRight, Zap,
  FlaskConical, Code2, GitBranch, RefreshCw, MessageCircle,
  Globe, Lock,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { analyticsApi } from '../../services/backendApi';
import { aiFoundryService } from '../../services/aiFoundryService';
import { cn, getHealthColor, formatNumber } from '../../lib/utils';

interface ModelRow {
  id: string;
  name: string;
  status: string;
  approach: string;
  model: string;
  currentVersion: string;
  accuracy: number;
  healthScore: number;
  requestsToday: number;
  avgLatency: number;
  errorRate: string;
  updatedAt: string;
  deliveryMode?: string;
  modelVisibility?: string;
}

export function ModelsPage() {
  const navigate = useNavigate();
  const [models, setModels] = useState<ModelRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      const data = await analyticsApi.models();
      setModels(data);
    } catch {
      // fallback to local
      const projects = aiFoundryService.getProjects().filter((p) => p.modelHealth);
      setModels(projects.map((p) => ({
        id: p.id, name: p.name, status: p.status,
        approach: p.selectedApproach || '', model: p.selectedModel || '',
        currentVersion: p.versions.find((v) => v.status === 'production')?.version || 'v1.0',
        accuracy: p.modelHealth?.accuracy || 0,
        healthScore: p.modelHealth?.score || 0,
        requestsToday: p.deployment?.requestsToday || 0,
        avgLatency: p.modelHealth?.latencyMs || 0,
        errorRate: p.deployment ? p.deployment.errorRate.toString() : '0',
        updatedAt: p.updatedAt,
        deliveryMode: p.deliveryMode,
        modelVisibility: p.modelVisibility,
      })));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Models</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {models.length} trained model{models.length !== 1 ? 's' : ''} in production
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={loadModels}>
          <RefreshCw size={13} />
          Refresh
        </Button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total models', value: models.length, color: 'text-foreground' },
          { label: 'Avg. accuracy', value: models.length ? `${(models.reduce((s, m) => s + m.accuracy, 0) / models.length).toFixed(1)}%` : '—', color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Requests today', value: formatNumber(models.reduce((s, m) => s + m.requestsToday, 0)), color: 'text-primary' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">{s.label}</div>
            <div className={cn('text-[22px] font-bold mt-1 tabular', s.color)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Models table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border bg-muted/20 grid grid-cols-12 px-4 py-2.5 gap-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          <div className="col-span-4">Model</div>
          <div className="col-span-2">Version</div>
          <div className="col-span-2">Health</div>
          <div className="col-span-2">Requests/day</div>
          <div className="col-span-2">Latency</div>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className={`h-12 stagger-${i}`} />)}
          </div>
        ) : models.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-[13px]">
            No production models yet.{' '}
            <button onClick={() => navigate('/projects/new')} className="text-primary hover:underline">Build your first AI</button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {models.map((model) => (
              <Link
                key={model.id}
                to={`/projects/${model.id}/health`}
                className="grid grid-cols-12 px-4 py-3 gap-3 items-center hover:bg-muted/30 transition-colors group"
              >
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Cpu size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-foreground truncate">{model.name}</span>
                      {model.deliveryMode === 'chat' && (
                        <span className="flex items-center gap-0.5 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded-full">
                          <MessageCircle size={9} />
                          Chat
                        </span>
                      )}
                      {model.modelVisibility === 'public' && (
                        <Globe size={11} className="text-emerald-500 shrink-0" />
                      )}
                      {model.modelVisibility === 'private' && (
                        <Lock size={10} className="text-muted-foreground/60 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground capitalize">{model.approach} · {model.model}</div>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="font-mono text-[12px] text-foreground">{model.currentVersion}</span>
                  <Badge variant="success" className="ml-2 text-[10px]">live</Badge>
                </div>
                <div className="col-span-2">
                  <span className={cn('text-[13px] font-bold tabular', getHealthColor(model.healthScore))}>
                    {model.healthScore}/100
                  </span>
                  <div className="text-[11px] text-muted-foreground">{model.accuracy}% acc</div>
                </div>
                <div className="col-span-2">
                  <span className="text-[13px] font-medium text-foreground tabular">{formatNumber(model.requestsToday)}</span>
                  <div className="text-[11px] text-muted-foreground">{model.errorRate}% errors</div>
                </div>
                <div className="col-span-2 flex items-center justify-between">
                  <span className="text-[13px] text-foreground tabular">{model.avgLatency}ms</span>
                  <ChevronRight size={13} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { icon: <FlaskConical size={14} />, label: 'Testing Lab', desc: 'Test model inputs interactively', href: models[0] ? `/projects/${models[0].id}/test` : '/projects' },
          { icon: <Code2 size={14} />, label: 'API Playground', desc: 'Run live API requests', href: models[0] ? `/projects/${models[0].id}/api` : '/projects' },
          { icon: <GitBranch size={14} />, label: 'Version History', desc: 'Compare model versions', href: models[0] ? `/projects/${models[0].id}/versions` : '/projects' },
        ].map((a) => (
          <Link key={a.label} to={a.href} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/30 transition-colors group">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
              {a.icon}
            </div>
            <div>
              <div className="text-[12px] font-semibold text-foreground">{a.label}</div>
              <div className="text-[11px] text-muted-foreground">{a.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
