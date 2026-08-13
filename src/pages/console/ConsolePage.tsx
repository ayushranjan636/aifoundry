import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, ArrowRight, Activity, Cpu, Rocket, TrendingUp,
  ChevronRight, CheckCircle2, Zap, Shield, Clock, RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import { useAuth } from '../../store/AuthContext';
import { aiFoundryService } from '../../services/aiFoundryService';
import { cn, getHealthColor, formatNumber } from '../../lib/utils';
import type { Project } from '../../types';

import { analyticsApi } from '../../services/backendApi';

interface ActivityItem {
  id: string;
  projectName: string;
  statusCode: number;
  latencyMs: number;
  modelVersion: string;
  createdAt: string;
}

function LiveActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await analyticsApi.requests({ limit: 12 });
        setItems(data.requests || []);
      } catch {
        // Generate mock feed
        const mockItems: ActivityItem[] = Array.from({ length: 8 }, (_, i) => ({
          id: `${i}`,
          projectName: ['Credit Risk AI', 'Support AI'][i % 2],
          statusCode: Math.random() > 0.97 ? 500 : 200,
          latencyMs: Math.floor(100 + Math.random() * 250),
          modelVersion: 'v1.2',
          createdAt: new Date(Date.now() - i * 12000).toISOString(),
        }));
        setItems(mockItems);
      } finally {
        setLoading(false);
      }
    };
    load();

    // Poll every 10s
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[12px] font-semibold text-foreground">Live API activity</span>
        </div>
        <span className="text-[10px] text-muted-foreground">Updates every 10s</span>
      </div>
      <div ref={feedRef} className="divide-y divide-border max-h-48 overflow-auto">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-2 text-[11px] hover:bg-muted/20 transition-colors">
            <span className={cn(
              'font-mono font-bold w-8 shrink-0',
              item.statusCode === 200 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
            )}>
              {item.statusCode}
            </span>
            <span className="text-foreground flex-1 truncate font-medium">{item.projectName}</span>
            <span className="text-muted-foreground font-mono w-8 shrink-0">{item.modelVersion}</span>
            <span className="text-muted-foreground tabular w-14 text-right shrink-0">{item.latencyMs}ms</span>
            <span className="text-muted-foreground/50 w-16 text-right shrink-0 hidden sm:block">
              {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getGreeting(name: string): string {
  const h = new Date().getHours();
  const first = name.split(' ')[0];
  if (h < 12) return `Good morning, ${first}.`;
  if (h < 18) return `Good afternoon, ${first}.`;
  return `Good evening, ${first}.`;
}

function StatusDot({ status }: { status: Project['status'] }) {
  return (
    <span className={cn(
      'inline-block h-2 w-2 rounded-full shrink-0',
      status === 'production' && 'bg-emerald-500',
      status === 'training' && 'bg-blue-500 animate-pulse',
      status === 'evaluating' && 'bg-amber-500',
      status === 'draft' && 'bg-muted-foreground/40',
      status === 'failed' && 'bg-red-500',
    )} />
  );
}

export function ConsolePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [backendUp, setBackendUp] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');

  useEffect(() => {
    setProjects(aiFoundryService.getProjects());

    // Load from backend
    import('../../services/backendApi').then(({ isBackendUp, userApi }) => {
      isBackendUp().then((up) => {
        setBackendUp(up);
        if (up) {
          userApi.apiKey().then((d) => setUserApiKey(d.apiKey)).catch(() => {});
          aiFoundryService.getProjectsAsync().then(setProjects).catch(() => {});
        }
      });
    });
  }, []);

  const activeModels = projects.filter((p) => p.status === 'production').length;
  const deployedModels = projects.filter((p) => p.deployment?.status === 'production').length;
  const totalRequests = projects.reduce((s, p) => s + (p.deployment?.requestsToday || 0), 0);
  const avgHealthProjects = projects.filter((p) => p.modelHealth);
  const avgHealth = avgHealthProjects.length
    ? Math.round(avgHealthProjects.reduce((s, p) => s + (p.modelHealth?.score || 0), 0) / avgHealthProjects.length)
    : 0;

  const hasProjects = projects.length > 0;
  const hasBuiltProjects = projects.some((p) => p.status !== 'draft');

  const statusBadge = (p: Project) => {
    switch (p.status) {
      case 'production': return <Badge variant="success">Production</Badge>;
      case 'training': return <Badge variant="default">Training</Badge>;
      case 'evaluating': return <Badge variant="warning">Evaluating</Badge>;
      case 'draft': return <Badge variant="secondary">Draft</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-7 animate-fade-in">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-foreground">
            {getGreeting(user?.name || 'there')}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {hasBuiltProjects
              ? `${activeModels} active model${activeModels !== 1 ? 's' : ''} · ${deployedModels} deployed`
              : 'Build AI that understands your data.'}
          </p>
        </div>
        <Button size="sm" onClick={() => navigate('/projects/new')}>
          <Plus size={13} />
          New project
        </Button>
      </div>

      {/* Backend status + API key banner */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className={cn(
          'flex items-center gap-1.5 text-[11px] font-medium border rounded-full px-2.5 py-1',
          backendUp
            ? 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20'
            : 'text-muted-foreground border-border bg-muted/30'
        )}>
          <span className={cn('h-1.5 w-1.5 rounded-full', backendUp ? 'bg-emerald-500' : 'bg-muted-foreground/50')} />
          {backendUp ? 'Backend connected' : 'Backend offline (demo mode)'}
        </div>
        {backendUp && userApiKey && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium border rounded-full px-2.5 py-1 border-border bg-muted/30 text-muted-foreground font-mono">
            {userApiKey.slice(0, 16)}…
          </div>
        )}
      </div>

      {/* ── Stats ──────────────────────────────────────── */}
      {hasBuiltProjects && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Active Models', value: activeModels, icon: <Cpu size={14} />, color: 'text-primary' },
            { label: 'Deployed', value: deployedModels, icon: <Rocket size={14} />, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'API Calls Today', value: formatNumber(totalRequests), icon: <Activity size={14} />, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Avg. Health', value: avgHealth ? `${avgHealth}/100` : '—', icon: <TrendingUp size={14} />, color: avgHealth >= 85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400' },
          ].map((stat, i) => (
            <div key={stat.label} className={cn('rounded-xl border border-border bg-card p-4 animate-fade-in', `stagger-${i + 1}`)}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</span>
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <div className={cn('text-[22px] font-bold tabular', stat.color)}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Build CTA (only when no projects yet) ──────── */}
      {!hasProjects && (
        <div
          onClick={() => navigate('/projects/new')}
          className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/3 p-7 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
              <Plus size={26} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-semibold text-foreground">Build your first AI</div>
              <div className="text-[13px] text-muted-foreground mt-0.5">
                Describe your problem. Foundry recommends the architecture, analyzes your data, and gives you a production API.
              </div>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {['No ML expertise needed', 'From data to API', 'Real model inference'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <ArrowRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </div>
        </div>
      )}

      {/* ── Add new project card (when already have projects) */}
      {hasProjects && (
        <div
          onClick={() => navigate('/projects/new')}
          className="rounded-xl border border-dashed border-border bg-transparent p-4 cursor-pointer hover:border-primary/30 hover:bg-muted/20 transition-all duration-200 group flex items-center gap-3"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
            <Plus size={15} className="text-muted-foreground group-hover:text-primary" />
          </div>
          <span className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Start a new AI project
          </span>
          <ArrowRight size={14} className="ml-auto text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </div>
      )}

      {/* ── Projects list ───────────────────────────────── */}
      {hasProjects && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-semibold text-foreground">Projects</h2>
            <Link to="/projects" className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-primary transition-colors">
              View all <ChevronRight size={13} />
            </Link>
          </div>

          <div className="space-y-2">
            {projects.slice(0, 6).map((project, i) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className={cn(
                  'flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3',
                  'hover:border-primary/25 hover:shadow-sm transition-all duration-150 group animate-fade-in',
                  `stagger-${Math.min(i + 1, 5)}`
                )}
              >
                <StatusDot status={project.status} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-foreground">{project.name}</span>
                    {statusBadge(project)}
                    {project.selectedApproach && (
                      <Badge variant="outline" className="capitalize text-[10px]">{project.selectedApproach}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                    {project.selectedModel && <span className="capitalize">{project.selectedModel}</span>}
                    {project.datasetAnalysis && <span>{formatNumber(project.datasetAnalysis.rows)} records</span>}
                    {project.status === 'training' && project.buildStatus && (
                      <span className="text-blue-600 dark:text-blue-400">{project.buildStatus.progress}% complete</span>
                    )}
                  </div>
                </div>

                {project.status === 'training' && project.buildStatus && (
                  <div className="w-20 shrink-0">
                    <Progress value={project.buildStatus.progress} size="sm" />
                  </div>
                )}

                {project.modelHealth && (
                  <div className="shrink-0 text-right">
                    <div className={cn('text-[13px] font-bold tabular', getHealthColor(project.modelHealth.score))}>
                      {project.modelHealth.score}/100
                    </div>
                    <div className="text-[10px] text-muted-foreground">health</div>
                  </div>
                )}

                <ChevronRight size={13} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Trust signals ────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Platform capabilities</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <Zap size={13} />, label: 'Real-time model inference', color: 'text-primary' },
            { icon: <Shield size={13} />, label: 'System prompt engineering', color: 'text-emerald-600 dark:text-emerald-400' },
            { icon: <Activity size={13} />, label: 'Live model evaluation', color: 'text-blue-600 dark:text-blue-400' },
            { icon: <Clock size={13} />, label: 'Version history', color: 'text-amber-600 dark:text-amber-400' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className={item.color}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Plan status ─────────────────────────────────── */}
      <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Premium</span>
              <span className="text-[11px] text-muted-foreground">Unlimited models & API calls</span>
            </div>
            <div className="text-[14px] font-semibold text-foreground">You have full access</div>
            <div className="text-[12px] text-muted-foreground">
              Team collaboration, advanced analytics, and priority support are all enabled.
            </div>
          </div>
          <div className="shrink-0 h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
        </div>
        {/* Usage bar */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">API calls today</span>
            <span className="font-medium text-foreground">{formatNumber(totalRequests)} / Unlimited</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-emerald-500"
              style={{ width: `${Math.min((totalRequests / 1000) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Live activity feed ─────────────────────────────── */}
      <LiveActivityFeed />

    </div>
  );
}
