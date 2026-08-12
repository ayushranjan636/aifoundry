import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, ArrowLeft, Target, BrainCircuit, Cpu, Database, Clock, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CostEstimationCard } from '../../components/ui/CostEstimationCard';
import { aiFoundryService } from '../../services/aiFoundryService';
import { pricingApi, estimateProjectCostLocal } from '../../services/pricingApi';
import type { ProjectCostEstimate } from '../../services/pricingApi';
import { cn, formatNumber } from '../../lib/utils';
import type { Project } from '../../types';

export function CheckpointPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [building, setBuilding] = useState(false);
  const [costEstimate, setCostEstimate] = useState<ProjectCostEstimate | null>(null);
  const [costLoading, setCostLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!id) return;
    const p = aiFoundryService.getProject(id);
    setProject(p || null);

    if (p) {
      loadCostEstimate(p);
    }
  }, [id]);

  const loadCostEstimate = async (p: Project) => {
    setCostLoading(true);
    try {
      const res = await pricingApi.estimateProject({
        approach: p.selectedApproach || 'fine-tuning',
        model: p.selectedModel || 'qwen',
        datasetRows: p.datasetAnalysis?.rows || 50000,
        datasetSizeGB: p.dataset ? p.dataset.size / 1_000_000_000 : 0.5,
        queriesPerDay: 500,
        epochs: 3,
        includeDeployment: false,
        includeRAG: p.selectedApproach === 'rag',
        documentCount: p.selectedApproach === 'rag' ? 5000 : 0,
      });
      setCostEstimate(res.estimate);
    } catch {
      // Fallback to local estimation
      const localEstimate = estimateProjectCostLocal({
        approach: p.selectedApproach || 'fine-tuning',
        model: p.selectedModel || 'qwen',
        datasetRows: p.datasetAnalysis?.rows || 50000,
        queriesPerDay: 500,
        includeRAG: p.selectedApproach === 'rag',
      });
      setCostEstimate(localEstimate);
    } finally {
      setCostLoading(false);
    }
  };

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
      value: project.objective ? project.objective.slice(0, 80) + (project.objective.length > 80 ? '...' : '') : 'Not specified',
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
      value: costEstimate
        ? `~${Math.max(1, Math.round(costEstimate.training.estimatedTrainingHours))} hours`
        : '~2 hours',
    },
  ];

  const canBuild = project.selectedApproach && project.selectedModel && project.datasetAnalysis;
  const isExpensive = costEstimate && costEstimate.summary.oneTimeTrainingCost > 10;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ready to build?</h1>
        <p className="text-muted-foreground mt-1">
          Review your configuration and estimated costs before starting.
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

      {/* Cost Estimation Card */}
      <CostEstimationCard estimate={costEstimate} loading={costLoading} />

      {/* Confirmation for expensive jobs */}
      {isExpensive && !confirmed && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-[13px] font-medium text-amber-700 dark:text-amber-400">
                Confirm cost estimate
              </div>
              <p className="text-[12px] text-amber-600/80 dark:text-amber-400/80 mt-1">
                This training job is estimated at ${costEstimate!.summary.oneTimeTrainingCost.toFixed(2)}.
                Actual cost may vary based on runtime.
              </p>
              <button
                onClick={() => setConfirmed(true)}
                className="mt-2 px-3 py-1.5 text-[11px] font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                I understand, proceed
              </button>
            </div>
          </div>
        </div>
      )}

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
          disabled={!canBuild || (isExpensive && !confirmed)}
          loading={building}
          className={cn(canBuild && (isExpensive && !confirmed ? '' : 'bg-emerald-600 hover:bg-emerald-700'))}
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
        In production, this process typically takes 1–3 hours depending on dataset size and model complexity.
      </p>
    </div>
  );
}
