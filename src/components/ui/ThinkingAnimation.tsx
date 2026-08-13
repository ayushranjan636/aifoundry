import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface ThinkingStep {
  label: string;
  done: boolean;
}

interface ThinkingAnimationProps {
  steps: string[];
  title?: string;
  className?: string;
}

export function ThinkingAnimation({ steps, title = 'Analyzing…', className }: ThinkingAnimationProps) {
  const [completedSteps, setCompletedSteps] = useState<number>(0);
  const [currentDots, setCurrentDots] = useState('');

  useEffect(() => {
    // Advance steps progressively
    const totalMs = 2000; // complete all steps over 2s for visual effect
    const stepMs = totalMs / steps.length;

    steps.forEach((_, i) => {
      setTimeout(() => {
        setCompletedSteps(i + 1);
      }, stepMs * (i + 1));
    });

    // Animated dots
    const dotsInterval = setInterval(() => {
      setCurrentDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);

    return () => clearInterval(dotsInterval);
  }, [steps.length]);

  const activeStep = completedSteps < steps.length ? steps[completedSteps] : null;

  return (
    <div className={cn('rounded-2xl border border-border bg-card p-6 space-y-5', className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        {/* Pulsing brain icon */}
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
          <div className="absolute inset-0 rounded-xl bg-primary/10 animate-ping opacity-40" />
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary relative z-10" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
          </svg>
        </div>
        <div>
          <div className="text-[14px] font-semibold text-foreground">
            {activeStep ? `${activeStep}${currentDots}` : title}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Deeployment.AI is processing your request</div>
        </div>
      </div>

      {/* Step checklist */}
      <div className="space-y-2">
        {steps.map((step, i) => {
          const isDone = i < completedSteps;
          const isActive = i === completedSteps;
          return (
            <div key={step} className={cn(
              'flex items-center gap-2.5 text-[12px] transition-all duration-300',
              isDone && 'text-muted-foreground',
              isActive && 'text-foreground font-medium',
              !isDone && !isActive && 'text-muted-foreground/40',
            )}>
              {isDone ? (
                <div className="h-4 w-4 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-emerald-500"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={1.8} fill="none" strokeLinecap="round" /></svg>
                </div>
              ) : isActive ? (
                <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border border-muted-foreground/20 shrink-0" />
              )}
              {step}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
          style={{ width: `${(completedSteps / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
