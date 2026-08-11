import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, Loader2, FlaskConical, Rocket, Zap, TrendingUp, Database, BrainCircuit, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Progress } from '../../components/ui/Progress';
import { Badge } from '../../components/ui/Badge';
import { aiFoundryService } from '../../services/aiFoundryService';
import { hasOpenAIKey } from '../../config/apiConfig';
import { cn } from '../../lib/utils';
import type { BuildStatus } from '../../types';

// Story content for each stage
const STAGE_STORIES: Record<string, { icon: React.ReactNode; headline: string; detail: string }> = {
  'prepare': {
    icon: <Database size={16} />,
    headline: 'Preparing your dataset',
    detail: 'Loading and validating the dataset schema. Checking column types, detecting encodings, and preparing the data pipeline.',
  },
  'validate': {
    icon: <CheckCircle size={16} />,
    headline: 'Validating data quality',
    detail: 'Running data quality checks — missing values, outliers, duplicate rows, and feature distributions. Building quality report.',
  },
  'split': {
    icon: <TrendingUp size={16} />,
    headline: 'Creating training split',
    detail: 'Splitting data 80/10/10 (train/validation/test). Applying stratified sampling to preserve class distribution in each split.',
  },
  'configure': {
    icon: <BrainCircuit size={16} />,
    headline: 'Selecting optimal configuration',
    detail: 'Choosing learning rate, batch size, optimizer, and regularization. Running lightweight hyperparameter scan.',
  },
  'generate-prompt': {
    icon: <Zap size={16} />,
    headline: 'Generating model specification',
    detail: 'Building a specialized model definition tailored to your domain, objectives, and constraints. Embedding domain knowledge.',
  },
  'train': {
    icon: <Loader2 size={16} />,
    headline: 'Fine-tuning model',
    detail: 'Running training epochs. Loss is decreasing — model is learning your domain-specific patterns.',
  },
  'evaluate': {
    icon: <TrendingUp size={16} />,
    headline: 'Running comprehensive evaluation',
    detail: 'Computing accuracy, precision, recall, F1 on held-out test set. Checking per-class performance and edge cases.',
  },
  'optimize': {
    icon: <Zap size={16} />,
    headline: 'Optimizing for production',
    detail: 'Applying model compression. Reducing inference latency. Running final quality gate.',
  },
  'deploy-prep': {
    icon: <Rocket size={16} />,
    headline: 'Preparing deployment package',
    detail: 'Packaging model artifacts. Generating API endpoint. Running health checks. Almost ready.',
  },
};

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">{label}</div>
      <div className="text-[20px] font-bold text-foreground mt-0.5 tabular">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

export function BuildingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [buildStatus, setBuildStatus] = useState<BuildStatus | null>(null);
  const [started, setStarted] = useState(false);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || started) return;
    const project = aiFoundryService.getProject(id);
    if (!project) return;
    if (project.buildStatus?.status === 'completed') {
      setBuildStatus(project.buildStatus);
      return;
    }
    setStarted(true);
    aiFoundryService.startBuild(id, (status) => {
      setBuildStatus(status);
    });
  }, [id]);

  useEffect(() => {
    if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [buildStatus?.logs.length]);

  const isComplete = buildStatus?.status === 'completed';
  const project = aiFoundryService.getProject(id || '');
  const stages = project?.buildPlan?.stages || [];
  const currentStageId = stages.find((s) => s.status === 'running')?.id;

  // Auto-expand the currently running stage
  useEffect(() => {
    if (currentStageId) setExpandedStage(currentStageId);
  }, [currentStageId]);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-foreground">
            {isComplete ? '✓ Your AI is ready.' : 'Building your AI'}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {isComplete
              ? 'Training and evaluation complete. Your model is ready to test and deploy.'
              : 'Each stage runs automatically. You can watch the process below.'}
          </p>
        </div>
        <Badge variant={hasOpenAIKey() ? 'default' : 'secondary'} className="shrink-0">
          {hasOpenAIKey() ? <><Zap size={10} className="mr-1" />AI engine active</> : 'Demo mode'}
        </Badge>
      </div>

      {/* Success banner */}
      {isComplete && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/60 dark:bg-emerald-950/20 p-5 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="font-semibold text-foreground">Build complete</div>
              <div className="text-[12px] text-muted-foreground">{project?.name} · v1.0</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate(`/projects/${id}/test`)}>
              <FlaskConical size={13} />
              Test your AI
            </Button>
            <Button variant="outline" onClick={() => navigate(`/projects/${id}/deploy`)}>
              <Rocket size={13} />
              Deploy
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/projects/${id}/health`)}>
              View health report
            </Button>
          </div>
        </div>
      )}

      {/* Overall progress */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-semibold text-foreground">
            {isComplete ? 'Completed' : buildStatus?.currentStage || 'Initializing…'}
          </span>
          <span className="text-[15px] font-bold text-foreground tabular">{buildStatus?.progress ?? 0}%</span>
        </div>
        <Progress
          value={buildStatus?.progress ?? 0}
          indicatorClassName={isComplete ? 'bg-emerald-500' : undefined}
        />
        {!isComplete && buildStatus && (
          <p className="text-[11px] text-muted-foreground mt-2">
            {stages.filter((s) => s.status === 'completed').length} of {stages.length} stages complete
          </p>
        )}
      </div>

      {/* Storytelling stages */}
      <div className="space-y-2">
        {stages.map((stage) => {
          const story = STAGE_STORIES[stage.id];
          const isRunning = stage.status === 'running';
          const isDone = stage.status === 'completed';
          const isExpanded = expandedStage === stage.id;

          return (
            <div
              key={stage.id}
              className={cn(
                'rounded-xl border transition-all duration-300',
                isDone && 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-950/10',
                isRunning && 'border-primary/40 bg-primary/5 shadow-sm',
                stage.status === 'pending' && 'border-border bg-card opacity-50',
              )}
            >
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                disabled={stage.status === 'pending'}
              >
                {isDone && <CheckCircle size={15} className="text-emerald-500 shrink-0" />}
                {isRunning && <Loader2 size={15} className="text-primary animate-spin shrink-0" />}
                {stage.status === 'pending' && <Circle size={15} className="text-muted-foreground/30 shrink-0" />}

                <div className="flex-1 min-w-0">
                  <div className={cn(
                    'text-[13px] font-medium',
                    isDone && 'text-muted-foreground',
                    isRunning && 'text-primary',
                    stage.status === 'pending' && 'text-muted-foreground/50',
                  )}>
                    {story?.headline || stage.label}
                  </div>
                  {isRunning && !isExpanded && (
                    <div className="text-[11px] text-muted-foreground mt-0.5 animate-pulse">
                      Running…
                    </div>
                  )}
                </div>

                {(isDone || isRunning) && (
                  <span className="text-muted-foreground shrink-0">
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </span>
                )}
              </button>

              {/* Expanded story */}
              {isExpanded && story && (isDone || isRunning) && (
                <div className="px-4 pb-4 animate-fade-in-fast">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-background border border-border">
                    <span className="text-primary mt-0.5 shrink-0">{story.icon}</span>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{story.detail}</p>
                  </div>

                  {/* Stage-specific analytics */}
                  {stage.id === 'validate' && buildStatus?.metrics && (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {[
                        { label: 'Records', value: (project?.datasetAnalysis?.rows || 0).toLocaleString() },
                        { label: 'Features', value: project?.datasetAnalysis?.columns || 0 },
                        { label: 'Readiness', value: `${project?.datasetAnalysis?.readinessScore || 0}/100` },
                      ].map((s) => (
                        <div key={s.label} className="rounded-lg border border-border bg-background p-2 text-center">
                          <div className="text-[10px] text-muted-foreground">{s.label}</div>
                          <div className="text-[13px] font-bold text-foreground tabular">{s.value}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {stage.id === 'train' && buildStatus?.metrics && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-border bg-background p-2">
                        <div className="text-[10px] text-muted-foreground">Training loss</div>
                        <div className="text-[15px] font-bold text-foreground tabular">
                          {buildStatus.metrics.trainingLoss.toFixed(3)}
                        </div>
                        <div className="h-1 bg-muted rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(10, 100 - buildStatus.metrics.trainingLoss * 80)}%` }}
                          />
                        </div>
                      </div>
                      <div className="rounded-lg border border-border bg-background p-2">
                        <div className="text-[10px] text-muted-foreground">Epoch progress</div>
                        <div className="text-[15px] font-bold text-foreground tabular">
                          {buildStatus.metrics.epoch}/{buildStatus.metrics.totalEpochs}
                        </div>
                        <div className="h-1 bg-muted rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${(buildStatus.metrics.epoch / buildStatus.metrics.totalEpochs) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {stage.id === 'evaluate' && buildStatus?.metrics && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {[
                        { label: 'Accuracy', value: `${buildStatus.metrics.accuracy.toFixed(1)}%` },
                        { label: 'F1 Score', value: buildStatus.metrics.f1Score.toFixed(3) },
                      ].map((s) => (
                        <div key={s.label} className="rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 p-2 text-center">
                          <div className="text-[10px] text-muted-foreground">{s.label}</div>
                          <div className="text-[15px] font-bold text-emerald-700 dark:text-emerald-400 tabular">{s.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live metrics during training */}
      {buildStatus?.metrics && !isComplete && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
          <MetricCard label="Train Loss" value={buildStatus.metrics.trainingLoss.toFixed(3)} sub={`Epoch ${buildStatus.metrics.epoch}/${buildStatus.metrics.totalEpochs}`} />
          <MetricCard label="Val Loss" value={buildStatus.metrics.validationLoss.toFixed(3)} />
          <MetricCard label="Accuracy" value={`${buildStatus.metrics.accuracy.toFixed(1)}%`} />
          <MetricCard label="F1" value={buildStatus.metrics.f1Score.toFixed(3)} />
        </div>
      )}

      {/* Activity log */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="text-[12px] font-semibold text-foreground">Activity log</div>
          {buildStatus?.logs.length ? (
            <span className="text-[10px] text-muted-foreground">{buildStatus.logs.length} events</span>
          ) : null}
        </div>
        <div className="h-44 overflow-y-auto p-3 font-mono text-[11px] space-y-1 bg-muted/10">
          {(!buildStatus?.logs.length) && (
            <div className="text-muted-foreground animate-pulse">Initializing build environment…</div>
          )}
          {buildStatus?.logs.map((log, i) => (
            <div key={i} className={cn(
              'flex items-start gap-3',
              log.level === 'success' && 'text-emerald-600 dark:text-emerald-400',
              log.level === 'warn' && 'text-amber-500',
              log.level === 'info' && 'text-muted-foreground',
            )}>
              <span className="shrink-0 text-muted-foreground/50">{log.timestamp}</span>
              <span>{log.message}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
