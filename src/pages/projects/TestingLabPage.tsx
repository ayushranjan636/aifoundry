import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Play, CheckCircle, AlertCircle, Minus, Zap, Terminal, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Tabs } from '../../components/ui/Tabs';
import { aiFoundryService } from '../../services/aiFoundryService';
import { hasOpenAIKey } from '../../config/apiConfig';
import { useToast } from '../../components/ui/Toast';
import { cn } from '../../lib/utils';
import type { TestResult } from '../../types';

function ImpactBar({ impact, magnitude }: { impact: string; magnitude: string }) {
  const color = impact === 'positive' ? 'bg-emerald-500' : impact === 'negative' ? 'bg-red-400' : 'bg-muted-foreground/30';
  const width = magnitude === 'high' ? '82%' : magnitude === 'medium' ? '54%' : '28%';
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width }} />
      </div>
      <span className={cn(
        'text-[11px] font-medium capitalize w-14 text-right shrink-0',
        impact === 'positive' ? 'text-emerald-600 dark:text-emerald-400' :
        impact === 'negative' ? 'text-red-500' : 'text-muted-foreground'
      )}>
        {impact}
      </span>
    </div>
  );
}

// Default fields per output format when no suggestedTestFields exist yet
function getDefaultFields(objective: string, inputFormats: string[]) {
  const obj = objective.toLowerCase();
  if (obj.includes('loan') || obj.includes('credit') || obj.includes('risk') || obj.includes('default') || obj.includes('fraud')) {
    return [
      { key: 'income', label: 'Annual Income', placeholder: '75000', defaultValue: '75000' },
      { key: 'loan_amount', label: 'Loan Amount', placeholder: '500000', defaultValue: '500000' },
      { key: 'credit_score', label: 'Credit Score', placeholder: '720', defaultValue: '720' },
      { key: 'employment', label: 'Employment Type', placeholder: 'Salaried', defaultValue: 'Salaried' },
      { key: 'existing_debt', label: 'Existing Debt', placeholder: '50000', defaultValue: '50000' },
    ];
  }
  if (obj.includes('sentiment') || obj.includes('review') || obj.includes('emotion')) {
    return [
      { key: 'text', label: 'Text to Analyze', placeholder: 'Enter text or review…', defaultValue: 'The service was excellent and very fast!' },
      { key: 'source', label: 'Source', placeholder: 'e.g. Twitter', defaultValue: 'Customer review' },
    ];
  }
  if (obj.includes('support') || obj.includes('ticket') || obj.includes('helpdesk')) {
    return [
      { key: 'query', label: 'Customer Query', placeholder: 'What is the customer asking?', defaultValue: 'My account is locked and I cannot log in.' },
      { key: 'category', label: 'Category', placeholder: 'Technical / Billing / General', defaultValue: 'Technical' },
    ];
  }
  if (obj.includes('student') || obj.includes('dropout') || obj.includes('academic')) {
    return [
      { key: 'attendance', label: 'Attendance %', placeholder: '75', defaultValue: '75' },
      { key: 'gpa', label: 'GPA', placeholder: '2.8', defaultValue: '2.8' },
      { key: 'assignments_completed', label: 'Assignments Done %', placeholder: '65', defaultValue: '65' },
    ];
  }
  if (inputFormats.includes('text') || inputFormats.includes('documents')) {
    return [
      { key: 'text', label: 'Input Text', placeholder: 'Enter your text here…', defaultValue: '' },
      { key: 'context', label: 'Context (optional)', placeholder: 'Additional context', defaultValue: '' },
    ];
  }
  return [
    { key: 'input_1', label: 'Feature 1', placeholder: 'Enter value', defaultValue: '' },
    { key: 'input_2', label: 'Feature 2', placeholder: 'Enter value', defaultValue: '' },
    { key: 'input_3', label: 'Feature 3', placeholder: 'Enter value', defaultValue: '' },
  ];
}

const CASE_DESCRIPTIONS: Record<string, string> = {
  normal: 'Typical case — represents the majority of real-world inputs',
  edge: 'Boundary case — tests model behavior at the extremes',
  adversarial: 'Stress test — challenging or ambiguous input',
  custom: 'Define your own input values',
};

export function TestingLabPage() {
  const { id } = useParams<{ id: string }>();
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState('normal');
  const [fields, setFields] = useState<Array<{ key: string; label: string; placeholder: string; defaultValue: string }>>([]);
  const [input, setInput] = useState<Record<string, string>>({});
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const project = id ? aiFoundryService.getProject(id) : null;
  const usingRealModel = hasOpenAIKey() || (!!project?.generatedSystemPrompt);

  // Load fields from project or derive from objective
  useEffect(() => {
    if (!project) return;
    const f = project.suggestedTestFields ||
      getDefaultFields(project.objective || '', project.inputFormats || []);
    setFields(f);
    // Set defaults
    const defaults: Record<string, string> = {};
    f.forEach((field) => { defaults[field.key] = field.defaultValue; });
    setInput(defaults);
  }, [id, project?.suggestedTestFields?.length]);

  const loadPreset = (type: string) => {
    setActiveTab(type);
    setResult(null);
    setError('');
    if (type === 'custom') {
      const cleared: Record<string, string> = {};
      fields.forEach((f) => { cleared[f.key] = ''; });
      setInput(cleared);
      return;
    }

    // Generate variant inputs based on preset type
    const newInput: Record<string, string> = {};
    fields.forEach((f) => {
      const numDefault = parseFloat(f.defaultValue);
      if (!isNaN(numDefault) && numDefault > 0) {
        if (type === 'edge') {
          // Edge: push values toward risk/boundary
          newInput[f.key] = String(Math.round(numDefault * 0.35));
        } else if (type === 'adversarial') {
          // Adversarial: very strong positive signal
          newInput[f.key] = String(Math.round(numDefault * 1.8));
        } else {
          newInput[f.key] = f.defaultValue;
        }
      } else {
        // Text field variations
        if (type === 'edge' && f.defaultValue) {
          newInput[f.key] = f.defaultValue.includes('Salaried') ? 'Self-employed' :
            f.defaultValue.includes('excellent') ? 'The product was okay, nothing special.' :
            f.defaultValue + ' — unusual circumstances apply';
        } else if (type === 'adversarial' && f.defaultValue) {
          newInput[f.key] = f.defaultValue.includes('Salaried') ? 'Unemployed' :
            f.defaultValue.includes('excellent') ? 'Terrible experience, very disappointed and frustrated.' :
            f.defaultValue;
        } else {
          newInput[f.key] = f.defaultValue;
        }
      }
    });
    setInput(newInput);
  };

  const handleRun = async () => {
    if (!id) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const numericInput = Object.fromEntries(
        Object.entries(input).map(([k, v]) => [k, v !== '' && !isNaN(Number(v)) ? Number(v) : v])
      );
      const res = await aiFoundryService.runTest(id, numericInput);
      setResult(res);
      success('Inference complete', `${res.prediction} · ${Math.round(res.probability * 100)}% probability`);
    } catch {
      setError('Inference failed. Please try again.');
      toastError('Inference failed');
    } finally {
      setLoading(false);
    }
  };

  const predColor = result
    ? result.prediction.includes('LOW') || result.prediction === 'POSITIVE' || result.prediction === 'PASS'
      ? 'text-emerald-600 dark:text-emerald-400'
      : result.prediction.includes('HIGH') || result.prediction === 'NEGATIVE' || result.prediction === 'FAIL' || result.prediction.includes('ESCALATE')
      ? 'text-red-500 dark:text-red-400'
      : 'text-amber-600 dark:text-amber-400'
    : '';

  const probPct = result ? Math.round(result.probability * 100) : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Testing Lab</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {project?.name} — run test cases to validate model behavior.
          </p>
        </div>
        <Badge variant={usingRealModel ? 'default' : 'secondary'} className="shrink-0">
          {usingRealModel ? <><Zap size={10} className="mr-1" />Live inference</> : 'Simulation'}
        </Badge>
      </div>

      {/* Model prompt indicator */}
      {project?.generatedSystemPrompt && (
        <div className="rounded-xl border border-border bg-muted/20 p-3">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Active model</div>
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {project.generatedSystemPrompt.slice(0, 180)}…
          </p>
        </div>
      )}

      {/* Case type tabs */}
      <Tabs
        tabs={[
          { id: 'normal', label: 'Normal case' },
          { id: 'edge', label: 'Edge case' },
          { id: 'adversarial', label: 'Stress test' },
          { id: 'custom', label: 'Custom' },
        ]}
        active={activeTab}
        onChange={loadPreset}
      />
      <p className="text-[11px] text-muted-foreground -mt-3">
        {CASE_DESCRIPTIONS[activeTab]}
      </p>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Input panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-semibold text-foreground">Input</div>
            <button
              onClick={() => loadPreset(activeTab)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw size={11} />
              Reset
            </button>
          </div>

          {fields.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/10 p-6 text-center text-[12px] text-muted-foreground">
              Build your model first to generate dynamic test fields.
            </div>
          ) : (
            <div className="space-y-2.5">
              {fields.map((field) => (
                <Input
                  key={field.key}
                  label={field.label}
                  value={input[field.key] ?? ''}
                  onChange={(e) => setInput((p) => ({ ...p, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                />
              ))}
            </div>
          )}

          <Button onClick={handleRun} loading={loading} className="w-full" disabled={fields.length === 0}>
            <Play size={13} />
            {loading ? 'Running inference…' : 'Run test'}
          </Button>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Result panel */}
        <div className="space-y-4">
          <div className="text-[13px] font-semibold text-foreground">Result</div>

          {!result && !loading && (
            <div className="rounded-xl border border-dashed border-border bg-muted/10 min-h-[320px] flex flex-col items-center justify-center gap-3 p-6">
              <Terminal size={22} className="text-muted-foreground/30" />
              <p className="text-[12px] text-muted-foreground text-center">
                Run a test to see your model's output here.
              </p>
            </div>
          )}

          {loading && (
            <div className="rounded-xl border border-border bg-card min-h-[320px] flex flex-col items-center justify-center gap-4">
              <div className="relative h-12 w-12">
                <div className="h-12 w-12 rounded-full border-2 border-primary/20 absolute inset-0" />
                <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin absolute inset-0" />
                <Zap size={16} className="text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[12px] text-muted-foreground">
                {usingRealModel ? 'Running inference on your trained model…' : 'Simulating prediction…'}
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-3 animate-fade-in">
              {/* Prediction card */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Prediction</div>
                    <div className={cn('text-[22px] font-bold mt-0.5 tracking-tight', predColor)}>
                      {result.prediction}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Probability</div>
                    <div className="text-[22px] font-bold text-foreground mt-0.5 tabular">{probPct}%</div>
                  </div>
                </div>

                {/* Probability bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      probPct < 35 ? 'bg-emerald-500' : probPct < 65 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                    style={{ width: `${probPct}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={
                    result.confidence === 'high' ? 'success' :
                    result.confidence === 'medium' ? 'warning' : 'secondary'
                  }>
                    {result.confidence} confidence
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{result.latencyMs}ms</span>
                  {usingRealModel && (
                    <span className="flex items-center gap-1 text-[11px] text-primary">
                      <Zap size={9} />live
                    </span>
                  )}
                </div>
              </div>

              {/* Feature explanations */}
              {result.explanation.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="text-[12px] font-semibold text-foreground mb-3">Feature explanation</div>
                  <div className="space-y-2.5">
                    {result.explanation.map((factor, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[12px] text-foreground w-36 shrink-0 truncate" title={factor.factor}>
                          {factor.factor}
                        </span>
                        <ImpactBar impact={factor.impact} magnitude={factor.magnitude} />
                        <span className={cn(
                          'shrink-0',
                          factor.impact === 'positive' ? 'text-emerald-500' :
                          factor.impact === 'negative' ? 'text-red-400' : 'text-muted-foreground/50'
                        )}>
                          {factor.impact === 'positive' ? <CheckCircle size={12} /> :
                           factor.impact === 'negative' ? <AlertCircle size={12} /> :
                           <Minus size={12} />}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
