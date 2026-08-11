import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, Circle, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface WizardStep {
  id: string;
  label: string;
  href: string;
}

interface WizardProgressProps {
  steps: WizardStep[];
  projectId: string;
}

export function WizardProgress({ steps, projectId }: WizardProgressProps) {
  const location = useLocation();
  const currentIdx = steps.findIndex((s) => location.pathname === s.href.replace(':id', projectId));

  return (
    <div className="border-b border-border bg-muted/20 px-6 py-3 overflow-x-auto shrink-0">
      <div className="flex items-center gap-0 min-w-max">
        {steps.map((step, i) => {
          const href = step.href.replace(':id', projectId);
          const isActive = location.pathname === href;
          const isCompleted = i < currentIdx;
          const isPending = i > currentIdx;

          return (
            <React.Fragment key={step.id}>
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium',
                  isActive && 'text-primary',
                  isCompleted && 'text-muted-foreground',
                  isPending && 'text-muted-foreground/40'
                )}
              >
                <span className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold border',
                  isActive && 'border-primary bg-primary/10 text-primary',
                  isCompleted && 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                  isPending && 'border-muted-foreground/30 text-muted-foreground/50'
                )}>
                  {isCompleted ? '✓' : i + 1}
                </span>
                {step.label}
              </div>
              {i < steps.length - 1 && (
                <ChevronRight size={12} className="text-muted-foreground/30 mx-0.5" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
