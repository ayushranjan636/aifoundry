import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Rocket, Globe, ExternalLink, Copy, CheckCircle2,
  RefreshCw, Activity, StopCircle, Plus, AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { deploymentsApi } from '../../services/backendApi';
import { aiFoundryService } from '../../services/aiFoundryService';
import { cn, formatNumber } from '../../lib/utils';

interface DeploymentRow {
  id: string;
  projectId: string;
  projectName: string;
  model: string;
  status: string;
  endpoint: string;
  region: string;
  latencyMs: number;
  requestsToday: number;
  errorRate: string;
  deployedAt: string;
}

export function DeploymentsPage() {
  const navigate = useNavigate();
  const [deployments, setDeployments] = useState<DeploymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await deploymentsApi.list();
      setDeployments(data);
    } catch {
      const projects = aiFoundryService.getProjects().filter((p) => p.deployment?.status === 'production');
      setDeployments(projects.map((p) => ({
        id: `deploy-${p.id}`,
        projectId: p.id,
        projectName: p.name,
        model: p.selectedModel || '',
        status: 'production',
        endpoint: p.deployment?.endpoint || '',
        region: p.deployment?.region || 'us-east-1',
        latencyMs: p.deployment?.latencyMs || 0,
        requestsToday: p.deployment?.requestsToday || 0,
        errorRate: p.deployment?.errorRate?.toString() || '0',
        deployedAt: p.deployment?.deployedAt || '',
      })));
    } finally {
      setLoading(false);
    }
  };

  const copyEndpoint = (endpoint: string, id: string) => {
    navigator.clipboard.writeText(endpoint);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Deployments</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {deployments.filter((d) => d.status === 'production').length} active endpoints
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={load}>
            <RefreshCw size={13} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => navigate('/projects')}>
            <Plus size={13} />
            Deploy model
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active endpoints', value: deployments.filter((d) => d.status === 'production').length },
          { label: 'Total requests today', value: formatNumber(deployments.reduce((s, d) => s + d.requestsToday, 0)) },
          { label: 'Avg. latency', value: deployments.length ? `${Math.round(deployments.reduce((s, d) => s + d.latencyMs, 0) / deployments.length)}ms` : '—' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">{s.label}</div>
            <div className="text-[22px] font-bold mt-1 tabular text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Deployments list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : deployments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/10 p-10 text-center space-y-3">
          <Rocket size={24} className="mx-auto text-muted-foreground/30" />
          <div className="text-[13px] text-muted-foreground">No active deployments.</div>
          <Button size="sm" onClick={() => navigate('/projects')}>Deploy a model</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {deployments.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border border-border bg-card p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Globe size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-foreground">{d.projectName}</span>
                      <Badge variant={d.status === 'production' ? 'success' : 'secondary'}>
                        {d.status === 'production' ? '● Live' : d.status}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground capitalize">{d.model}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{d.region}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/projects/${d.projectId}/api`}>
                    <Button size="sm" variant="outline">
                      <ExternalLink size={12} />
                      Playground
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Endpoint */}
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                <span className="font-mono text-[11px] text-muted-foreground truncate flex-1">{d.endpoint}</span>
                <button
                  onClick={() => copyEndpoint(d.endpoint, d.id)}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied === d.id ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
                </button>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Requests today', value: formatNumber(d.requestsToday) },
                  { label: 'Avg. latency', value: `${d.latencyMs}ms` },
                  { label: 'Error rate', value: `${d.errorRate}%`, alert: parseFloat(d.errorRate) > 2 },
                  { label: 'Uptime', value: '99.9%' },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border border-border bg-background p-2.5">
                    <div className="text-[10px] text-muted-foreground">{m.label}</div>
                    <div className={cn('text-[13px] font-semibold mt-0.5 tabular', m.alert ? 'text-amber-600 dark:text-amber-400' : 'text-foreground')}>
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
