import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../store/AuthContext';
import { cn } from '../../lib/utils';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/console');
    } catch {
      setError('Invalid credentials. Try demo login instead.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    await demoLogin();
    navigate('/console');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-muted/30 border-r border-border flex-col p-10 justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Zap size={14} className="text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">Deeployment.AI</span>
        </Link>

        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground leading-tight">
              Build AI for<br />your problem.
            </h2>
            <p className="text-muted-foreground mt-3 text-base">
              From proprietary data to production AI — without needing an AI engineering team.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Credit Risk AI', status: 'Production', health: '86/100', acc: '91.4%' },
              { label: 'Customer Support AI', status: 'Training', progress: '68%' },
              { label: 'Student Risk Predictor', status: 'Draft' },
            ].map((p) => (
              <div key={p.label} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-foreground">{p.label}</div>
                  {'health' in p && <div className="text-xs text-muted-foreground mt-0.5">Health: {p.health} · Accuracy: {p.acc}</div>}
                  {'progress' in p && <div className="text-xs text-muted-foreground mt-0.5">Training in progress · {p.progress}</div>}
                  {p.status === 'Draft' && <div className="text-xs text-muted-foreground mt-0.5">Not yet started</div>}
                </div>
                <span className={cn(
                  'text-xs px-2 py-1 rounded-full font-medium border',
                  p.status === 'Production' && 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/50',
                  p.status === 'Training' && 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-800/50',
                  p.status === 'Draft' && 'text-muted-foreground bg-muted border-border',
                )}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          © 2026 Deeployment.AI. All rights reserved.
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6 animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <Zap size={14} className="text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm">Deeployment.AI</span>
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your account to continue.</p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleDemo}
            loading={demoLoading}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary">
              <Zap size={11} className="text-primary-foreground" />
            </div>
            Continue with Demo Account
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm pr-10 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Sign in
              <ArrowRight size={14} />
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
