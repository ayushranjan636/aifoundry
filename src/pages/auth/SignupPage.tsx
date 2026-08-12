import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, Eye, EyeOff, CheckCircle, Star, Shield, Clock, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../store/AuthContext';

export function SignupPage() {
  const navigate = useNavigate();
  const { signup, demoLogin } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate('/console');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    await demoLogin();
    navigate('/console');
  };

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — social proof */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary/5 via-muted/30 to-background border-r border-border flex-col p-10 justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Zap size={14} className="text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">AI Foundry</span>
        </Link>

        <div className="space-y-8">
          <div>
            <h2 className="text-[28px] font-bold text-foreground leading-tight">
              Join 500+ teams<br />shipping AI faster.
            </h2>
            <p className="text-muted-foreground mt-3 text-[14px] max-w-sm">
              From idea to production AI in hours. No ML experience needed.
            </p>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '94%', label: 'Avg accuracy' },
              { value: '2-4h', label: 'Time to deploy' },
              { value: '95%', label: 'Cost savings' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-3 rounded-xl bg-card border border-border">
                <div className="text-[20px] font-bold text-primary">{stat.value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-[13px] text-foreground leading-relaxed">
              "We replaced a 4-person ML team with Foundry. Our credit risk model was live in 3 hours with 91% accuracy."
            </p>
            <div className="flex items-center gap-2 pt-1">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-[10px] font-bold text-white">P</div>
              <div>
                <div className="text-[12px] font-semibold text-foreground">Priya M.</div>
                <div className="text-[11px] text-muted-foreground">CTO, FinServ Startup</div>
              </div>
            </div>
          </div>

          {/* Trust signals */}
          <div className="flex items-center gap-4 flex-wrap">
            {[
              { icon: <Shield size={12} />, text: 'SOC 2 compliant' },
              { icon: <Clock size={12} />, text: 'Setup in 2 min' },
              { icon: <Users size={12} />, text: '500+ teams' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="text-primary">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          © 2026 AI Foundry. All rights reserved.
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6 animate-fade-in">
          <div className="lg:hidden">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <Zap size={14} className="text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm">AI Foundry</span>
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Create your free account</h1>
            <p className="text-muted-foreground text-sm mt-1">No credit card required. Start building in 2 minutes.</p>
          </div>

          <Button
            variant="outline"
            className="w-full h-11 text-[13px] font-medium"
            onClick={handleDemo}
            loading={demoLoading}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary">
              <Zap size={11} className="text-primary-foreground" />
            </div>
            Try instantly with Demo Account
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or create your account</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              placeholder="Ayush Ranjan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            <Input
              label="Work email"
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
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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
              {password && (
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        passwordStrength >= level
                          ? level === 1 ? 'bg-red-400' : level === 2 ? 'bg-amber-400' : 'bg-emerald-400'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11" loading={loading}>
              Create free account
              <ArrowRight size={14} />
            </Button>
          </form>

          <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle size={11} className="text-emerald-500" /> Free forever tier</span>
            <span className="flex items-center gap-1"><CheckCircle size={11} className="text-emerald-500" /> No credit card</span>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By creating an account, you agree to our{' '}
            <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>{' '}
            and{' '}
            <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
          </p>

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
