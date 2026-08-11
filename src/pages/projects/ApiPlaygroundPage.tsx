import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Copy, CheckCircle, Terminal, Zap } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { aiFoundryService } from '../../services/aiFoundryService';
import { hasOpenAIKey } from '../../config/apiConfig';

const DEFAULT_BODY = JSON.stringify({
  income: 75000,
  loan_amount: 800000,
  employment: 'salaried',
  age: 42,
  credit_score: 740,
}, null, 2);

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-lg border border-border bg-muted/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50">
        <span className="text-xs font-mono text-muted-foreground">{language}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <CheckCircle size={12} className="text-emerald-500" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs font-mono text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function ApiPlaygroundPage() {
  const { id } = useParams<{ id: string }>();
  const [requestBody, setRequestBody] = useState(DEFAULT_BODY);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeTab, setCodeTab] = useState('curl');

  const project = id ? aiFoundryService.getProject(id) : null;
  const endpoint = project?.deployment?.endpoint || `https://api.aifoundry.ai/v1/models/${id}/predict`;
  const usingRealModel = hasOpenAIKey() && !!project?.generatedSystemPrompt;

  const handleRun = async () => {
    if (!id) return;
    setLoading(true);
    setResponse('');
    try {
      const res = await aiFoundryService.getApiResponse(id, requestBody);
      setResponse(res);
    } finally {
      setLoading(false);
    }
  };

  const curlCode = `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '${requestBody.replace(/\n/g, '\\n')}'`;

  const pythonCode = `import requests

response = requests.post(
    "${endpoint}",
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_API_KEY"
    },
    json=${requestBody}
)

result = response.json()
print(result["prediction"], result["probability"])`;

  const jsCode = `const response = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
  },
  body: JSON.stringify(${requestBody})
});

const result = await response.json();
console.log(result.prediction, result.probability);`;

  const codeMap: Record<string, string> = {
    curl: curlCode,
    python: pythonCode,
    javascript: jsCode,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">API Playground</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Test your model API interactively.</p>
        </div>
        <Badge variant={usingRealModel ? 'default' : 'secondary'}>
          {usingRealModel ? <><Zap size={10} className="mr-1" />Live model</> : 'Demo mode'}
        </Badge>
      </div>

      {/* Endpoint */}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
        <Badge variant="default" className="font-mono shrink-0">POST</Badge>
        <span className="font-mono text-sm text-foreground truncate">{endpoint}</span>
        <button
          onClick={() => navigator.clipboard.writeText(endpoint)}
          className="ml-auto shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Copy size={14} />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Request */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-foreground">Request body</div>
          <div className="relative">
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              className="w-full h-48 rounded-lg border border-input bg-muted/20 px-3 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              spellCheck={false}
            />
          </div>
          <Button onClick={handleRun} loading={loading} className="w-full">
            <Play size={14} />
            Run request
          </Button>
        </div>

        {/* Response */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-foreground">Response</div>
          <div className="h-48 rounded-lg border border-input bg-muted/20 overflow-auto p-3">
            {!response && !loading && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Terminal size={20} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Run a request to see the response</p>
                </div>
              </div>
            )}
            {loading && (
              <div className="flex items-center justify-center h-full gap-2 text-muted-foreground text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                Waiting for response…
              </div>
            )}
            {response && !loading && (
              <pre className="font-mono text-xs text-foreground whitespace-pre-wrap">{response}</pre>
            )}
          </div>
          {response && (
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="success">200 OK</Badge>
              <span className="text-muted-foreground">application/json</span>
            </div>
          )}
        </div>
      </div>

      {/* Code samples */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-foreground">Code examples</div>
        <Tabs
          tabs={[
            { id: 'curl', label: 'cURL' },
            { id: 'python', label: 'Python' },
            { id: 'javascript', label: 'JavaScript' },
          ]}
          active={codeTab}
          onChange={setCodeTab}
        />
        <CodeBlock code={codeMap[codeTab]} language={codeTab} />
      </div>
    </div>
  );
}
