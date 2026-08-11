import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Zap, Clock, DollarSign, Server } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { aiFoundryService } from '../../services/aiFoundryService';
import { cn } from '../../lib/utils';
import type { ModelOption, ModelId } from '../../types';

function FitBar({ score, recommended }: { score: number; recommended: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700',
            score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-primary' : 'bg-muted-foreground/40'
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-foreground">{score}% fit</span>
    </div>
  );
}

const COST_LABELS = { low: 'Low cost', medium: 'Medium cost', high: 'High cost' };
const SPEED_LABELS = { fast: 'Fast', medium: 'Medium', slow: 'Slower' };
const COMPLEXITY_LABELS = { simple: 'Simple deploy', moderate: 'Moderate', complex: 'Complex' };

const COST_COLORS = {
  low: 'text-emerald-600 dark:text-emerald-400',
  medium: 'text-amber-600 dark:text-amber-400',
  high: 'text-red-600 dark:text-red-400',
};

function ModelCard({
  model,
  selected,
  onSelect,
}: {
  model: ModelOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-xl border p-4 transition-all duration-200',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-card hover:border-primary/30'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{model.name}</span>
            <span className="text-xs text-muted-foreground">{model.provider}</span>
            {model.recommended && <Badge variant="default">Recommended</Badge>}
            {selected && (
              <span className="flex items-center gap-1 text-xs text-primary font-medium">
                <CheckCircle size={12} />
                Selected
              </span>
            )}
          </div>
          <div className="mt-2">
            <FitBar score={model.fitScore} recommended={model.recommended} />
          </div>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{model.description}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <DollarSign size={11} className={COST_COLORS[model.costIndicator]} />
          <span className="text-muted-foreground">{COST_LABELS[model.costIndicator]}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Zap size={11} className="text-amber-500" />
          <span className="text-muted-foreground">{SPEED_LABELS[model.speedIndicator]}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Server size={11} className="text-muted-foreground" />
          <span className="text-muted-foreground">{COMPLEXITY_LABELS[model.deploymentComplexity]}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {model.capabilities.slice(0, 3).map((cap) => (
          <span key={cap} className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground">
            {cap}
          </span>
        ))}
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground font-mono">
          {model.parameters}
        </span>
      </div>
    </button>
  );
}

export function ModelSelectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selected, setSelected] = useState<ModelId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const project = aiFoundryService.getProject(id);
    if (!project) return;

    if (project.selectedModel) setSelected(project.selectedModel);

    const approach = project.selectedApproach || 'fine-tuning';
    aiFoundryService.getModelOptions(approach).then((opts) => {
      setModels(opts.sort((a, b) => b.fitScore - a.fitScore));
      const recommended = opts.find((o) => o.recommended);
      if (recommended && !project.selectedModel) {
        setSelected(recommended.id);
      }
      setLoading(false);
    });
  }, [id]);

  const handleContinue = async () => {
    if (!id || !selected) return;
    await aiFoundryService.selectModel(id, selected);
    navigate(`/projects/${id}/data`);
  };

  const recommended = models.find((m) => m.recommended);

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Choose your foundation model</h1>
        <p className="text-muted-foreground mt-1">
          We've ranked models by fit for your use case. You can choose any model.
        </p>
      </div>

      {recommended && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40 shrink-0">
              <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                We recommend <span className="text-emerald-600 dark:text-emerald-400">{recommended.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {recommended.fitScore}% fit · {recommended.capabilities.slice(0, 2).join(' · ')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {models.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            selected={selected === model.id}
            onSelect={() => setSelected(model.id)}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button size="lg" onClick={handleContinue} disabled={!selected}>
          Use {selected ? models.find((m) => m.id === selected)?.name : 'this model'}
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
