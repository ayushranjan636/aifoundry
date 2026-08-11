import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, ArrowRight, File, CheckCircle, AlertCircle, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Info, Lightbulb } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import { useToast } from '../../components/ui/Toast';
import { aiFoundryService } from '../../services/aiFoundryService';
import { cn } from '../../lib/utils';
import type { DatasetAnalysis } from '../../types';

const tooltipStyle = {
  background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
  borderRadius: '10px', fontSize: '11px',
};

function parseCSVPreview(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split('\n').filter(Boolean).slice(0, 6);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
  const rows = lines.slice(1, 6).map((line) => line.split(',').map((c) => c.trim().replace(/"/g, '')));
  return { headers: headers.slice(0, 8), rows: rows.map((r) => r.slice(0, 8)) };
}

interface IgnoreExplainerProps { rec: any }
function IgnoreExplainer({ rec }: IgnoreExplainerProps) {
  const [open, setOpen] = useState(false);
  const chartData = [
    { label: 'With fix', accuracy: 91.4, color: '#10b981' },
    { label: 'Without fix', accuracy: 83.2, color: '#f59e0b' },
  ];
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        What happens if I ignore this?
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-border bg-background p-3 space-y-2 animate-fade-in-fast">
          <div className="text-[11px] font-semibold text-foreground">Expected impact</div>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
              <XAxis type="number" domain={[75, 100]} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} unit="%" />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Accuracy']} />
              <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <rect key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={10} />
              With fix: ~91.4% accuracy
            </div>
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <TrendingDown size={10} />
              Without: ~83.2% accuracy
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DatasetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, info } = useToast();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysis, setAnalysis] = useState<DatasetAnalysis | null>(() => {
    if (!id) return null;
    return aiFoundryService.getProject(id)?.datasetAnalysis || null;
  });
  const [csvPreview, setCsvPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [noDataset, setNoDataset] = useState(false);

  const project = id ? aiFoundryService.getProject(id) : null;

  // Generate data requirements based on approach + objective
  const getDataRequirements = () => {
    const approach = project?.selectedApproach;
    const obj = (project?.objective || '').toLowerCase();
    const isClassification = obj.includes('classif') || obj.includes('predict') || obj.includes('risk') || obj.includes('fraud') || obj.includes('detect');
    const isRAG = approach === 'rag';
    const isSLM = approach === 'slm';

    if (isRAG) {
      return {
        format: 'Documents: PDF, TXT, JSONL with question-answer pairs',
        minSize: '500+ document chunks or 1,000+ Q&A pairs',
        structure: 'Each entry: { "question": "...", "answer": "..." }',
        tips: ['Include domain terminology in documents', 'Cover all common query types', 'Add metadata like category or date if available'],
      };
    }
    if (isSLM) {
      return {
        format: 'CSV or JSONL with input → output pairs',
        minSize: '5,000 – 50,000 labeled examples',
        structure: 'Each row: { "input": "...", "label": "..." }',
        tips: ['Focus on your specific task only', 'Balance classes evenly', 'Include diverse phrasing for the same concept'],
      };
    }
    if (isClassification) {
      return {
        format: 'CSV or JSONL with feature columns + target label',
        minSize: '10,000 – 100,000 rows (more = better recall on rare classes)',
        structure: 'Columns: features... | target_label. One row per example.',
        tips: ['Aim for 20%+ representation of minority class', 'No future-leaking features', 'Include all real-world variations'],
      };
    }
    return {
      format: 'CSV, JSONL, or plain text with input-output pairs',
      minSize: '5,000+ examples recommended',
      structure: 'Input data paired with expected outputs, one example per row',
      tips: ['More diverse examples = better generalization', 'Label quality matters more than quantity', 'Include edge cases'],
    };
  };

  const dataRequirements = getDataRequirements();

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setUploading(true);
    setUploadProgress(0);

    // Read CSV preview
    if (f.name.endsWith('.csv') || f.name.endsWith('.tsv')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvPreview(parseCSVPreview(text));
      };
      reader.readAsText(f.slice(0, 4096));
    }

    const progressInterval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + Math.random() * 15, 90));
    }, 200);

    try {
      const result = await aiFoundryService.analyzeDataset(id!, f);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setAnalysis(result);
      success('Dataset analyzed', `${result.rows.toLocaleString()} records · Readiness ${result.readinessScore}/100`);
    } catch {
      clearInterval(progressInterval);
    } finally {
      setUploading(false);
    }
  }, [id, success]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-[22px] font-bold text-foreground">Let's look at your data.</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Your dataset doesn't need to be perfect. We'll analyze it and tell you exactly what's missing.
        </p>
      </div>

      {!analysis && !uploading && (
        <>
          {/* Data requirements panel */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb size={14} className="text-primary shrink-0" />
              <div className="text-[13px] font-semibold text-foreground">
                What data does this model need?
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-[12px]">
              <div className="space-y-1">
                <div className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wide">Format</div>
                <div className="text-foreground font-mono bg-background rounded-lg border border-border px-2.5 py-1.5">{dataRequirements.format}</div>
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wide">Minimum size</div>
                <div className="text-foreground bg-background rounded-lg border border-border px-2.5 py-1.5">{dataRequirements.minSize}</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wide">Expected structure</div>
              <div className="text-[11px] font-mono text-muted-foreground bg-background rounded-lg border border-border px-3 py-2">{dataRequirements.structure}</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wide">Tips for best results</div>
              <ul className="space-y-1">
                {dataRequirements.tips.map((tip) => (
                  <li key={tip} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <CheckCircle size={11} className="text-emerald-500 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <label
            className={cn(
              'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-all duration-200',
              dragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/30'
            )}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl transition-colors', dragging ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
              <Upload size={22} />
            </div>
            <div className="text-center">
              <div className="text-[13px] font-semibold text-foreground">Drag & drop your dataset</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">or click to browse</div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {['CSV', 'JSON', 'JSONL', 'PDF', 'TXT'].map((fmt) => (
                <span key={fmt} className="text-[10px] px-2 py-0.5 rounded-md border border-border bg-background text-muted-foreground font-mono">{fmt}</span>
              ))}
            </div>
            <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} accept=".csv,.json,.jsonl,.pdf,.txt" />
          </label>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button onClick={() => setNoDataset((x) => !x)} className="w-full text-[13px] text-muted-foreground hover:text-foreground transition-colors text-center">
            I don't have a dataset yet
          </button>

          {noDataset && (
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3 animate-fade-in">
              <div className="text-[13px] font-semibold text-foreground">No problem.</div>
              <p className="text-[12px] text-muted-foreground">Tell us what data you expect to have. We'll recommend the structure you need.</p>
              <ul className="space-y-2">
                {[
                  'At least 10,000 labeled examples',
                  'Features matching your inputs (e.g. text, scores, categories)',
                  'A clear target label for each row',
                  'Aim for balanced class distribution (20%+ minority class)',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                    <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="sm" onClick={() => setNoDataset(false)}>I'll upload a dataset</Button>
            </div>
          )}
        </>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <File size={15} className="text-muted-foreground shrink-0" />
            <span className="text-[13px] text-foreground truncate">{file?.name}</span>
          </div>
          {/* CSV Preview while uploading */}
          {csvPreview && csvPreview.headers.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-[10px]">
                <thead className="bg-muted/30">
                  <tr>{csvPreview.headers.map((h) => <th key={h} className="px-2 py-1.5 text-left font-semibold text-muted-foreground border-b border-border">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {csvPreview.rows.slice(0, 3).map((row, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      {row.map((cell, j) => <td key={j} className="px-2 py-1 text-muted-foreground truncate max-w-[80px]">{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Progress value={uploadProgress} showLabel />
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            {uploadProgress < 50 ? 'Uploading dataset…' : uploadProgress < 90 ? 'Analyzing data structure…' : 'Generating insights…'}
          </div>
        </div>
      )}

      {/* Analysis results */}
      {analysis && !uploading && (
        <div className="space-y-5 animate-fade-in">
          {file && (
            <div className="flex items-center gap-2 text-[13px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={15} />
              {file.name} analyzed successfully
            </div>
          )}

          {/* CSV Preview */}
          {csvPreview && csvPreview.headers.length > 0 && (
            <div className="space-y-2">
              <div className="text-[12px] font-semibold text-foreground">Dataset preview</div>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-[11px]">
                  <thead className="bg-muted/30">
                    <tr>{csvPreview.headers.map((h) => <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground border-b border-border whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {csvPreview.rows.map((row, i) => (
                      <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                        {row.map((cell, j) => <td key={j} className="px-3 py-2 text-muted-foreground truncate max-w-[120px]" title={cell}>{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-[11px] text-muted-foreground">Showing first 5 rows</div>
            </div>
          )}

          {/* Readiness */}
          <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
            <div className={cn(
              'text-[40px] font-bold tabular shrink-0',
              analysis.readinessScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
              analysis.readinessScore >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500'
            )}>
              {analysis.readinessScore}
            </div>
            <div className="flex-1">
              <div className="text-[12px] font-semibold text-foreground">Dataset Readiness Score</div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mt-1.5">
                <div
                  className={cn('h-full rounded-full transition-all duration-700',
                    analysis.readinessScore >= 80 ? 'bg-emerald-500' : analysis.readinessScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                  )}
                  style={{ width: `${analysis.readinessScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/20 text-[12px] font-semibold text-foreground">Dataset overview</div>
            <div className="grid grid-cols-2 divide-x divide-y divide-border">
              {[
                { label: 'Rows', value: analysis.rows.toLocaleString() },
                { label: 'Columns', value: analysis.columns },
                { label: 'Missing values', value: `${analysis.missingValues}%` },
                { label: 'Duplicates', value: `${analysis.duplicates}%` },
                { label: 'Data types', value: analysis.dataTypes },
                { label: 'Target balance', value: analysis.targetBalance },
              ].map((item) => (
                <div key={item.label} className="px-4 py-2.5">
                  <div className="text-[10px] text-muted-foreground">{item.label}</div>
                  <div className="text-[13px] font-semibold text-foreground mt-0.5">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Readiness breakdown */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="text-[12px] font-semibold text-foreground mb-2">Readiness breakdown</div>
            {Object.entries(analysis.readinessBreakdown).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground w-24 capitalize">{key}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', val >= 80 ? 'bg-emerald-500' : val >= 65 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${val}%` }} />
                </div>
                <span className="text-[11px] font-medium text-foreground w-6 text-right tabular">{val}</span>
              </div>
            ))}
          </div>

          {/* Recommendations with ignore explainer */}
          {analysis.recommendations.length > 0 && (
            <div className="space-y-3">
              <div className="text-[12px] font-semibold text-foreground">Recommendations</div>
              {analysis.recommendations.filter(r => r.id !== 'rec-ai').map((rec) => (
                <div key={rec.id} className={cn(
                  'rounded-xl border p-4',
                  rec.severity === 'high' ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/10' :
                  rec.severity === 'medium' ? 'border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/10' :
                  'border-border bg-muted/20'
                )}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertCircle size={13} className={rec.severity === 'high' ? 'text-amber-600 dark:text-amber-400' : rec.severity === 'medium' ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'} />
                    <span className="text-[13px] font-semibold text-foreground">{rec.title}</span>
                    <Badge variant={rec.severity === 'high' ? 'warning' : rec.severity === 'medium' ? 'default' : 'secondary'}>{rec.severity}</Badge>
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{rec.description}</p>
                  {rec.potentialImpact.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {rec.potentialImpact.map((item: string) => (
                        <span key={item} className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">{item}</span>
                      ))}
                    </div>
                  )}
                  <IgnoreExplainer rec={rec} />
                </div>
              ))}
            </div>
          )}

          <Button size="lg" onClick={() => navigate(`/projects/${id}/checkpoint`)}>
            Continue to build plan <ArrowRight size={15} />
          </Button>
        </div>
      )}
    </div>
  );
}
