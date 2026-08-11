import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { aiFoundryService } from '../../services/aiFoundryService';
import { hasOpenAIKey } from '../../config/apiConfig';
import { cn } from '../../lib/utils';
import type { ArchitectureOption, ApproachType } from '../../types';

function FitBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700',
            score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-muted-foreground/40'
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-medium text-foreground w-8 text-right">{score}%</span>
    </div>
  );
}

function ApproachCard({
  option,
  selected,
  onSelect,
  highlighted,
}: {
  option: ArchitectureOption;
  selected: boolean;
  onSelect: () => void;
  highlighted: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all duration-200 cursor-pointer',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-card hover:border-primary/30',
        highlighted && !selected && 'ring-2 ring-primary/20'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{option.name}</span>
            {option.recommended && <Badge variant="default">Recommended</Badge>}
            {selected && (
              <span className="flex items-center gap-1 text-xs text-primary font-medium">
                <CheckCircle size={12} />
                Selected
              </span>
            )}
          </div>
          <div className="mt-2">
            <FitBar score={option.fitScore} />
          </div>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{option.description}</p>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((x) => !x);
        }}
        className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Less detail' : 'More detail'}
      </button>

      {expanded && (
        <div className="mt-3 grid sm:grid-cols-3 gap-3 border-t border-border pt-3 animate-fade-in">
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Best for</div>
            <ul className="space-y-1">
              {option.bestFor.map((item) => (
                <li key={item} className="text-xs text-foreground flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Advantages</div>
            <ul className="space-y-1">
              {option.advantages.map((item) => (
                <li key={item} className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-emerald-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Limitations</div>
            <ul className="space-y-1">
              {option.limitations.map((item) => (
                <li key={item} className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-amber-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export function ArchitecturePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [options, setOptions] = useState<ArchitectureOption[]>([]);
  const [selected, setSelected] = useState<ApproachType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const project = aiFoundryService.getProject(id);
    if (!project) return;

    if (project.selectedApproach) setSelected(project.selectedApproach);

    aiFoundryService.analyzeUseCase(
      id,
      project.objective || '',
      project.inputFormats,
      project.outputFormats,
      project.constraints
    ).then((opts) => {
      setOptions(opts.sort((a, b) => b.fitScore - a.fitScore));
      const recommended = opts.find((o) => o.recommended);
      if (recommended && !project.selectedApproach) {
        setSelected(recommended.id);
      }
      setLoading(false);
    });
  }, [id]);

  const recommended = options.find((o) => o.recommended);

  const handleContinue = async () => {
    if (!id || !selected) return;
    await aiFoundryService.selectApproach(id, selected);
    navigate(`/projects/${id}/model-select`);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="space-y-1">
          <div className="h-7 w-64 skeleton" />
          <div className="h-4 w-96 skeleton" />
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
            <span className="text-sm font-medium text-foreground">
              {hasOpenAIKey() ? 'Analyzing your use case…' : 'Analyzing your use case…'}
            </span>
          </div>
          <div className="space-y-2 ml-5">
            {['Evaluating problem type and domain', 'Scoring architecture approaches', 'Assessing data requirements', 'Generating recommendation'].map((step) => (
              <div key={step} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <div className="h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                {step}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className={`h-24 rounded-xl skeleton stagger-${i}`} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">We analyzed your use case.</h1>
        <p className="text-muted-foreground mt-1">
          Based on your description, here's what we recommend — and why.
        </p>
      </div>

      {recommended && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary shrink-0">
              <Info size={16} />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                We recommend <span className="text-primary">{recommended.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Based on your data characteristics and requirements, {recommended.name} is currently the strongest fit at{' '}
                <span className="font-medium text-foreground">{recommended.fitScore}% match</span>.
                You can override this recommendation below.
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Compare approaches</h2>
        <div className="space-y-3">
          {options.map((option) => (
            <ApproachCard
              key={option.id}
              option={option}
              selected={selected === option.id}
              onSelect={() => setSelected(option.id)}
              highlighted={option.recommended}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!selected}
        >
          Use this approach
          <ArrowRight size={16} />
        </Button>
        <span className="text-xs text-muted-foreground">
          {selected && options.find((o) => o.id === selected)?.name} selected
        </span>
      </div>
    </div>
  );
}
