import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle, AlertCircle, Moon, Sun, Key, RefreshCw, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { getOpenAIKey, setOpenAIKey, hasOpenAIKey } from '../config/apiConfig';

export function SettingsPage() {
  const [apiKey, setApiKey] = useState(() => getOpenAIKey());
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'ok' | 'error' | null>(null);

  const handleSave = () => {
    setOpenAIKey(apiKey);
    setSaved(true);
    setTestResult(null);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTest = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ apiKey: apiKey.trim(), dangerouslyAllowBrowser: true });
      await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Reply with OK only.' }],
        max_tokens: 5,
      });
      setTestResult('ok');
      setOpenAIKey(apiKey.trim());
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const keyIsSet = hasOpenAIKey();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account, AI engine key and preferences.</p>
      </div>

      {/* ── AI Engine Key ──────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Key size={15} className="text-primary" />
            <span className="text-[13px] font-semibold text-foreground">AI Engine Key</span>
            {keyIsSet ? (
              <Badge variant="success">Connected</Badge>
            ) : (
              <Badge variant="secondary">Not configured</Badge>
            )}
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">
            Required to enable real AI inference, intelligent architecture analysis, and model generation.
            Your key is stored locally in your browser and is never sent to our servers.
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">Engine key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setTestResult(null); }}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pr-9 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          {testResult === 'ok' && (
            <div className="flex items-center gap-2 text-[12px] text-emerald-600 dark:text-emerald-400 animate-fade-in-fast">
              <CheckCircle size={13} />
              Connection successful — key saved.
            </div>
          )}
          {testResult === 'error' && (
            <div className="flex items-center gap-2 text-[12px] text-destructive animate-fade-in-fast">
              <AlertCircle size={13} />
              Invalid key or connection failed. Please check and try again.
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={handleTest} loading={testing} variant="outline">
              Test connection
            </Button>
            <Button size="sm" onClick={handleSave}>
              {saved ? <><CheckCircle size={12} /> Saved</> : 'Save key'}
            </Button>
            {apiKey && (
              <Button size="sm" variant="ghost" onClick={() => { setApiKey(''); setOpenAIKey(''); setTestResult(null); }}>
                Clear
              </Button>
            )}
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">What the key enables</div>
            {[
              ['Architecture analysis', 'Intelligently scores each approach based on your specific use case'],
              ['Model generation', 'Creates a specialized model tailored to your domain and requirements'],
              ['Live inference', 'Test your AI with real responses powered by your trained model'],
              ['Health interpretation', 'AI-generated insights and recommendations about your model performance'],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-2">
                <Zap size={11} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="text-[12px] font-medium text-foreground">{title}</span>
                  <span className="text-[11px] text-muted-foreground"> — {desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Appearance ──────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/20">
          <div className="text-[13px] font-semibold text-foreground">Appearance</div>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium text-foreground">Theme</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">Choose between light and dark mode.</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => document.documentElement.classList.remove('dark')} className="gap-1.5">
                <Sun size={12} />Light
              </Button>
              <Button variant="outline" size="sm" onClick={() => document.documentElement.classList.add('dark')} className="gap-1.5">
                <Moon size={12} />Dark
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Danger zone ─────────────────────────────────────── */}
      <div className="rounded-xl border border-destructive/20 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-destructive/20 bg-destructive/5">
          <div className="text-[13px] font-semibold text-destructive">Danger zone</div>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[13px] font-medium text-foreground">Reset demo data</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">
                Restore all projects to their original demo state. This cannot be undone.
              </div>
            </div>
            <Button
              variant="outline" size="sm"
              onClick={() => { localStorage.removeItem('aifoundry_projects_v2'); window.location.reload(); }}
              className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <RefreshCw size={12} />Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
