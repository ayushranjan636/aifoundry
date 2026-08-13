import React, { useState, useEffect } from 'react';
import { ArrowRight, X, Zap, FolderOpen, BrainCircuit, Database, Rocket, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { cn } from '../../lib/utils';

const TOUR_STEPS = [
  {
    id: 'welcome',
    icon: <Zap size={28} className="text-primary" />,
    title: 'Welcome to Deeployment.AI',
    body: 'Build AI for your specific problem — not someone else\'s. This quick tour shows you how to get from idea to a live API in minutes.',
    highlight: null,
    cta: 'Start tour',
  },
  {
    id: 'projects',
    icon: <FolderOpen size={28} className="text-primary" />,
    title: 'Start with a project',
    body: 'Each AI you build lives in a project. Click "New project" → describe what you want your AI to do in plain English. No ML jargon required.',
    highlight: 'Projects in the sidebar',
    cta: 'Next',
  },
  {
    id: 'build',
    icon: <BrainCircuit size={28} className="text-primary" />,
    title: 'Foundry architects it for you',
    body: 'After describing your AI, Foundry analyzes your use case, scores every architecture approach, recommends the best foundation model, and creates a build plan.',
    highlight: 'Architecture → Model → Data',
    cta: 'Next',
  },
  {
    id: 'data',
    icon: <Database size={28} className="text-primary" />,
    title: 'Upload your dataset',
    body: 'Drag & drop a CSV, JSON, or JSONL file. Foundry analyses quality, identifies class imbalance, flags missing values, and gives your data a Readiness Score.',
    highlight: 'Dataset analysis step',
    cta: 'Next',
  },
  {
    id: 'deploy',
    icon: <Rocket size={28} className="text-primary" />,
    title: 'Deploy and integrate',
    body: 'One click to build your model. Once built, you get a live REST API with token-based authentication, a Testing Lab, and full analytics — all here in the console.',
    highlight: 'Deploy → API tab',
    cta: 'Let\'s build',
  },
];

const TOUR_KEY = 'deeployment_tour_done';

export function useOnboardingTour() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      setTimeout(() => setShow(true), 600);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(TOUR_KEY, '1');
  };

  return { show, dismiss };
}

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
      navigate('/projects/new');
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Progress dots */}
        <div className="flex items-center gap-1.5 px-5 pt-4">
          {TOUR_STEPS.map((_, i) => (
            <div key={i} className={cn(
              'h-1 rounded-full transition-all duration-300',
              i === step ? 'bg-primary w-6' : i < step ? 'bg-primary/40 w-3' : 'bg-muted w-3'
            )} />
          ))}
          <button onClick={onComplete} className="ml-auto text-muted-foreground hover:text-foreground">
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            {current.icon}
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
              {step + 1} of {TOUR_STEPS.length}
            </div>
            <h2 className="text-[20px] font-bold text-foreground">{current.title}</h2>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">{current.body}</p>
          </div>

          {current.highlight && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
              <CheckCircle2 size={13} className="text-primary shrink-0" />
              <span className="text-[12px] text-primary font-medium">{current.highlight}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <button
            onClick={onComplete}
            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour
          </button>
          <Button size="sm" onClick={handleNext}>
            {current.cta}
            <ArrowRight size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}
