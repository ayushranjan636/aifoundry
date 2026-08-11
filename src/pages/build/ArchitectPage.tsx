import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowRight, ChevronDown, ChevronUp, CheckCircle2, Info,
  Zap, Database, BrainCircuit, MessageSquare, Search,
  DollarSign, Clock, Server, Cpu, RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ThinkingAnimation } from '../../components/ui/ThinkingAnimation';
import { aiFoundryService } from '../../services/aiFoundryService';
import { cn } from '../../lib/utils';
import type { ArchitectureOption, ModelOption, ApproachType, ModelId } from '../../types';

// ── Terminology glossary ──────────────────────────────────────
const APPROACH_TERMS: Record<ApproachType, { term: string; plain: string }[]> = {
  'fine-tuning': [
    { term: 'Fine-tuning', plain: 'Training a pre-built model further on your specific data to specialize its behavior.' },
    { term: 'LoRA', plain: 'A technique that trains only a small subset of model weights, making fine-tuning faster and cheaper.' },
    { term: 'Training loss', plain: 'A number that decreases as the model learns — closer to 0 means better learning.' },
    { term: 'Epochs', plain: 'One complete pass through your entire training dataset. More epochs = more learning.' },
  ],
  'rag': [
    { term: 'RAG', plain: 'Retrieval-Augmented Generation — the model looks up relevant information before generating a response.' },
    { term: 'Vector store', plain: 'A database that stores your documents as mathematical vectors for fast similarity search.' },
    { term: 'Embeddings', plain: 'A way of representing text as numbers so the model can find semantically similar content.' },
    { term: 'Chunking', plain: 'Splitting documents into smaller pieces so they can be indexed and retrieved efficiently.' },
  ],
  'prompting': [
    { term: 'System prompt', plain: 'Instructions given to the model before the conversation starts to define its role and behavior.' },
    { term: 'Few-shot', plain: 'Providing a few input-output examples in the prompt to guide the model\'s responses.' },
    { term: 'Temperature', plain: 'Controls randomness — lower = more predictable, higher = more creative.' },
    { term: 'Context window', plain: 'The maximum amount of text a model can process at once, measured in tokens.' },
  ],
  'slm': [
    { term: 'SLM', plain: 'Small Language Model — a compact model optimized for one specific task rather than general use.' },
    { term: 'Quantization', plain: 'Compressing model weights to reduce size and speed up inference with minimal quality loss.' },
    { term: 'ONNX', plain: 'A standard format for deploying models across different hardware and platforms.' },
    { term: 'Edge deployment', plain: 'Running the model directly on a device (phone, server) rather than in the cloud.' },
  ],
};

const MODEL_TERMS = [
  { term: 'Parameters', plain: 'The number of learned values in a model. More parameters generally = more capability, more cost.' },
  { term: 'Inference', plain: 'The act of running input through a trained model to get a prediction or output.' },
  { term: 'Context length', plain: 'How much text the model can read at once. Longer = better for documents.' },
  { term: 'Open weights', plain: 'Models where the trained weights are publicly available, enabling self-hosting.' },
];

const APPROACH_ICONS: Record<ApproachType, React.ReactNode> = {
  'fine-tuning': <Zap size={18} />,
  'rag': <Search size={18} />,
  'prompting': <MessageSquare size={18} />,
  'slm': <Database size={18} />,
};

const COST_COLOR = { low: 'text-emerald-600 dark:text-emerald-400', medium: 'text-amber-600 dark:text-amber-400', high: 'text-red-500' };

const THINKING_STEPS = [
  'Reading your objective and constraints',
  'Evaluating architecture approaches',
  'Scoring fine-tuning, RAG, prompting, SLM',
  'Selecting foundation model candidates',
  'Generating recommendation with reasoning',
];

export function ArchitectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [thinking, setThinking] = useState(true);
  const [approaches, setApproaches] = useState<ArchitectureOption[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedApproach, setSelectedApproach] = useState<ApproachType | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelId | null>(null);
  const [showApproachOptions, setShowApproachOptions] = useState(false);
  const [showModelOptions, setShowModelOptions] = useState(false);
  const [showApproachTerms, setShowApproachTerms] = useState(false);
  const [showModelTerms, setShowModelTerms] = useState(false);

  useEffect(() => {
    if (!id) return;
    const project = aiFoundryService.getProject(id);
    if (!project) return;

    // Restore previous selections
    if (project.selectedApproach) setSelectedApproach(project.selectedApproach);
    if (project.selectedModel) setSelectedModel(project.selectedModel);

    // Minimum thinking time = 3s (so animation completes), then fetch
    const minThink = new Promise((r) => setTimeout(r, 3200));

    const fetchData = aiFoundryService.analyzeUseCase(
      id,
      project.objective || '',
      project.inputFormats,
      project.outputFormats,
      project.constraints
    ).then((opts) => {
      setApproaches(opts);
      const best = opts.find((o) => o.recommended);
      if (!project.selectedApproach && best) setSelectedApproach(best.id);
      return aiFoundryService.getModelOptions(best?.id || 'fine-tuning');
    }).then((mods) => {
      setModels(mods);
      const bestModel = mods.find((m) => m.recommended);
      if (!project.selectedModel && bestModel) setSelectedModel(bestModel.id);
    });

    Promise.all([minThink, fetchData]).then(() => setThinking(false));
  }, [id]);

  const recommendedApproach = approaches.find((a) => a.recommended);
  const currentApproach = approaches.find((a) => a.id === selectedApproach);
  const recommendedModel = models.find((m) => m.recommended);
  const currentModel = models.find((m) => m.id === selectedModel);

  const handleApproachChange = async (approach: ApproachType) => {
    setSelectedApproach(approach);
    setShowApproachOptions(false);
    // Reload models for new approach
    const newModels = await aiFoundryService.getModelOptions(approach);
    setModels(newModels);
    const best = newModels.find((m) => m.recommended);
    if (best) setSelectedModel(best.id);
  };

  const handleContinue = async () => {
    if (!id || !selectedApproach || !selectedModel) return;
    await aiFoundryService.selectApproach(id, selectedApproach);
    await aiFoundryService.selectModel(id, selectedModel);
    navigate(`/projects/${id}/data`);
  };

  if (thinking) {
    return (
      <div className="p-6 max-w-xl mx-auto pt-10 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-[24px] font-bold text-foreground">Analyzing your use case</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Foundry is evaluating every architecture approach and foundation model against your specific requirements.
          </p>
        </div>
        <ThinkingAnimation steps={THINKING_STEPS} title="Thinking…" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-7 animate-fade-in">
      <div>
        <h1 className="text-[24px] font-bold text-foreground">Here's what we recommend.</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Based on your objective, data, and constraints — you can accept or change anything.
        </p>
      </div>

      {/* ── APPROACH SECTION ──────────────────────────────── */}
      <div className="space-y-3">
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Architecture approach</div>

        {/* Recommended card */}
        {currentApproach && (
          <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary shrink-0">
                {APPROACH_ICONS[currentApproach.id]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[16px] font-bold text-foreground">{currentApproach.name}</span>
                  <Badge variant="default">{currentApproach.fitScore}% fit</Badge>
                  {currentApproach.recommended && <Badge variant="success">Recommended</Badge>}
                </div>
                <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">{currentApproach.description}</p>

                {/* Why + advantages */}
                <div className="mt-3 grid sm:grid-cols-2 gap-2">
                  {currentApproach.advantages.map((adv) => (
                    <div key={adv} className="flex items-center gap-1.5 text-[12px] text-foreground">
                      <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                      {adv}
                    </div>
                  ))}
                </div>

                {/* Why this / Change */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-primary/20">
                  <button
                    onClick={() => setShowApproachTerms((s) => !s)}
                    className="flex items-center gap-1 text-[12px] text-primary hover:underline"
                  >
                    <Info size={11} />
                    Why {currentApproach.name}?
                    {showApproachTerms ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  </button>
                  <button
                    onClick={() => setShowApproachOptions((s) => !s)}
                    className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RefreshCw size={11} />
                    Change approach
                    {showApproachOptions ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Why section */}
            {showApproachTerms && (
              <div className="mt-4 border-t border-primary/20 pt-4 space-y-3 animate-fade-in-fast">
                <div className="text-[12px] font-semibold text-foreground">Why {currentApproach.name} for your use case?</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {currentApproach.bestFor.map((b) => (
                    <div key={b} className="flex items-center gap-1.5 text-[12px] text-muted-foreground bg-background rounded-lg px-2 py-1.5 border border-border">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />{b}
                    </div>
                  ))}
                </div>
                <div className="text-[12px] font-semibold text-foreground mt-2">Limitations to know</div>
                {currentApproach.limitations.map((l) => (
                  <div key={l} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />{l}
                  </div>
                ))}
                {/* Glossary */}
                <div className="mt-2 pt-2 border-t border-border">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Terminology</div>
                  <div className="space-y-1.5">
                    {APPROACH_TERMS[currentApproach.id]?.map((t) => (
                      <div key={t.term} className="text-[11px]">
                        <span className="font-semibold text-foreground">{t.term}</span>
                        <span className="text-muted-foreground"> — {t.plain}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Change approach panel */}
        {showApproachOptions && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 animate-fade-in-fast">
            <div className="text-[12px] font-semibold text-foreground mb-3">Select a different approach</div>
            {approaches.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleApproachChange(opt.id)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
                  opt.id === selectedApproach
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-background hover:border-primary/40'
                )}
              >
                <span className={opt.id === selectedApproach ? 'text-primary' : 'text-muted-foreground'}>
                  {APPROACH_ICONS[opt.id]}
                </span>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-foreground">{opt.name}</div>
                  <div className="text-[11px] text-muted-foreground">{opt.description.slice(0, 60)}…</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[12px] font-bold text-foreground">{opt.fitScore}%</div>
                  <div className="text-[10px] text-muted-foreground">fit</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── MODEL SECTION ─────────────────────────────────── */}
      <div className="space-y-3">
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Foundation model</div>

        {currentModel && (
          <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/10 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Cpu size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[16px] font-bold text-foreground">{currentModel.name}</span>
                  <span className="text-[12px] text-muted-foreground">{currentModel.provider}</span>
                  <Badge variant="success">{currentModel.fitScore}% fit</Badge>
                  {currentModel.recommended && <Badge variant="default">Recommended</Badge>}
                </div>
                <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">{currentModel.description}</p>

                {/* Model meta */}
                <div className="flex items-center gap-4 mt-3 text-[11px]">
                  <span className={cn('flex items-center gap-1', COST_COLOR[currentModel.costIndicator])}>
                    <DollarSign size={11} />
                    {currentModel.costIndicator === 'low' ? 'Low cost' : currentModel.costIndicator === 'medium' ? 'Medium cost' : 'Higher cost'}
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Clock size={11} />
                    {currentModel.speedIndicator === 'fast' ? 'Fast inference' : currentModel.speedIndicator === 'medium' ? 'Medium speed' : 'Slower'}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Server size={11} />
                    {currentModel.deploymentComplexity === 'simple' ? 'Simple deploy' : 'Moderate deploy'}
                  </span>
                  <span className="font-mono text-muted-foreground">{currentModel.parameters}</span>
                </div>

                {/* Why this / Change */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-emerald-200/50 dark:border-emerald-800/30">
                  <button
                    onClick={() => setShowModelTerms((s) => !s)}
                    className="flex items-center gap-1 text-[12px] text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    <Info size={11} />
                    Why {currentModel.name}?
                    {showModelTerms ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  </button>
                  <button
                    onClick={() => setShowModelOptions((s) => !s)}
                    className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RefreshCw size={11} />
                    Change model
                    {showModelOptions ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Why model */}
            {showModelTerms && (
              <div className="mt-4 border-t border-emerald-200/50 dark:border-emerald-800/30 pt-4 space-y-3 animate-fade-in-fast">
                <div className="text-[12px] font-semibold text-foreground">Why {currentModel.name} for your use case?</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {currentModel.capabilities.map((c) => (
                    <div key={c} className="flex items-center gap-1.5 text-[12px] text-muted-foreground bg-background rounded-lg px-2 py-1.5 border border-border">
                      <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />{c}
                    </div>
                  ))}
                </div>
                <div className="text-[12px]"><span className="font-semibold text-foreground">Best for: </span>
                  <span className="text-muted-foreground">{currentModel.useCases.join(', ')}</span>
                </div>
                {/* Glossary */}
                <div className="mt-2 pt-2 border-t border-border">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Model terminology</div>
                  <div className="space-y-1.5">
                    {MODEL_TERMS.map((t) => (
                      <div key={t.term} className="text-[11px]">
                        <span className="font-semibold text-foreground">{t.term}</span>
                        <span className="text-muted-foreground"> — {t.plain}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Change model panel */}
        {showModelOptions && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 animate-fade-in-fast">
            <div className="text-[12px] font-semibold text-foreground mb-3">Select a different model</div>
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => { setSelectedModel(m.id); setShowModelOptions(false); }}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
                  m.id === selectedModel ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/10' : 'border-border bg-background hover:border-primary/40'
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-foreground">{m.name}</span>
                    <span className="text-[11px] text-muted-foreground">{m.provider}</span>
                    {m.recommended && <Badge variant="default" className="text-[10px]">Recommended</Badge>}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{m.description.slice(0, 70)}…</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-bold text-foreground">{m.fitScore}%</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{m.parameters}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pt-1">
        <Button size="lg" onClick={handleContinue} disabled={!selectedApproach || !selectedModel} className="w-full sm:w-auto">
          Confirm and continue to data
          <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  );
}
