import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Activity, Cpu, Database, FlaskConical, Rocket, Code2,
  Layers, TrendingUp, ChevronRight, ArrowRight, Play, Zap,
  Trash2, MoreHorizontal, BarChart3,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import { aiFoundryService } from '../../services/aiFoundryService';
import { cn, getHealthColor, formatNumber, formatDate } from '../../lib/utils';
import type { Project } from '../../types';

interface NavCard {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export function ProjectOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      const p = aiFoundryService.getProject(id);
      setProject(p || null);
    }
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    await aiFoundryService.deleteProject(id);
    navigate('/projects');
  };

  if (!project) {
    return (
      <div className="p-6 text-center text-muted-foreground">Project not found.</div>
    );
  }

  const navCards: NavCard[] = [
    {
      icon: <TrendingUp size={16} />,
      label: 'Architecture',
      description: `${project.selectedApproach ? `Using ${project.selectedApproach}` : 'Not configured'}`,
      href: `/projects/${id}/architect`,
      badge: project.selectedApproach ? <Badge variant="secondary" className="capitalize">{project.selectedApproach}</Badge> : null,
    },
    {
      icon: <Cpu size={16} />,
      label: 'Foundation model',
      description: `${project.selectedModel ? `${project.selectedModel} selected` : 'Not selected'}`,
      href: `/projects/${id}/architect`,
      badge: project.selectedModel ? <Badge variant="secondary" className="capitalize">{project.selectedModel}</Badge> : null,
    },
    {
      icon: <Database size={16} />,
      label: 'Dataset',
      description: project.datasetAnalysis
        ? `${formatNumber(project.datasetAnalysis.rows)} records · Readiness ${project.datasetAnalysis.readinessScore}/100`
        : 'No dataset uploaded',
      href: `/projects/${id}/data`,
      badge: project.datasetAnalysis
        ? <Badge variant={project.datasetAnalysis.readinessScore >= 75 ? 'success' : 'warning'}>{project.datasetAnalysis.readinessScore}/100</Badge>
        : null,
    },
    {
      icon: <Activity size={16} />,
      label: 'Model health',
      description: project.modelHealth
        ? `Score ${project.modelHealth.score}/100 · Accuracy ${project.modelHealth.accuracy}%`
        : 'Model not yet built',
      href: `/projects/${id}/health`,
      badge: project.modelHealth
        ? <Badge variant={project.modelHealth.score >= 85 ? 'success' : 'warning'}>{project.modelHealth.score}/100</Badge>
        : null,
      disabled: !project.modelHealth,
    },
    {
      icon: <BarChart3 size={16} />,
      label: 'Benchmark & Evaluation',
      description: project.modelHealth
        ? 'Quality, cost, speed & reliability analysis'
        : 'Available after model is built',
      href: `/projects/${id}/benchmark`,
      disabled: !project.modelHealth,
    },
    {
      icon: <FlaskConical size={16} />,
      label: 'Testing lab',
      description: `${project.testCases.length} test cases`,
      href: `/projects/${id}/test`,
      disabled: !project.modelHealth,
    },
    {
      icon: <Rocket size={16} />,
      label: 'Deployment',
      description: project.deployment?.status === 'production'
        ? `Live · ${project.deployment.requestsToday} requests today`
        : 'Not deployed',
      href: `/projects/${id}/deploy`,
      badge: project.deployment?.status === 'production' ? <Badge variant="success">Live</Badge> : null,
      disabled: !project.modelHealth,
    },
    {
      icon: <Code2 size={16} />,
      label: 'API playground',
      description: 'Test your API endpoint interactively',
      href: `/projects/${id}/api`,
      disabled: !project.deployment || project.deployment.status !== 'production',
    },
    {
      icon: <Layers size={16} />,
      label: 'Model versions',
      description: `${project.versions.length} version${project.versions.length !== 1 ? 's' : ''}`,
      href: `/projects/${id}/versions`,
      disabled: project.versions.length === 0,
    },
  ];

  const buildProgress = project.buildStatus?.progress || 0;
  const isBuildable = project.selectedApproach && project.selectedModel && project.datasetAnalysis;
  const isBuilding = project.buildStatus?.status === 'running';
  const isBuilt = project.buildStatus?.status === 'completed' || project.status === 'production';

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to="/projects" className="hover:text-foreground transition-colors">Projects</Link>
            <ChevronRight size={12} />
            <span className="text-foreground font-medium">{project.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">{project.name}</h1>
            <Badge variant={
              project.status === 'production' ? 'success' :
              project.status === 'training' ? 'default' :
              project.status === 'draft' ? 'secondary' : 'warning'
            }>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg">{project.description}</p>
        </div>

        <div className="flex gap-2 shrink-0">
          {!isBuilt && isBuildable && (
            <Button onClick={() => navigate(`/projects/${id}/checkpoint`)}>
              <Play size={14} />
              Build AI
            </Button>
          )}
          {isBuilt && (
            <Button variant="outline" onClick={() => navigate(`/projects/${id}/improve`)}>
              Improve model
            </Button>
          )}
          {isBuilt && !project.deployment && (
            <Button onClick={() => navigate(`/projects/${id}/deploy`)}>
              Deploy
              <ArrowRight size={14} />
            </Button>
          )}
          {/* Delete */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
            <div className="relative rounded-2xl border border-border bg-card shadow-2xl p-6 w-full max-w-sm space-y-4 animate-fade-in">
              <div>
                <h3 className="text-base font-semibold text-foreground">Delete project?</h3>
                <p className="text-[13px] text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">{project.name}</span> and all its data — models, versions, and deployment history — will be permanently removed.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  loading={deleting}
                  onClick={handleDelete}
                >
                  <Trash2 size={13} />
                  Delete project
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active training */}
      {isBuilding && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Training in progress</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/projects/${id}/building`)}>
              View build <ChevronRight size={12} />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={buildProgress} className="flex-1" />
            <span className="text-sm text-blue-700 dark:text-blue-400 font-medium">{buildProgress}%</span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">{project.buildStatus?.currentStage}</p>
        </div>
      )}

      {/* Quick stats */}
      {project.modelHealth && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Accuracy', value: `${project.modelHealth.accuracy}%` },
            { label: 'F1 Score', value: project.modelHealth.f1Score.toFixed(3) },
            { label: 'Latency', value: `${project.modelHealth.latencyMs} ms` },
            { label: 'Health', value: `${project.modelHealth.score}/100`, extra: true },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-3">
              <div className="text-xs text-muted-foreground">{stat.label}</div>
              <div className={cn(
                'text-base font-bold mt-0.5',
                stat.extra ? getHealthColor(project.modelHealth!.score) : 'text-foreground'
              )}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generated model prompt indicator */}
      {project.generatedSystemPrompt && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/10 p-4">
          <div className="flex items-start gap-3">
            <Zap size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-emerald-700 dark:text-emerald-400">Real model active</div>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                {project.generatedSystemPrompt.slice(0, 200)}…
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation cards */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Project sections</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {navCards.map((card) => (
            <Link
              key={card.label}
              to={card.disabled ? '#' : card.href}
              onClick={(e) => card.disabled && e.preventDefault()}
              className={cn(
                'flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200',
                card.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:border-primary/30 hover:shadow-sm group cursor-pointer'
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{card.label}</span>
                  {card.badge}
                </div>
                <p className="text-xs text-muted-foreground truncate">{card.description}</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Next action */}
      {!isBuilt && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-medium text-foreground mb-1">Recommended next step</div>
          {!project.selectedApproach && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Define your AI to get started.</p>
              <Button size="sm" onClick={() => navigate(`/projects/${id}/build`)}>
                Define AI <ArrowRight size={12} />
              </Button>
            </div>
          )}
          {project.selectedApproach && !project.selectedModel && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Select a foundation model.</p>
              <Button size="sm" onClick={() => navigate(`/projects/${id}/architect`)}>
                Choose model <ArrowRight size={12} />
              </Button>
            </div>
          )}
          {project.selectedApproach && project.selectedModel && !project.datasetAnalysis && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Upload your dataset for analysis.</p>
              <Button size="sm" onClick={() => navigate(`/projects/${id}/data`)}>
                Upload data <ArrowRight size={12} />
              </Button>
            </div>
          )}
          {isBuildable && !isBuilding && !isBuilt && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">You're ready to build your AI.</p>
              <Button size="sm" onClick={() => navigate(`/projects/${id}/checkpoint`)}>
                Review & build <ArrowRight size={12} />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
