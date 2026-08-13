import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Zap, BrainCircuit, Database, Rocket, RefreshCw, Activity, Shield, FlaskConical, BarChart3 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LandingFooter } from '../../components/layout/LandingFooter';
import { cn } from '../../lib/utils';

const STEPS = [
  {
    number: '01',
    title: 'Describe your AI',
    body: 'Tell Foundry what you want your AI to do in plain English. Describe inputs, outputs, and any constraints. You don\'t need to know the technical details — that\'s what we\'re here for.',
    icon: <BrainCircuit size={24} />,
    color: 'text-primary bg-primary/10',
    details: [
      'Plain-language problem description',
      'Select input types: text, tables, documents, images',
      'Define output format: prediction, score, classification, JSON',
      'Specify behavioral constraints and requirements',
    ],
  },
  {
    number: '02',
    title: 'Add your data',
    body: 'Upload your dataset in any common format — CSV, JSON, JSONL, PDF, or plain text. Foundry analyzes quality, class balance, missing values, and gives your data a Readiness Score with specific recommendations.',
    icon: <Database size={24} />,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400',
    details: [
      'Support for CSV, JSON, JSONL, PDF, TXT',
      'Automatic data quality analysis',
      'Dataset Readiness Score (0–100)',
      'Per-column coverage and balance checks',
      '"What if I ignore this?" impact analysis',
    ],
  },
  {
    number: '03',
    title: 'Foundry architects it',
    body: 'Our engine analyzes your use case and scores every architecture approach — fine-tuning, RAG, prompting, or SLM — based on your specific data, objective, and constraints. It recommends the best fit and explains why.',
    icon: <Zap size={24} />,
    color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/20 dark:text-violet-400',
    details: [
      'Scored architecture recommendations',
      'Foundation model selection (Qwen, Llama, Mistral, Gemma, DeepSeek)',
      'Fit score for each approach (0–100)',
      'Trade-off explanations for every option',
      'Override any recommendation at any time',
    ],
  },
  {
    number: '04',
    title: 'Build & evaluate',
    body: 'Foundry runs a complete training pipeline — data preprocessing, model fine-tuning, evaluation on held-out test data, and optimization. Every stage is explained in real time. You see accuracy, F1, loss, and per-class performance.',
    icon: <Activity size={24} />,
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400',
    details: [
      'Live build progress with storytelling stages',
      'Real-time training loss and accuracy metrics',
      'Automatic train/validation/test split',
      'Comprehensive evaluation report',
      'Model Health Score with interpretation',
    ],
  },
  {
    number: '05',
    title: 'Deploy & iterate',
    body: 'One click to a live production API with token-based authentication. Test your model in the interactive Testing Lab. Add new data, retrain, and compare versions. Foundry handles infrastructure, scaling, and monitoring.',
    icon: <Rocket size={24} />,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400',
    details: [
      'One-click deployment to managed endpoint',
      'Token-based API keys (OpenAI-compatible format)',
      'Interactive Testing Lab with live inference',
      'Version history and side-by-side comparison',
      'Full usage analytics and request logs',
    ],
  },
];

export function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4">
        <div className="rounded-2xl border border-white/10 dark:border-white/8 bg-white/70 dark:bg-[hsl(222,20%,7%)]/75 backdrop-blur-xl shadow-lg shadow-black/5 px-5 h-[52px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Zap size={13} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[14px] text-foreground tracking-tight">Deeployment.AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/about" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors hidden sm:block">About</Link>
            <Link to="/capabilities" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Capabilities</Link>
            <Link to="/signup"><Button size="sm">Get started</Button></Link>
          </div>
        </div>
      </header>

      <div className="pt-28 pb-20 max-w-4xl mx-auto px-5">
        {/* Hero */}
        <div className="text-center mb-20 space-y-4">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Process</div>
          <h1 className="text-[48px] md:text-[64px] font-bold tracking-tight text-foreground leading-[1.05]">
            How it works
          </h1>
          <p className="text-[17px] text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Five steps from idea to production AI. Everything is automated, explained, and reversible.
          </p>
        </div>

        {/* Steps */}
        <div className="relative space-y-4">
          {/* Vertical connector */}
          <div className="absolute left-[27px] top-16 bottom-0 w-px bg-gradient-to-b from-border via-border to-transparent hidden md:block" />

          {STEPS.map((step, i) => (
            <div key={step.number} className={cn('flex gap-6 animate-fade-in', `stagger-${Math.min(i + 1, 5)}`)}>
              {/* Step number */}
              <div className="shrink-0 hidden md:flex flex-col items-center">
                <div className={cn('h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm relative z-10', step.color)}>
                  {step.icon}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 rounded-2xl border border-border bg-card p-6 md:p-8 hover:border-primary/20 transition-colors">
                <div className="flex items-start gap-4 mb-4">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center md:hidden shrink-0', step.color)}>
                    {step.icon}
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{step.number}</div>
                    <h2 className="text-[22px] md:text-[26px] font-bold text-foreground">{step.title}</h2>
                  </div>
                </div>
                <p className="text-[15px] text-muted-foreground leading-relaxed mb-5">{step.body}</p>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {step.details.map((d) => (
                    <li key={d} className="flex items-center gap-2 text-[13px] text-foreground">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 rounded-2xl border border-border bg-card p-10 text-center space-y-4">
          <h3 className="text-[28px] font-bold text-foreground">Ready to start?</h3>
          <p className="text-muted-foreground text-[15px]">The entire process takes minutes for demo, hours in production.</p>
          <Link to="/signup">
            <Button size="lg" className="mt-2">
              Build your first AI <ArrowRight size={15} />
            </Button>
          </Link>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
