import React, { useState, useEffect } from 'react';
import { Copy, CheckCircle2, Code2, Zap, Shield, Book, ChevronRight, Globe, Key } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { userApi } from '../services/backendApi';
import { cn } from '../lib/utils';

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-[11px] font-mono text-muted-foreground">{language}</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[12px] font-mono text-foreground leading-relaxed whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const NAV_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'inference', label: 'Inference API' },
  { id: 'projects', label: 'Projects API' },
  { id: 'analytics', label: 'Analytics API' },
  { id: 'errors', label: 'Error handling' },
  { id: 'sdks', label: 'SDKs & Examples' },
];

export function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [apiKey, setApiKey] = useState('fnd_demo_YOUR_API_KEY');
  const [codeTab, setCodeTab] = useState('curl');

  useEffect(() => {
    userApi.apiKey().then((d) => setApiKey(d.apiKey)).catch(() => {});
  }, []);

  const INFERENCE_CODE: Record<string, string> = {
    curl: `curl -X POST "https://aifoundry-production.up.railway.app/api/v1/models/credit-risk-ai/predict" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{
    "age": 42,
    "income": 75000,
    "loan_amount": 800000,
    "employment": "salaried",
    "credit_score": 740
  }'`,
    python: `import requests

response = requests.post(
    "https://aifoundry-production.up.railway.app/api/v1/models/credit-risk-ai/predict",
    headers={
        "Content-Type": "application/json",
        "x-api-key": "${apiKey}"
    },
    json={
        "age": 42,
        "income": 75000,
        "loan_amount": 800000,
        "employment": "salaried",
        "credit_score": 740
    }
)

result = response.json()
print(f"Prediction: {result['prediction']}")
print(f"Probability: {result['probability']:.2%}")
print(f"Confidence: {result['confidence']}")`,
    javascript: `const response = await fetch(
  "https://aifoundry-production.up.railway.app/api/v1/models/credit-risk-ai/predict",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "${apiKey}"
    },
    body: JSON.stringify({
      age: 42,
      income: 75000,
      loan_amount: 800000,
      employment: "salaried",
      credit_score: 740
    })
  }
);

const { prediction, probability, confidence, explanation } = await response.json();
console.log(\`\${prediction} (\${(probability * 100).toFixed(1)}%)\`);`,
    typescript: `import type { InferenceResult } from '@aifoundry/sdk';

interface PredictionResponse {
  prediction: string;
  probability: number;
  confidence: 'high' | 'medium' | 'low';
  explanation: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    magnitude: 'high' | 'medium' | 'low';
  }>;
  model_version: string;
  latency_ms: number;
  powered_by: string;  // internal engine identifier
}

async function predict(input: Record<string, any>): Promise<PredictionResponse> {
  const res = await fetch(
    "https://aifoundry-production.up.railway.app/api/v1/models/credit-risk-ai/predict",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "${apiKey}"
      },
      body: JSON.stringify(input)
    }
  );
  if (!res.ok) throw new Error(\`API error: \${res.status}\`);
  return res.json();
}`,
  };

  const RESPONSE_EXAMPLE = `{
  "prediction": "low_risk",
  "probability": 0.184,
  "confidence": "high",
  "explanation": [
    { "factor": "Income stability", "impact": "positive", "magnitude": "high" },
    { "factor": "Loan/income ratio", "impact": "positive", "magnitude": "medium" },
    { "factor": "Credit score", "impact": "positive", "magnitude": "high" },
    { "factor": "Existing debt", "impact": "negative", "magnitude": "low" }
  ],
  "model_version": "v1.2",
  "latency_ms": 287,
  "model_id": "credit-risk-ai",
  "powered_by": "foundry-engine-v2"
}`;

  const sections: Record<string, React.ReactNode> = {
    overview: (
      <div className="space-y-5">
        <div>
          <h2 className="text-[18px] font-bold text-foreground mb-2">AI Foundry API</h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            The AI Foundry API lets you run inference on your trained models, manage projects, and retrieve analytics — all via HTTP. Every model you build in the console gets a dedicated REST endpoint.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
          <div className="text-[12px] font-semibold text-foreground">Base URL</div>
          <div className="font-mono text-[12px] text-primary bg-background rounded-lg border border-border px-3 py-2">
            https://aifoundry-production.up.railway.app
          </div>
          <p className="text-[11px] text-muted-foreground">In production, replace with your hosted endpoint.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: <Zap size={14} />, title: 'Real-time inference', desc: 'Sub-500ms predictions powered by the Foundry AI engine' },
            { icon: <Shield size={14} />, title: 'API key auth', desc: 'Secure x-api-key header authentication' },
            { icon: <Book size={14} />, title: 'Full REST API', desc: 'Projects, deployments, analytics endpoints' },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">{f.icon}</div>
              <div className="text-[12px] font-semibold text-foreground">{f.title}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    ),

    authentication: (
      <div className="space-y-5">
        <div>
          <h2 className="text-[18px] font-bold text-foreground mb-2">Authentication</h2>
          <p className="text-[13px] text-muted-foreground">All API requests require an API key passed in the <code className="code-inline">x-api-key</code> header.</p>
        </div>
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/10 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Key size={13} className="text-amber-600 dark:text-amber-400" />
            <span className="text-[12px] font-semibold text-amber-700 dark:text-amber-400">Your API Key</span>
          </div>
          <div className="font-mono text-[12px] bg-background rounded-lg border border-border px-3 py-2 text-foreground">{apiKey}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Find this in Settings → API Key.</p>
        </div>
        <CodeBlock code={`# Include in every request
curl ... -H "x-api-key: ${apiKey}"

# Or as Authorization Bearer
curl ... -H "Authorization: Bearer ${apiKey}"`} language="Authentication headers" />
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="text-[12px] font-semibold text-foreground">Response on invalid key</div>
          <CodeBlock code={`{ "error": "Unauthorized", "message": "Invalid or missing API key" }`} language="JSON" />
        </div>
      </div>
    ),

    inference: (
      <div className="space-y-5">
        <div>
          <h2 className="text-[18px] font-bold text-foreground mb-2">Inference API</h2>
          <p className="text-[13px] text-muted-foreground">Run predictions against any of your deployed models. The endpoint is model-agnostic — the same structure works for all model types.</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="default" className="font-mono">POST</Badge>
            <code className="font-mono text-[13px] text-foreground">/api/v1/models/:modelId/predict</code>
          </div>
          <p className="text-[12px] text-muted-foreground">Send input data and receive a prediction with confidence and explanation.</p>
        </div>

        <Tabs
          tabs={[
            { id: 'curl', label: 'cURL' },
            { id: 'python', label: 'Python' },
            { id: 'javascript', label: 'JavaScript' },
            { id: 'typescript', label: 'TypeScript' },
          ]}
          active={codeTab}
          onChange={setCodeTab}
        />
        <CodeBlock code={INFERENCE_CODE[codeTab]} language={codeTab} />

        <div>
          <div className="text-[12px] font-semibold text-foreground mb-2">Response</div>
          <CodeBlock code={RESPONSE_EXAMPLE} language="JSON" />
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/20 text-[12px] font-semibold text-foreground">Response fields</div>
          <div className="divide-y divide-border">
            {[
              ['prediction', 'string', 'The primary prediction label (e.g. "low_risk")'],
              ['probability', 'number', 'Default probability 0.0–1.0'],
              ['confidence', '"high" | "medium" | "low"', 'Model confidence in the prediction'],
              ['explanation', 'array', 'Array of factors with impact and magnitude'],
              ['model_version', 'string', 'The model version used (e.g. "v1.2")'],
              ['latency_ms', 'number', 'Request processing time in milliseconds'],
              ['powered_by', 'string', '"foundry-engine-v2" — internal inference engine identifier'],
            ].map(([field, type, desc]) => (
              <div key={field as string} className="flex items-start gap-4 px-4 py-2.5 text-[12px]">
                <code className="font-mono text-primary w-28 shrink-0">{field}</code>
                <code className="font-mono text-muted-foreground w-32 shrink-0 text-[11px]">{type}</code>
                <span className="text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),

    projects: (
      <div className="space-y-5">
        <h2 className="text-[18px] font-bold text-foreground">Projects API</h2>
        <div className="space-y-3">
          {[
            { method: 'GET', path: '/api/projects', desc: 'List all projects', note: 'Returns array of project objects with health and deployment status' },
            { method: 'GET', path: '/api/projects/:id', desc: 'Get a single project', note: 'Includes versions, test cases, and full configuration' },
            { method: 'POST', path: '/api/projects', desc: 'Create a project', note: 'Body: { name, description, objective }' },
            { method: 'PATCH', path: '/api/projects/:id', desc: 'Update a project', note: 'Partial update — only send fields you want to change' },
            { method: 'GET', path: '/api/projects/:id/versions', desc: 'List model versions', note: 'Returns all versions for a project ordered by date' },
            { method: 'POST', path: '/api/projects/:id/versions', desc: 'Create a new version', note: 'Body: { version, accuracy, f1Score, datasetSize, notes }' },
          ].map((ep) => (
            <div key={ep.path} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={ep.method === 'GET' ? 'secondary' : ep.method === 'POST' ? 'default' : 'warning'} className="font-mono text-[10px]">
                  {ep.method}
                </Badge>
                <code className="font-mono text-[12px] text-foreground">{ep.path}</code>
                <span className="text-[12px] text-muted-foreground ml-auto">{ep.desc}</span>
              </div>
              <p className="text-[11px] text-muted-foreground ml-14">{ep.note}</p>
            </div>
          ))}
        </div>
      </div>
    ),

    analytics: (
      <div className="space-y-5">
        <h2 className="text-[18px] font-bold text-foreground">Analytics API</h2>
        <div className="space-y-3">
          {[
            { path: '/api/analytics/overview', params: 'days?, projectId?', desc: 'Request totals, error rates, avg latency' },
            { path: '/api/analytics/timeseries', params: 'days?, projectId?', desc: 'Day-by-day breakdown of requests, errors, and latency' },
            { path: '/api/analytics/requests', params: 'projectId?, limit?, offset?', desc: 'Paginated log of individual API requests' },
            { path: '/api/analytics/models', params: '', desc: 'Per-model stats: requests, accuracy, latency' },
          ].map((ep) => (
            <div key={ep.path} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-0.5">
                <Badge variant="secondary" className="font-mono text-[10px]">GET</Badge>
                <code className="font-mono text-[12px] text-foreground">{ep.path}</code>
              </div>
              {ep.params && <p className="text-[11px] text-muted-foreground ml-12">Params: <code className="code-inline">{ep.params}</code></p>}
              <p className="text-[11px] text-muted-foreground ml-12 mt-0.5">{ep.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),

    errors: (
      <div className="space-y-5">
        <h2 className="text-[18px] font-bold text-foreground">Error Handling</h2>
        <p className="text-[13px] text-muted-foreground">All errors return a JSON body with an <code className="code-inline">error</code> field and an HTTP status code.</p>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="divide-y divide-border">
            {[
              ['400', 'Bad Request', 'Invalid input format or missing required fields'],
              ['401', 'Unauthorized', 'Missing or invalid API key'],
              ['404', 'Not Found', 'Project or model not found'],
              ['400', 'Model Not Deployed', 'Project exists but is not in production status'],
              ['500', 'Inference Failed', 'AI engine error or internal server error'],
            ].map(([code, name, desc]) => (
              <div key={`${code}-${name}`} className="flex items-start gap-4 px-4 py-3 text-[12px]">
                <code className={cn(
                  'font-mono font-bold w-8 shrink-0',
                  code === '200' ? 'text-emerald-600' : code === '400' || code === '401' ? 'text-amber-600' : 'text-red-500'
                )}>{code}</code>
                <span className="font-semibold text-foreground w-36 shrink-0">{name}</span>
                <span className="text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </div>
        <CodeBlock code={`// Always check for errors
const res = await fetch(endpoint, { method: 'POST', ... });

if (!res.ok) {
  const error = await res.json();
  console.error(\`API Error \${res.status}: \${error.error}\`);
  // Handle specific errors
  if (res.status === 401) redirectToLogin();
  if (res.status === 500) showRetryPrompt();
}`} language="Error handling pattern" />
      </div>
    ),

    sdks: (
      <div className="space-y-5">
        <h2 className="text-[18px] font-bold text-foreground">SDKs & Examples</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'Python integration', desc: 'pip install requests', badge: 'stable' },
            { title: 'Node.js / TypeScript', desc: 'Works with fetch or axios', badge: 'stable' },
            { title: 'Official SDK', desc: '@aifoundry/sdk on npm', badge: 'coming soon' },
            { title: 'Postman collection', desc: 'Import ready-to-use collection', badge: 'download' },
          ].map((sdk) => (
            <div key={sdk.title} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[13px] font-semibold text-foreground">{sdk.title}</span>
                <Badge variant={sdk.badge === 'stable' ? 'success' : sdk.badge === 'coming soon' ? 'secondary' : 'default'} className="text-[10px]">
                  {sdk.badge}
                </Badge>
              </div>
              <code className="text-[11px] font-mono text-muted-foreground">{sdk.desc}</code>
            </div>
          ))}
        </div>

        <div>
          <div className="text-[13px] font-semibold text-foreground mb-2">Rate limits</div>
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2 text-[12px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Requests per minute</span><span className="font-medium text-foreground">60</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Requests per hour</span><span className="font-medium text-foreground">1,000</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Max payload size</span><span className="font-medium text-foreground">10 MB</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Timeout</span><span className="font-medium text-foreground">30s</span></div>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Sidebar nav */}
      <div className="hidden md:flex w-52 border-r border-border flex-col py-4 shrink-0 overflow-y-auto">
        <div className="px-4 mb-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">API Reference</div>
        {NAV_SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={cn(
              'flex items-center justify-between px-4 py-2 text-[13px] font-medium transition-colors text-left',
              activeSection === s.id
                ? 'text-primary bg-primary/5 border-r-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {s.label}
            {activeSection === s.id && <ChevronRight size={12} className="text-primary" />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 max-w-3xl animate-fade-in">
        {sections[activeSection]}
      </div>
    </div>
  );
}
