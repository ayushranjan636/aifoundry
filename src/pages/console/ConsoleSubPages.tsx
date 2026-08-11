import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Zap } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { aiFoundryService } from '../../services/aiFoundryService';
import { cn, getHealthColor } from '../../lib/utils';
import type { Project } from '../../types';

export function ModelsPage() {
  const projects: Project[] = aiFoundryService.getProjects().filter((p: Project) => p.modelHealth);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Models</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{projects.length} trained model{projects.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="space-y-3">
        {projects.map((p: Project) => (
          <Link
            key={p.id}
            to={`/projects/${p.id}/health`}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
              <Cpu size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{p.name}</span>
                <Badge variant={p.status === 'production' ? 'success' : 'secondary'}>
                  {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground capitalize mt-0.5">
                {p.selectedApproach} · {p.selectedModel}
              </div>
            </div>
            {p.modelHealth && (
              <div className="text-right shrink-0">
                <div className={cn('text-base font-bold', getHealthColor(p.modelHealth.score))}>
                  {p.modelHealth.score}/100
                </div>
                <div className="text-xs text-muted-foreground">{p.modelHealth.accuracy}% acc</div>
              </div>
            )}
          </Link>
        ))}
        {projects.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground text-sm">
            No trained models yet.
          </div>
        )}
      </div>
    </div>
  );
}

export function DeploymentsPage() {
  const projects: Project[] = aiFoundryService.getProjects().filter((p: Project) => p.deployment?.status === 'production');

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Deployments</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{projects.length} active deployment{projects.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="space-y-3">
        {projects.map((p: Project) => (
          <Link key={p.id} to={`/projects/${p.id}/deploy`}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">{p.name}</div>
              <div className="font-mono text-xs text-muted-foreground truncate">{p.deployment?.endpoint}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold text-foreground">{p.deployment?.requestsToday.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">req/day</div>
            </div>
          </Link>
        ))}
        {projects.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground text-sm">
            No active deployments.
          </div>
        )}
      </div>
    </div>
  );
}

export function UsagePage() {
  const projects: Project[] = aiFoundryService.getProjects();
  const totalRequests = projects.reduce((s: number, p: Project) => s + (p.deployment?.requestsToday || 0), 0);
  const deployed = projects.filter((p) => p.deployment?.status === 'production').length;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Usage</h1>
        <p className="text-sm text-muted-foreground mt-0.5">API and compute usage overview.</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'API Requests Today', value: totalRequests.toLocaleString() },
          { label: 'Deployed Models', value: deployed },
          { label: 'Avg. Latency', value: '142 ms' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">{stat.label}</div>
            <div className="text-2xl font-bold text-foreground mt-1">{stat.value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-muted/20 p-6 text-center">
        <Zap size={20} className="mx-auto text-muted-foreground/40 mb-2" />
        <div className="text-sm text-muted-foreground">Detailed usage analytics coming soon.</div>
      </div>
    </div>
  );
}
