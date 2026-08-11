import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, BrainCircuit, Database, FlaskConical, Rocket, RefreshCw,
  Activity, Shield, Code2, BarChart3, GitBranch, Key, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LandingFooter } from '../../components/layout/LandingFooter';
import { cn } from '../../lib/utils';

const CAPABILITIES = [
  {
    icon: <BrainCircuit size={22} />,
    title: 'Intelligent architecture selection',
    category: 'Foundation',
    color: 'text-primary bg-primary/10',
    body: 'Foundry scores four approaches — fine-tuning, RAG, prompting, and SLM — against your specific use case. Each score is explained with trade-offs and alternatives so you understand the recommendation.',
    features: ['Scored approach comparison', 'Fine-tuning vs RAG vs Prompting vs SLM', 'Trade-off explanations', 'User-overridable recommendations'],
  },
  {
    icon: <Zap size={22} />,
    title: 'Foundation model matching',
    category: 'Foundation',
    color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/20 dark:text-violet-400',
    body: 'Choose from Qwen, Llama, Mistral, Gemma, and DeepSeek — each scored by fit for your task, with cost, speed, and deployment complexity indicators.',
    features: ['6 foundation models', 'Fit score per model (0–100)', 'Cost / speed / complexity indicators', 'Per-use-case rankings'],
  },
  {
    icon: <Database size={22} />,
    title: 'Dataset analysis & readiness',
    category: 'Data',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400',
    body: 'Upload any CSV, JSON, or JSONL file. Foundry computes a Readiness Score from coverage, completeness, balance, consistency, and volume — then tells you exactly what to fix.',
    features: ['Readiness Score (0–100)', 'Class imbalance detection', 'Missing value analysis', '"Ignore this?" impact simulator'],
  },
  {
    icon: <Activity size={22} />,
    title: 'Automated training pipeline',
    category: 'Training',
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400',
    body: 'End-to-end training with real-time storytelling — each stage explains what\'s happening and why. Training loss, validation loss, accuracy, and F1 are tracked epoch by epoch.',
    features: ['Live stage-by-stage progress', 'Real-time loss & accuracy metrics', 'Automatic train/val/test split', 'Hyperparameter auto-selection'],
  },
  {
    icon: <FlaskConical size={22} />,
    title: 'Model health & evaluation',
    category: 'Evaluation',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400',
    body: 'Comprehensive health report: accuracy, precision, recall, F1, latency, and per-class performance. AI-generated interpretation tells you what the numbers mean in plain language.',
    features: ['Model Health Score (0–100)', 'Per-class precision/recall/F1', 'Confidence distribution chart', 'AI-generated improvement advice'],
  },
  {
    icon: <Shield size={22} />,
    title: 'Interactive testing lab',
    category: 'Testing',
    color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/20 dark:text-teal-400',
    body: 'Test your model with real inputs before deploying. Choose from normal cases, edge cases, and stress tests — or define custom inputs. Results include prediction, probability, confidence, and feature-level explanations.',
    features: ['Normal / edge / adversarial test cases', 'Live inference with real model', 'Feature explanation bars', 'Shareable testing links'],
  },
  {
    icon: <Rocket size={22} />,
    title: 'Production deployment',
    category: 'Deployment',
    color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400',
    body: 'One-click deployment to a managed REST endpoint. No infrastructure knowledge required. We handle scaling, monitoring, and uptime. Pause or resume your model anytime.',
    features: ['Managed REST endpoint', 'One-click deploy & pause', 'Uptime monitoring', 'Error rate tracking'],
  },
  {
    icon: <Key size={22} />,
    title: 'Token-based API keys',
    category: 'API',
    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400',
    body: 'Generate named API keys (Production, Dev, etc.) with per-key usage tracking. Reveal, copy, rotate, activate/deactivate, and revoke keys at any time.',
    features: ['Named key generation', 'Per-key request count', 'Active / inactive toggle', 'Instant revocation'],
  },
  {
    icon: <Code2 size={22} />,
    title: 'API playground',
    category: 'API',
    color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/20 dark:text-cyan-400',
    body: 'Interactive API explorer with live responses. Code samples in cURL, Python, JavaScript, and TypeScript. Copy your endpoint, run requests, and inspect structured JSON responses.',
    features: ['Live API execution', 'cURL / Python / JS / TS samples', 'Structured JSON responses', 'Latency measurement'],
  },
  {
    icon: <GitBranch size={22} />,
    title: 'Model versioning',
    category: 'Improvement',
    color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20 dark:text-orange-400',
    body: 'Every build creates a versioned model. Compare versions side by side with accuracy, F1, and dataset size charts. Track improvement from v1.0 to the latest.',
    features: ['Automatic version history', 'Side-by-side comparison chart', 'Accuracy/F1 improvement tracking', 'Dataset growth tracking'],
  },
  {
    icon: <RefreshCw size={22} />,
    title: 'Continuous improvement',
    category: 'Improvement',
    color: 'text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400',
    body: 'Upload new data, retrain, and deploy a better version. Foundry analyzes the delta, estimates improvement, and shows you before/after comparisons.',
    features: ['Add data anytime', 'One-click retrain', 'Expected improvement estimation', 'Rollback to previous version'],
  },
  {
    icon: <BarChart3 size={22} />,
    title: 'Usage analytics',
    category: 'Monitoring',
    color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/20 dark:text-pink-400',
    body: 'Full API request analytics — daily volume, success rate, error rate, latency trends — broken down by model and time range. Live activity feed on the dashboard.',
    features: ['Daily/weekly/monthly views', 'Request success rate', 'p95 latency tracking', 'Live activity feed'],
  },
];

const CATEGORIES = [...new Set(CAPABILITIES.map((c) => c.category))];

export function CapabilitiesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Floating nav */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4">
        <div className="rounded-2xl border border-white/10 dark:border-white/8 bg-white/70 dark:bg-[hsl(222,20%,7%)]/75 backdrop-blur-xl shadow-lg shadow-black/5 px-5 h-[52px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Zap size={13} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[14px] text-foreground tracking-tight">AI Foundry</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/how-it-works" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors hidden sm:block">How it works</Link>
            <Link to="/about" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors hidden sm:block">About</Link>
            <Link to="/signup"><Button size="sm">Get started</Button></Link>
          </div>
        </div>
      </header>

      <div className="pt-28 pb-20 max-w-6xl mx-auto px-5">
        {/* Hero */}
        <div className="text-center mb-16 space-y-4">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Platform</div>
          <h1 className="text-[48px] md:text-[64px] font-bold tracking-tight text-foreground leading-[1.05]">
            Capabilities
          </h1>
          <p className="text-[17px] text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Every layer of AI engineering — automated, explained, and integrated into one platform.
          </p>
        </div>

        {/* Categories */}
        {CATEGORIES.map((cat) => (
          <div key={cat} className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{cat}</div>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CAPABILITIES.filter((c) => c.category === cat).map((cap, i) => (
                <div
                  key={cap.title}
                  className={cn('rounded-2xl border border-border bg-card p-6 hover:border-primary/25 transition-all duration-200 animate-fade-in', `stagger-${i + 1}`)}
                >
                  <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl mb-4 shadow-sm', cap.color)}>
                    {cap.icon}
                  </div>
                  <h3 className="text-[16px] font-bold text-foreground mb-2">{cap.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">{cap.body}</p>
                  <ul className="space-y-1.5">
                    {cap.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-[12px] text-foreground/80">
                        <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-4">
          <h3 className="text-[28px] font-bold text-foreground">Everything you need. Nothing you don't.</h3>
          <p className="text-muted-foreground text-[15px] max-w-md mx-auto">Start free. Add your engine key to unlock full real-model inference.</p>
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
