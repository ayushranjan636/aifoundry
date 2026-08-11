import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Globe, Download, Server, CheckCircle2, ArrowRight, Code2, Copy,
  Plus, Trash2, Eye, EyeOff, Power, RefreshCw, Key, AlertCircle, Zap,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import { Skeleton } from '../../components/ui/Skeleton';
import { aiFoundryService } from '../../services/aiFoundryService';
import { apiKeysApi, deploymentsApi, isBackendUp } from '../../services/backendApi';
import { useToast } from '../../components/ui/Toast';
import { cn } from '../../lib/utils';

interface ApiKey {
  id: string;
  name: string;
  keyValue: string;
  keyPreview: string;
  isActive: boolean;
  requestsCount: number;
  lastUsed: string | null;
  createdAt: string;
}

function ApiKeyRow({ apiKey, onRevoke, onToggle }: { apiKey: ApiKey; onRevoke: () => void; onToggle: () => void }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(apiKey.keyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('flex items-center gap-3 px-4 py-3 border-b border-border last:border-0', !apiKey.isActive && 'opacity-50')}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-foreground">{apiKey.name}</span>
          {apiKey.isActive ? (
            <Badge variant="success" className="text-[10px]">Active</Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-mono text-[11px] text-muted-foreground">
            {shown ? apiKey.keyValue : apiKey.keyPreview}
          </span>
          <button onClick={() => setShown((s) => !s)} className="text-muted-foreground hover:text-foreground">
            {shown ? <EyeOff size={11} /> : <Eye size={11} />}
          </button>
          <button onClick={copy} className="text-muted-foreground hover:text-foreground">
            {copied ? <CheckCircle2 size={11} className="text-emerald-500" /> : <Copy size={11} />}
          </button>
        </div>
      </div>
      <div className="text-right shrink-0 hidden sm:block">
        <div className="text-[12px] font-medium text-foreground">{apiKey.requestsCount.toLocaleString()}</div>
        <div className="text-[10px] text-muted-foreground">requests</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onToggle}
          className={cn('p-1.5 rounded-lg transition-colors', apiKey.isActive ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20' : 'text-muted-foreground hover:bg-muted')}
          title={apiKey.isActive ? 'Deactivate' : 'Activate'}
        >
          <Power size={13} />
        </button>
        <button
          onClick={onRevoke}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Revoke"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export function DeploymentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError, info } = useToast();
  const [project, setProject] = useState(() => id ? aiFoundryService.getProject(id) : null);
  const [deploying, setDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [modelEnabled, setModelEnabled] = useState(true);
  const [copied, setCopied] = useState(false);

  const currentDeployment = project?.deployment;

  useEffect(() => {
    if (id) {
      const p = aiFoundryService.getProject(id);
      setProject(p || null);
      if (p?.deployment?.status === 'production') loadApiKeys();
    }
  }, [id]);

  const loadApiKeys = async () => {
    if (!id) return;
    setLoadingKeys(true);
    try {
      const backendUp = await isBackendUp();
      if (backendUp) {
        const keys = await apiKeysApi.list(id);
        setApiKeys(keys);
      } else {
        // Mock fallback
        setApiKeys([
          { id: 'mock-1', name: 'Production key', keyValue: `fnd_sk_prod_${Math.random().toString(36).slice(2, 18)}`, keyPreview: 'fnd_sk_prod_xxxx…', isActive: true, requestsCount: 1234, lastUsed: new Date().toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString() },
        ]);
      }
    } finally {
      setLoadingKeys(false);
    }
  };

  const createKey = async () => {
    if (!id || !newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const backendUp = await isBackendUp();
      let newKey: ApiKey;
      if (backendUp) {
        newKey = await apiKeysApi.create(id, newKeyName.trim());
      } else {
        newKey = {
          id: Math.random().toString(36).slice(2),
          name: newKeyName.trim(),
          keyValue: `fnd_sk_${Math.random().toString(36).slice(2, 34)}`,
          keyPreview: 'fnd_sk_xxxx…',
          isActive: true,
          requestsCount: 0,
          lastUsed: null,
          createdAt: new Date().toISOString(),
        };
      }
      setApiKeys((prev) => [newKey, ...prev]);
      setNewKeyName('');
      success('API key created', `"${newKey.name}" is ready to use`);
    } finally {
      setCreatingKey(false);
    }
  };

  const revokeKey = async (keyId: string, name: string) => {
    try {
      const backendUp = await isBackendUp();
      if (backendUp) await apiKeysApi.revoke(keyId);
      setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
      info(`"${name}" revoked`);
    } catch { toastError('Failed to revoke key'); }
  };

  const toggleKey = async (key: ApiKey) => {
    try {
      const backendUp = await isBackendUp();
      if (backendUp) await apiKeysApi.toggle(key.id, !key.isActive);
      setApiKeys((prev) => prev.map((k) => k.id === key.id ? { ...k, isActive: !k.isActive } : k));
    } catch {}
  };

  const handleDeploy = async () => {
    if (!id) return;
    setDeploying(true);
    const interval = setInterval(() => {
      setDeployProgress((p) => Math.min(p + Math.random() * 20, 95));
    }, 300);
    try {
      const deployment = await aiFoundryService.deployModel(id);
      clearInterval(interval);
      setDeployProgress(100);
      setProject(aiFoundryService.getProject(id) || null);
      success('Model deployed!', 'Your API endpoint is live.');
      await loadApiKeys();
    } finally {
      setDeploying(false);
    }
  };

  const toggleModel = async () => {
    const next = !modelEnabled;
    setModelEnabled(next);
    info(next ? 'Model enabled' : 'Model paused', next ? 'API endpoint is accepting requests' : 'API endpoint is paused');
  };

  const copyEndpoint = () => {
    if (currentDeployment?.endpoint) {
      navigator.clipboard.writeText(currentDeployment.endpoint);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Deploy your AI</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">{project?.name}</p>
      </div>

      {/* Live deployment status */}
      {currentDeployment?.status === 'production' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Status header */}
          <div className={cn(
            'px-4 py-3 border-b border-border flex items-center justify-between',
            modelEnabled ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : 'bg-muted/20'
          )}>
            <div className="flex items-center gap-2">
              {modelEnabled ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
              )}
              <span className="text-[13px] font-semibold text-foreground">
                {modelEnabled ? 'Production · Live' : 'Production · Paused'}
              </span>
              <Badge variant={modelEnabled ? 'success' : 'secondary'}>{modelEnabled ? 'Accepting requests' : 'Paused'}</Badge>
            </div>
            {/* On/off toggle */}
            <button
              onClick={toggleModel}
              className={cn(
                'flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-colors',
                modelEnabled
                  ? 'border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20'
                  : 'border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
              )}
            >
              <Power size={13} />
              {modelEnabled ? 'Pause model' : 'Enable model'}
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 divide-x divide-border">
            {[
              { label: 'Requests today', value: (currentDeployment.requestsToday || 0).toLocaleString() },
              { label: 'Avg. latency', value: `${currentDeployment.latencyMs}ms` },
              { label: 'Error rate', value: `${currentDeployment.errorRate}%` },
            ].map((m) => (
              <div key={m.label} className="px-4 py-3">
                <div className="text-[10px] text-muted-foreground">{m.label}</div>
                <div className="text-[15px] font-bold text-foreground tabular mt-0.5">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Endpoint */}
          <div className="px-4 py-3 border-t border-border flex items-center gap-2 bg-muted/10">
            <Globe size={13} className="text-muted-foreground shrink-0" />
            <span className="font-mono text-[11px] text-muted-foreground truncate flex-1">{currentDeployment.endpoint}</span>
            <button onClick={copyEndpoint} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
              {copied ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
            </button>
            <Button size="sm" variant="outline" onClick={() => navigate(`/projects/${id}/api`)}>
              <Code2 size={12} />
              Playground
            </Button>
          </div>
        </div>
      )}

      {/* Deploy options (when not yet deployed) */}
      {!currentDeployment && (
        <div className="space-y-3">
          {[
            { id: 'hosted', icon: <Globe size={18} />, label: 'Hosted by AI Foundry', desc: 'We manage infrastructure, scaling, and monitoring. Recommended.', recommended: true },
            { id: 'download', icon: <Download size={18} />, label: 'Download model', desc: 'Download model artifacts for self-managed deployment.', recommended: false },
            { id: 'selfhost', icon: <Server size={18} />, label: 'Self-host', desc: 'Deploy using your own infrastructure or cloud.', recommended: false },
          ].map((opt) => (
            <div key={opt.id} className={cn('rounded-xl border p-4', opt.recommended ? 'border-primary/30 bg-primary/5' : 'border-border bg-card')}>
              <div className="flex items-start gap-3">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', opt.recommended ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
                  {opt.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-foreground">{opt.label}</span>
                    {opt.recommended && <Badge variant="default">Recommended</Badge>}
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{opt.desc}</p>
                </div>
              </div>
              <div className="mt-3 ml-12">
                <Button
                  size="sm"
                  variant={opt.recommended ? 'primary' : 'outline'}
                  onClick={opt.id === 'hosted' ? handleDeploy : () => info('Coming soon', 'This deployment option is in development.')}
                  loading={opt.id === 'hosted' && deploying}
                >
                  {opt.id === 'hosted' ? 'Deploy now' : opt.label}
                  <ArrowRight size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deploying && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-[13px] font-medium text-foreground">Deploying…</span>
          </div>
          <Progress value={deployProgress} showLabel />
          <div className="text-[11px] text-muted-foreground">
            {deployProgress < 30 ? 'Packaging model artifacts…' : deployProgress < 60 ? 'Provisioning endpoint…' : deployProgress < 90 ? 'Running health checks…' : 'Finalizing…'}
          </div>
        </div>
      )}

      {/* API Key Generator */}
      {currentDeployment?.status === 'production' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key size={14} className="text-primary" />
              <span className="text-[13px] font-semibold text-foreground">API Keys</span>
            </div>
            <span className="text-[11px] text-muted-foreground">{apiKeys.length} key{apiKeys.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Create new key */}
          <div className="px-4 py-3 border-b border-border bg-muted/10 flex items-center gap-2">
            <input
              type="text"
              placeholder="Key name (e.g. Production, Dev)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createKey()}
              className="flex-1 h-8 bg-background border border-input rounded-lg px-3 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button size="sm" onClick={createKey} loading={creatingKey} disabled={!newKeyName.trim()}>
              <Plus size={12} />
              Generate
            </Button>
          </div>

          {/* Keys list */}
          {loadingKeys ? (
            <div className="p-4 space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-muted-foreground">
              No API keys yet. Generate one to start making requests.
            </div>
          ) : (
            <div>
              {apiKeys.map((key) => (
                <ApiKeyRow
                  key={key.id}
                  apiKey={key}
                  onRevoke={() => revokeKey(key.id, key.name)}
                  onToggle={() => toggleKey(key)}
                />
              ))}
            </div>
          )}

          {/* Usage snippet */}
          {apiKeys.length > 0 && (
            <div className="px-4 py-3 border-t border-border bg-muted/10">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Usage</div>
              <pre className="font-mono text-[11px] text-muted-foreground bg-background rounded-lg border border-border p-3 overflow-x-auto">{`curl -X POST "${currentDeployment.endpoint}" \\
  -H "x-api-key: ${apiKeys[0]?.keyValue?.slice(0, 24)}..." \\
  -H "Content-Type: application/json" \\
  -d '{"input": "your data here"}'`}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
