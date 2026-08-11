import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, ArrowLeft, Target, BrainCircuit, Cpu, Database, Clock, DollarSign, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { aiFoundryService } from '../../services/aiFoundryService';
import { cn, formatNumber } from '../../lib/utils';
import type { Project } from '../../types';

export function CheckpointPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    if (!id) return;
    const p = aiFoundryService.getProject(id);
    setProject(p || null);
  }, [id]);

  const handleStartBuild = async () => {
    if (!id) return;
    setBuilding(true);
    await aiFoundryService.createBuildPlan(id);
    navigate(`/projects/${id}/building`);
  };

  if (!project) return null;

  const summaryItems = [
    {
      icon: <Target size={16} />,
      label: 'Objective',
      value: project.objective ? project.objective.slice(0, 80) + (project.objective.length > 80 ? '…' : '') : 'Not specified',
    },
    {
      icon: <BrainCircuit size={16} />,
      label: 'Approach',
      value: project.selectedApproach
        ? project.selectedApproach.charAt(0).toUpperCase() + project.selectedApproach.slice(1)
        : 'Not selected',
    },
    {
      icon: <Cpu size={16} />,
      label: 'Foundation model',
      value: project.selectedModel
        ? project.selectedModel.charAt(0).toUpperCase() + project.selectedModel.slice(1)
        : 'Not selected',
    },
    {
      icon: <Database size={16} />,
      label: 'Dataset',
      value: project.datasetAnalysis
        ? `${formatNumber(project.datasetAnalysis.rows)} records · ${project.datasetAnalysis.fileSize}`
        : 'Not uploaded',
    },
    {
      icon: <CheckCircle size={16} />,
      label: 'Dataset readiness',
      value: project.datasetAnalysis ? `${project.datasetAnalysis.readinessScore}/100` : 'Not analyzed',
      valueClassName: project.datasetAnalysis
        ? project.datasetAnalysis.readinessScore >= 75
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-amber-600 dark:text-amber-400'
        : '',
    },
    {
      icon: <Clock size={16} />,
      label: 'Expected build time',
      value: '~2 hours',
    },
    {
      icon: <DollarSign size={16} />,
      label: 'Estimated compute',
      value: '$18–$27',
    },
  ];

  const canBuild = project.selectedApproach && project.selectedModel && project.datasetAnalysis;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ready to build?</h1>
        <p className="text-muted-foreground mt-1">
          Review your configuration before starting the build process.
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <div className="text-sm font-semibold text-foreground">{project.name}</div>
        </div>
        <div className="divide-y divide-border">
          {summaryItems.map((item) => (
            <div key={item.label} className="flex items-start gap-3 px-4 py-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0 mt-0.5">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className={cn('text-sm font-medium text-foreground mt-0.5', item.valueClassName)}>
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!canBuild && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-4">
          <div className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">Configuration incomplete</div>
          <ul className="space-y-1">
            {!project.selectedApproach && (
              <li className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-amber-500 shrink-0" />
                Architecture approach not selected
              </li>
            )}
            {!project.selectedModel && (
              <li className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-amber-500 shrink-0" />
                Foundation model not selected
              </li>
            )}
            {!project.datasetAnalysis && (
              <li className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-amber-500 shrink-0" />
                Dataset not uploaded
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          size="lg"
          onClick={handleStartBuild}
          disabled={!canBuild}
          loading={building}
          className={cn(canBuild && 'bg-emerald-600 hover:bg-emerald-700')}
        >
          <Play size={16} />
          Start building
        </Button>
        <Button variant="ghost" size="lg" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} />
          Back
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        For this demonstration, the build will complete in approximately 15 seconds.
        In production, this process typically takes 1–3 hours depending on dataset size.
      </p>
    </div>
  );
}
