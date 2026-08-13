import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LandingFooter } from '../../components/layout/LandingFooter';
import { cn } from '../../lib/utils';

const TEAM = [
  {
    name: 'Ayush Ranjan',
    initials: 'AR',
    role: 'Co-Founder & CEO',
    bio: 'Visionary behind Deeployment.AI. Ayush is obsessed with making AI accessible to builders who actually understand their domain — without requiring them to become ML engineers. He drives product strategy, partnerships, and the north star of making AI feel as natural as writing a sentence.',
    color: 'bg-primary/15 text-primary',
    borderColor: 'border-primary/30',
  },
  {
    name: 'Shubansh Gupta',
    initials: 'SG',
    role: 'Co-Founder & CTO',
    bio: 'The technical mind architecting every layer of Foundry. Shubansh designed the inference pipeline, the prompt generation engine, and the entire backend infrastructure. He believes great engineering is invisible — users should never have to think about what\'s running underneath.',
    color: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    borderColor: 'border-violet-300/30 dark:border-violet-800/30',
  },
  {
    name: 'Gati',
    initials: 'GA',
    role: 'ML Research Lead',
    bio: 'Gati brings rigorous ML research into the product. From dataset analysis algorithms to evaluation pipelines and confidence calibration, she ensures every model built on Foundry is genuinely good — not just numerically impressive on a leaderboard.',
    color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-300/30 dark:border-emerald-800/30',
  },
  {
    name: 'Sreenidhi',
    initials: 'SR',
    role: 'Head of Design & UX',
    bio: 'Sreenidhi is the reason Deeployment.AI feels approachable rather than intimidating. She designs every screen, interaction, and empty state with a single principle: the user should always know what to do next. Her work makes complex AI concepts feel obvious.',
    color: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
    borderColor: 'border-pink-300/30 dark:border-pink-800/30',
  },
  {
    name: 'Arvin Subramaniam',
    initials: 'AS',
    role: 'Senior Backend Engineer',
    bio: 'Arvin built the real-time API infrastructure, the SQLite-backed analytics engine, and the token-based authentication system. He has a gift for turning complex distributed systems requirements into clean, maintainable code that simply works at scale.',
    color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-300/30 dark:border-blue-800/30',
  },
  {
    name: 'Jaydev',
    initials: 'JD',
    role: 'Frontend Engineer',
    bio: 'Jaydev is responsible for the interactive moments in Foundry — the Testing Lab, the build storytelling, the command palette, and the real-time activity feed. He believes great frontend code should be as readable as the UI it produces.',
    color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-300/30 dark:border-amber-800/30',
  },
  {
    name: 'Sanjay Suman',
    initials: 'SS',
    role: 'ML Platform Engineer',
    bio: 'Sanjay connects the training pipeline to the product layer — translating model metrics into readable health scores, building evaluation frameworks, and ensuring the dataset analysis engine gives users actionable rather than confusing feedback.',
    color: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
    borderColor: 'border-teal-300/30 dark:border-teal-800/30',
  },
];

function Avatar({ name, initials, color, borderColor, size = 'lg' }: {
  name: string; initials: string; color: string; borderColor: string; size?: 'sm' | 'lg';
}) {
  return (
    <div className={cn(
      'rounded-2xl border-2 flex items-center justify-center font-bold select-none',
      color, borderColor,
      size === 'lg' ? 'h-20 w-20 text-[26px]' : 'h-10 w-10 text-[13px]',
    )}>
      {initials}
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Floating nav */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4">
        <div className="rounded-2xl border border-white/10 dark:border-white/8 bg-white/70 dark:bg-[hsl(222,20%,7%)]/75 backdrop-blur-xl shadow-lg shadow-black/5 px-5 h-[52px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/Deployment-ai.jpeg" alt="Deeployment.AI" className="h-6 w-auto rounded" />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/how-it-works" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors hidden sm:block">How it works</Link>
            <Link to="/capabilities" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Capabilities</Link>
            <Link to="/signup"><Button size="sm">Get started</Button></Link>
          </div>
        </div>
      </header>

      <div className="pt-28 pb-20 max-w-5xl mx-auto px-5">

        {/* Mission */}
        <div className="text-center mb-20 space-y-5">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Our mission</div>
          <h1 className="text-[52px] md:text-[72px] font-bold tracking-tight text-foreground leading-[1.03]">
            AI should be built<br />
            <span className="text-muted-foreground/60">by domain experts,</span><br />
            not just ML engineers.
          </h1>
          <p className="text-[17px] text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We built Deeployment.AI because the most valuable AI isn't made from generic models — it's made from your data, your rules, and your deep understanding of your own problem. We remove every technical barrier between that knowledge and a production system.
          </p>
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-3 gap-4 mb-24">
          {[
            { title: 'Explain everything', body: 'Every recommendation, every metric, every stage of training — explained in plain language. Users should never feel lost.' },
            { title: 'Build for trust', body: 'We don\'t hide the complexity. We translate it. Users can override any recommendation and see exactly why we made it.' },
            { title: 'Real, not simulated', body: 'When you test your model, it actually runs inference. When we score an architecture, we analyze your use case. Nothing is theater.' },
          ].map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-card p-6">
              <div className="text-[16px] font-bold text-foreground mb-2">{v.title}</div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>

        {/* Team header */}
        <div className="mb-12">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">The team</div>
          <h2 className="text-[40px] md:text-[52px] font-bold text-foreground leading-tight">
            Seven people.<br />One obsession.
          </h2>
          <p className="text-[16px] text-muted-foreground mt-3 max-w-xl">
            We came together because we believed that the hardest part of AI shouldn't be the infrastructure.
          </p>
        </div>

        {/* Team grid */}
        <div className="grid md:grid-cols-2 gap-5 mb-24">
          {TEAM.map((member, i) => (
            <div
              key={member.name}
              className={cn(
                'rounded-2xl border border-border bg-card p-7 hover:border-primary/25 transition-all duration-200 animate-fade-in',
                `stagger-${Math.min(i + 1, 5)}`,
                // First card (CEO) gets full width on first row
                i === 0 && 'md:col-span-2',
              )}
            >
              <div className={cn('flex gap-5 items-start', i === 0 ? 'flex-col sm:flex-row' : 'flex-row')}>
                <Avatar
                  name={member.name}
                  initials={member.initials}
                  color={member.color}
                  borderColor={member.borderColor}
                  size={i === 0 ? 'lg' : 'lg'}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <h3 className={cn(
                        'font-bold text-foreground',
                        i === 0 ? 'text-[28px] md:text-[34px]' : 'text-[20px] md:text-[24px]'
                      )}>
                        {member.name}
                      </h3>
                      <div className={cn(
                        'font-semibold mt-0.5',
                        i === 0 ? 'text-[15px] text-primary' : 'text-[13px] text-muted-foreground'
                      )}>
                        {member.role}
                      </div>
                    </div>
                  </div>
                  <p className={cn(
                    'text-muted-foreground leading-relaxed mt-3',
                    i === 0 ? 'text-[15px]' : 'text-[13px]'
                  )}>
                    {member.bio}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-4">
          <div className="flex justify-center -space-x-3 mb-4">
            {TEAM.map((m) => (
              <div
                key={m.name}
                className={cn(
                  'h-10 w-10 rounded-full border-2 border-background flex items-center justify-center text-[11px] font-bold',
                  m.color,
                )}
              >
                {m.initials}
              </div>
            ))}
          </div>
          <h3 className="text-[28px] font-bold text-foreground">Built with care, shipped with purpose.</h3>
          <p className="text-muted-foreground text-[15px] max-w-md mx-auto">
            Try what we built. We'd love to know if it helps.
          </p>
          <Link to="/signup">
            <Button size="lg" className="mt-2">
              Start building <ArrowRight size={15} />
            </Button>
          </Link>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
