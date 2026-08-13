import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap, ArrowRight, CheckCircle2, Database, BrainCircuit,
  FlaskConical, Rocket, RefreshCw, Activity, Shield, Code2,
  Moon, Sun, ChevronRight, Star, Play, Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { LandingFooter } from '../components/layout/LandingFooter';
import { cn } from '../lib/utils';

const HOW_IT_WORKS = [
  { step: '01', title: 'Describe your AI', body: 'Tell Foundry what you want in plain English. No ML knowledge required.' },
  { step: '02', title: 'Add your data', body: 'Upload your dataset. We analyze quality, balance, and coverage — then tell you what\'s missing.' },
  { step: '03', title: 'Foundry architects it', body: 'We score every architecture approach and recommend the best fit for your problem.' },
  { step: '04', title: 'Build & evaluate', body: 'Model training, evaluation, and health reporting — automated and explained.' },
  { step: '05', title: 'Deploy & iterate', body: 'One-click production deployment. Add data, create new versions, track improvements.' },
];

const CAPABILITIES = [
  { icon: <BrainCircuit size={16} />, title: 'Architecture selection', body: 'Prompting, RAG, fine-tuning, or SLM — scored and explained for your use case.' },
  { icon: <Database size={16} />, title: 'Dataset analysis', body: 'Automatic data profiling, readiness scoring, class balance, and gap detection.' },
  { icon: <Zap size={16} />, title: 'Real model training', body: 'Foundry generates a specialized model tailored to your domain, requirements, and constraints.' },
  { icon: <FlaskConical size={16} />, title: 'Testing lab', body: 'Interactive test cases with live inference, confidence scores, and factor explanations.' },
  { icon: <Activity size={16} />, title: 'Model health', body: 'Accuracy, precision, recall, F1 — tracked across every version.' },
  { icon: <Rocket size={16} />, title: 'Production API', body: 'REST endpoint ready in seconds. We handle infrastructure and scaling.' },
  { icon: <RefreshCw size={16} />, title: 'Continuous improvement', body: 'Add data, retrain, compare versions. Full improvement lifecycle.' },
  { icon: <Shield size={16} />, title: 'Your data stays yours', body: 'Models trained on your data, deployed to your endpoint.' },
];

const TRUST_STATS = [
  { value: '94%', label: 'Avg. model accuracy', sub: 'across deployed models' },
  { value: '<500ms', label: 'Inference latency', sub: 'production average' },
  { value: '2–4 hrs', label: 'Build time', sub: 'not months' },
  { value: '95%', label: 'Cost savings', sub: 'vs traditional ML teams' },
];

const TESTIMONIALS = [
  { name: 'Priya M.', role: 'CTO, FinServ Startup', text: 'We replaced a 4-person ML team with Foundry. Our credit risk model was live in 3 hours.', rating: 5 },
  { name: 'James R.', role: 'VP Engineering, EdTech', text: 'The architecture recommendations alone saved us months of trial and error. 91% accuracy on first deploy.', rating: 5 },
  { name: 'Sarah K.', role: 'Head of Data, SaaS', text: 'Finally, a tool that lets product teams ship AI features without waiting for data science bandwidth.', rating: 5 },
];

const COMPANY_LOGOS = ['TechCorp', 'DataFlow', 'CloudScale', 'NexGen AI', 'FinanceHub'];

function ConsoleMockup() {
  return (
    <div className="rounded-2xl border border-border shadow-2xl overflow-hidden bg-card text-left">
      <div className="h-8 flex items-center px-3 gap-1.5 border-b border-border bg-muted/40">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <div className="flex-1 mx-3 h-4 rounded bg-background border border-border flex items-center px-2">
          <span className="text-[9px] text-muted-foreground">app.deeployment.ai/console</span>
        </div>
      </div>
      <div className="flex h-56">
        {/* Sidebar */}
        <div className="w-32 border-r border-border bg-muted/20 p-2 space-y-1">
          <div className="flex items-center gap-1.5 px-2 py-1.5 mb-2">
            <img src="/Deployment-ai.jpeg" alt="Deeployment.AI" className="h-4 w-auto rounded" />
          </div>
          {['Overview', 'Projects', 'Models', 'Deployments'].map((item, i) => (
            <div key={item} className={cn(
              'h-5 rounded flex items-center px-2 text-[9px]',
              i === 0 ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'
            )}>
              {item}
            </div>
          ))}
        </div>
        {/* Main */}
        <div className="flex-1 p-3 space-y-2.5 overflow-hidden">
          <div className="text-[11px] font-bold text-foreground">Good evening, Ayush.</div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-1.5">
            {[['3', 'Active Models'], ['2.8K', 'API Calls'], ['88', 'Avg Health']].map(([val, lbl]) => (
              <div key={lbl} className="rounded-lg border border-border bg-background p-1.5">
                <div className="text-[8px] text-muted-foreground">{lbl}</div>
                <div className="text-[11px] font-bold text-foreground">{val}</div>
              </div>
            ))}
          </div>
          {/* Projects */}
          <div className="space-y-1">
            {[
              { n: 'Credit Risk AI', s: 'Production', c: 'emerald', acc: '91.4%' },
              { n: 'Support AI', s: 'Training 68%', c: 'blue' },
              { n: 'Student Risk', s: 'Draft', c: 'muted' },
            ].map((p) => (
              <div key={p.n} className="flex items-center justify-between rounded-md border border-border bg-background px-2 py-1">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0',
                    p.c === 'emerald' && 'bg-emerald-500',
                    p.c === 'blue' && 'bg-blue-500',
                    p.c === 'muted' && 'bg-muted-foreground/40',
                  )} />
                  <span className="text-[9px] font-medium text-foreground">{p.n}</span>
                </div>
                <span className={cn(
                  'text-[8px] px-1.5 py-0.5 rounded-full font-medium border',
                  p.c === 'emerald' && 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/50',
                  p.c === 'blue' && 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-800/50',
                  p.c === 'muted' && 'text-muted-foreground bg-muted border-border',
                )}>
                  {p.s}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDark((d) => !d);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Nav ───────────────────────────────────────────── */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4">
        <div className="rounded-2xl border border-white/10 dark:border-white/8 bg-white/70 dark:bg-[hsl(222,20%,7%)]/75 backdrop-blur-xl shadow-lg shadow-black/5 px-5 h-[52px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/Deployment-ai.jpeg" alt="Deeployment.AI" className="h-6 w-auto rounded" />
          </div>
          <nav className="hidden md:flex items-center gap-5 text-[13px] text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#capabilities" className="hover:text-foreground transition-colors">Capabilities</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDark}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="hidden sm:flex">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="shadow-sm">Start free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 pt-28 pb-14 md:pt-36 md:pb-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 border border-emerald-200 dark:border-emerald-800/50 rounded-full px-3 py-1 text-[11px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="font-semibold">Free tier available</span> — Build your first model today
            </div>
            <div className="space-y-1">
              <h1 className="text-[42px] md:text-[52px] font-bold tracking-tight text-foreground leading-[1.08]">
                Build AI for<br />your problem.
              </h1>
              <h2 className="text-[42px] md:text-[52px] font-bold tracking-tight text-muted-foreground/70 leading-[1.08]">
                No ML team needed.
              </h2>
            </div>
            <p className="text-[15px] text-muted-foreground leading-relaxed max-w-md">
              Eliminate the need for data cleaners, architecture designers, trainers, and testers. Describe what you want, and our AI recommends the best model and approach — then builds it for you.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Button size="lg" onClick={() => navigate('/signup')} className="shadow-sm group relative overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  Start building — it's free
                  <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Button>
              <Button variant="ghost" size="lg" onClick={() => navigate('/login')} className="group">
                <Play size={14} className="group-hover:scale-110 transition-transform" />
                Watch demo
              </Button>
            </div>
            <div className="flex items-center gap-5 flex-wrap text-[12px] text-muted-foreground pt-1">
              {['No credit card required', 'Deploy in hours, not months', 'Save 95% vs ML teams'].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  {t}
                </div>
              ))}
            </div>
            {/* Social proof inline */}
            <div className="flex items-center gap-3 pt-2 border-t border-border/50">
              <div className="flex -space-x-2">
                {['A', 'R', 'S', 'M', 'K'].map((letter, i) => (
                  <div key={i} className="h-7 w-7 rounded-full border-2 border-background bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-[10px] font-bold text-white">
                    {letter}
                  </div>
                ))}
              </div>
              <div className="text-[12px]">
                <span className="font-semibold text-foreground">500+</span>
                <span className="text-muted-foreground"> teams building with Foundry</span>
              </div>
            </div>
          </div>
          <div className="relative animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="absolute -inset-8 bg-gradient-to-tr from-primary/8 via-transparent to-transparent rounded-3xl blur-3xl pointer-events-none" />
            <div className="relative">
              <ConsoleMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust stats ────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/20">
        <div className="max-w-6xl mx-auto px-5 py-8">
          {/* Logo bar */}
          <div className="flex items-center justify-center gap-8 mb-6 opacity-50">
            {COMPANY_LOGOS.map((name) => (
              <span key={name} className="text-[13px] font-semibold text-muted-foreground tracking-wide">{name}</span>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-border">
            {TRUST_STATS.map((s) => (
              <div key={s.label} className="text-center px-4">
                <div className="text-[28px] font-bold text-foreground tabular">{s.value}</div>
                <div className="text-[12px] font-medium text-foreground mt-0.5">{s.label}</div>
                <div className="text-[11px] text-muted-foreground">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="mb-12">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">How it works</div>
            <h2 className="text-[30px] font-bold text-foreground">From idea to production AI</h2>
            <p className="text-muted-foreground mt-1.5 text-[14px] max-w-lg">
              You bring the problem and the data. Foundry handles every engineering decision.
            </p>
          </div>
          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-3.5 left-[calc(10%+12px)] right-[calc(10%+12px)] h-px bg-border" />
            <div className="grid md:grid-cols-5 gap-6">
              {HOW_IT_WORKS.map((item, i) => (
                <div key={item.step} className={cn('relative animate-fade-in', `stagger-${i + 1}`)}>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full border-2 border-primary/30 bg-background flex items-center justify-center text-[10px] font-bold text-primary relative z-10">
                        {i + 1}
                      </div>
                    </div>
                    <div className="text-[13px] font-semibold text-foreground">{item.title}</div>
                    <div className="text-[12px] text-muted-foreground leading-relaxed">{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Positioning ────────────────────────────────────── */}
      <section className="py-20 border-y border-border overflow-hidden relative">
        {/* Subtle radial glow behind */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto px-5">
          {/* Top label */}
          <div className="text-center mb-12">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">The formula</div>
            <h2 className="text-[28px] md:text-[34px] font-bold text-foreground">From raw inputs to production AI</h2>
          </div>

          {/* Flow cards */}
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-0">

            {/* Input pills */}
            <div className="flex flex-col gap-2 w-full md:w-auto md:min-w-[200px]">
              {[
                { label: 'Your data', color: 'border-blue-200 dark:border-blue-800/50 bg-blue-50/60 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400' },
                { label: 'Your objective', color: 'border-violet-200 dark:border-violet-800/50 bg-violet-50/60 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400' },
                { label: 'Your constraints', color: 'border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/60 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400' },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 ${item.color} animate-fade-in stagger-${i + 1}`}
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-current opacity-70 shrink-0" />
                  <span className="text-[13px] font-semibold">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Arrow connector */}
            <div className="flex md:flex-col items-center gap-1 px-4 py-2 md:py-0">
              <div className="flex-1 md:flex-none h-px md:h-8 md:w-px bg-border" />
              <div className="h-8 w-8 rounded-full border border-border bg-background flex items-center justify-center shadow-sm shrink-0">
                <ArrowRight size={14} className="text-muted-foreground md:rotate-90" />
              </div>
              <div className="flex-1 md:flex-none h-px md:h-8 md:w-px bg-border" />
            </div>

            {/* Foundry engine */}
            <div className="w-full md:w-auto animate-fade-in stagger-3">
              <div className="relative rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 text-center shadow-lg shadow-primary/10 overflow-hidden">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent pointer-events-none rounded-2xl" />
                <div className="relative">
                  <div className="mx-auto mb-3 w-fit">
                    <img src="/Deployment-ai.jpeg" alt="Deeployment.AI" className="h-10 w-auto rounded-xl shadow-md shadow-primary/30" />
                  </div>
                  <div className="text-[18px] font-bold text-foreground">Deeployment.AI</div>
                  <div className="text-[11px] text-muted-foreground mt-1">Architecture · Training · Evaluation</div>
                </div>
              </div>
            </div>

            {/* Arrow connector */}
            <div className="flex md:flex-col items-center gap-1 px-4 py-2 md:py-0">
              <div className="flex-1 md:flex-none h-px md:h-8 md:w-px bg-border" />
              <div className="h-8 w-8 rounded-full border border-border bg-background flex items-center justify-center shadow-sm shrink-0">
                <ArrowRight size={14} className="text-muted-foreground md:rotate-90" />
              </div>
              <div className="flex-1 md:flex-none h-px md:h-8 md:w-px bg-border" />
            </div>

            {/* Output */}
            <div className="flex flex-col gap-2 w-full md:w-auto md:min-w-[200px] animate-fade-in stagger-4">
              {[
                { label: 'Production AI', sub: 'Custom-trained model', color: 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' },
                { label: 'Live REST API', sub: 'Token-authenticated endpoint', color: 'border-teal-200 dark:border-teal-800/50 bg-teal-50/60 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400' },
                { label: 'Full analytics', sub: 'Usage, health, versions', color: 'border-cyan-200 dark:border-cyan-800/50 bg-cyan-50/60 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400' },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className={`rounded-xl border px-4 py-3 ${item.color} animate-fade-in stagger-${i + 4}`}
                >
                  <div className="text-[13px] font-semibold">{item.label}</div>
                  <div className="text-[11px] opacity-70 mt-0.5">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom tagline */}
          <p className="text-center text-[14px] text-muted-foreground mt-10 max-w-md mx-auto">
            From proprietary data to a live API — without needing an AI engineering team.
          </p>
        </div>
      </section>

      {/* ── Capabilities ──────────────────────────────────── */}
      <section id="capabilities" className="py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="mb-10">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Capabilities</div>
            <h2 className="text-[30px] font-bold text-foreground">What Foundry handles for you</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {CAPABILITIES.map((cap, i) => (
              <div
                key={cap.title}
                className={cn(
                  'rounded-xl border border-border bg-card p-4 space-y-2 hover:border-primary/30 transition-colors duration-200 animate-fade-in',
                  `stagger-${Math.min(i + 1, 5)}`
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {cap.icon}
                </div>
                <div className="text-[13px] font-semibold text-foreground">{cap.title}</div>
                <div className="text-[12px] text-muted-foreground leading-relaxed">{cap.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Loved by teams</div>
            <h2 className="text-[30px] font-bold text-foreground">What builders say about Foundry</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className={cn(
                  'rounded-2xl border border-border bg-card p-6 space-y-4 hover:border-primary/20 hover:shadow-md transition-all duration-300 animate-fade-in',
                  `stagger-${i + 1}`
                )}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-[14px] text-foreground leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-[11px] font-bold text-white">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-foreground">{t.name}</div>
                    <div className="text-[11px] text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing anchor ─────────────────────────────────── */}
      <section id="pricing" className="py-20 border-t border-border bg-muted/10">
        <div className="max-w-4xl mx-auto px-5">
          <div className="text-center mb-10">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Simple pricing</div>
            <h2 className="text-[30px] font-bold text-foreground">Start free, scale when ready</h2>
            <p className="text-[14px] text-muted-foreground mt-2 max-w-md mx-auto">
              No surprise bills. The free tier includes everything you need to build and test your first AI model.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {/* Free tier */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
              <div>
                <div className="text-[13px] font-semibold text-muted-foreground">Starter</div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-[36px] font-bold text-foreground">$0</span>
                  <span className="text-[13px] text-muted-foreground">/month</span>
                </div>
              </div>
              <ul className="space-y-2.5">
                {['1 AI model', '100 API calls/day', 'Community support', 'Basic analytics'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" onClick={() => navigate('/signup')}>
                Get started free
              </Button>
            </div>
            {/* Pro tier - highlighted */}
            <div className="rounded-2xl border-2 border-primary bg-card p-6 space-y-5 relative shadow-lg shadow-primary/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold">
                Most popular
              </div>
              <div>
                <div className="text-[13px] font-semibold text-primary">Pro</div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-[36px] font-bold text-foreground">$49</span>
                  <span className="text-[13px] text-muted-foreground">/month</span>
                </div>
              </div>
              <ul className="space-y-2.5">
                {['10 AI models', '10K API calls/day', 'Priority support', 'Advanced analytics', 'Custom domains', 'Team collaboration'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-foreground">
                    <CheckCircle2 size={14} className="text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => navigate('/signup')}>
                Start free trial
                <ArrowRight size={14} />
              </Button>
            </div>
            {/* Enterprise */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
              <div>
                <div className="text-[13px] font-semibold text-muted-foreground">Enterprise</div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-[36px] font-bold text-foreground">Custom</span>
                </div>
              </div>
              <ul className="space-y-2.5">
                {['Unlimited models', 'Unlimited API calls', 'Dedicated support', 'Custom SLAs', 'On-premise option', 'SSO & RBAC'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" onClick={() => navigate('/signup')}>
                Contact sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-2xl mx-auto px-5 text-center space-y-5 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 text-[11px] font-semibold">
            <Sparkles size={12} />
            Limited: Free tier includes full model training
          </div>
          <h2 className="text-[30px] md:text-[36px] font-bold text-foreground">
            Ready to build your AI?
          </h2>
          <p className="text-muted-foreground text-[15px] max-w-md mx-auto">
            Join 500+ teams who've shipped production AI in hours, not months. Start with the free tier — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/signup')} className="shadow-md shadow-primary/20 group">
              <span className="flex items-center gap-2">
                Start building — it's free
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
              Explore demo
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 pt-4 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> No credit card</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> Free forever tier</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <LandingFooter />
    </div>
  );
}
