import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowRight, ChevronDown, ChevronUp, CheckCircle2, Info,
  Zap, Database, BrainCircuit, MessageSquare, Search,
  DollarSign, Clock, Server, Cpu, RefreshCw, Sparkles,
  TrendingUp, Shield, Target, Layers,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ThinkingAnimation } from '../../components/ui/ThinkingAnimation';
import { aiFoundryService } from '../../services/aiFoundryService';
import {
  parseRequirement,
  generateRecommendation,
} from '../../services/recommendationEngine';
import { cn } from '../../lib/utils';
import type { ArchitectureOption, ModelOption, ApproachType, ModelId, AIRecommendation } from '../../types';

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

const APPROACH_ICONS: Record<ApproachType, React.ReactNode> = {
  'fine-tuning': <Zap size={18} />,
  'rag': <Search size={18} />,
  'prompting': <MessageSquare size={18} />,
  'slm': <Database size={18} />,
};

const APPROACH_LABELS: Record<ApproachType, string> = {
  'fine-tuning': 'Fine-tuning',
  'rag': 'RAG',
  'prompting': 'Prompting',
  'slm': 'Small Language Model',
};

const COST_COLOR = { low: 'text-emerald-600 dark:text-emerald-400', medium: 'text-amber-600 dark:text-amber-400', high: 'text-red-500' };

const THINKING_STEPS = [
  'Reading your objective and constraints',
  'Parsing requirement into structured profile',
  'Evaluating architecture combinations',
  'Scoring models against your needs',
  'Calculating cost/quality tradeoffs',
  'Generating personalized recommendation',
];

export function ArchitectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [thinking, setThinking] = useState(true);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [approaches, setApproaches] = useState<ArchitectureOption[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedApproach, setSelectedApproach] = useState<ApproachType | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelId | null>(null);
  const [showApproachOptions, setShowApproachOptions] = useState(false);
  const [showModelOptions, setShowModelOptions] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    if (!id) return;
    const project = aiFoundryService.getProject(id);
    if (!project) return;

    if (project.selectedApproach) setSelectedApproach(project.selectedApproach);
    if (project.selectedModel) setSelectedModel(project.selectedModel);

    const minThink = new Promise((r) => setTimeout(r, 3500));

    const fetchRecommendation = async () => {
      // Parse the requirement into a profile
      const profile = await parseRequirement(project.objective || '');
      const fullProfile = {
        useCase: profile.useCase || 'general',
        taskType: profile.taskType || 'general',
        dataSize: profile.dataSize || 'medium',
        dataIsPrivate: profile.dataIsPrivate ?? false,
        knowledgeChangesFrequently: profile.knowledgeChangesFrequently ?? false,
        expectedQueriesPerDay: profile.expectedQueriesPerDay ?? null,
        latencyRequirement: profile.latencyRequirement ?? 'medium',
        budget: profile.budget || 'unknown',
        deploymentRequirement: profile.deploymentRequirement ?? null,
        outputType: profile.outputType || 'mixed',
        complexityLevel: profile.complexityLevel || 'moderate',
        needsCitations: profile.needsCitations ?? false,
        needsDeterminism: profile.needsDeterminism ?? false,
      };

      // Generate AI-powered recommendation
      const rec = await generateRecommendation(
        project.objective || '',
        fullProfile,
        project.clarifyingQuestions || []
      );
      setRecommendation(rec);

      // Also get the legacy architecture options for the "change approach" panel
      const opts = await aiFoundryService.analyzeUseCase(
        id,
        project.objective || '',
        project.inputFormats,
        project.outputFormats,
        project.constraints
      );
      setApproaches(opts);

      // Set primary selection from recommendation
      if (rec.architecture.techniques.length > 0 && !project.selectedApproach) {
        const primaryTechnique = rec.architecture.techniques.includes('fine-tuning')
          ? 'fine-tuning'
          : rec.architecture.techniques.includes('rag')
          ? 'rag'
          : rec.architecture.techniques[0];
        setSelectedApproach(primaryTechnique);
      }

      // Get models
      const primaryApproach = rec.architecture.techniques[0] || 'prompting';
      const mods = await aiFoundryService.getModelOptions(primaryApproach);
      setModels(mods);

      if (rec.recommendedModels.length > 0 && !project.selectedModel) {
        setSelectedModel(rec.recommendedModels[0].modelId);
      } else if (!project.selectedModel) {
        const bestModel = mods.find((m) => m.recommended);
        if (bestModel) setSelectedModel(bestModel.id);
      }

      // Store recommendation on project
      aiFoundryService.updateProject(id, {
        aiRecommendation: rec,
        requirementProfile: fullProfile,
      });
    };

    Promise.all([minThink, fetchRecommendation()]).then(() => setThinking(false));
  }, [id]);

  const handleApproachChange = async (approach: ApproachType) => {
    setSelectedApproach(approach);
    setShowApproachOptions(false);
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
            Our AI is evaluating every architecture approach, model combination, and cost-quality tradeoff for your specific requirements.
          </p>
        </div>
        <ThinkingAnimation steps={THINKING_STEPS} title="Thinking…" />
      </div>
    );
  }

  const currentModel = models.find((m) => m.id === selectedModel);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-7 animate-fade-in">
      <div>
        <h1 className="text-[24px] font-bold text-foreground">Here's our recommendation</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Based on your requirements, data, and constraints — optimized for the simplest architecture that meets your quality needs.
        </p>
      </div>

      {/* AI Recommendation Summary Card */}
      {recommendation && (
        <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <span className="text-[14px] font-bold text-foreground">Recommended Architecture</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10">
              <Target size={11} className="text-primary" />
              <span className="text-[12px] font-semibold text-primary">{Math.round(recommendation.confidence * 100)}% confidence</span>
            </div>
          </div>

          {/* Architecture combo */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default" className="text-[12px] px-3 py-1">
              {recommendation.architecture.modelSize} model
            </Badge>
            {recommendation.architecture.techniques.map((tech) => (
              <Badge key={tech} variant="success" className="text-[12px] px-3 py-1 flex items-center gap-1">
                {APPROACH_ICONS[tech]}
                {APPROACH_LABELS[tech]}
              </Badge>
            ))}
          </div>

          {/* Top model recommendations */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Recommended models</div>
            <div className="grid gap-2">
              {recommendation.recommendedModels.map((model, idx) => (
                <div
                  key={model.modelId}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer',
                    selectedModel === model.modelId
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background hover:border-primary/40'
                  )}
                  onClick={() => setSelectedModel(model.modelId)}
                >
                  <div className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-bold shrink-0',
                    idx === 0 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                  )}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-foreground">{model.model}</span>
                      <span className="text-[11px] text-muted-foreground">{model.provider}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{model.reason}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[13px] font-bold text-foreground">{model.score}%</div>
                    <div className="text-[10px] text-muted-foreground">fit</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reasoning section */}
          <div>
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-1.5 text-[12px] text-primary hover:underline"
            >
              <Info size={12} />
              Why this recommendation?
              {showReasoning ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            {showReasoning && (
              <div className="mt-3 space-y-2 animate-fade-in">
                {recommendation.reasoning.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                    {reason}
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="text-[11px] font-medium text-foreground mb-1">Cost estimate</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <DollarSign size={10} />
                    {recommendation.costEstimate}
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-[11px] font-medium text-foreground mb-1">Alternative approach</div>
                  <div className="text-[11px] text-muted-foreground">
                    <span className="font-medium">{recommendation.alternative.description}</span>
                    {' — '}{recommendation.alternative.when}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Architecture Approach */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Primary technique</div>
          <button
            onClick={() => setShowApproachOptions(!showApproachOptions)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw size={10} />
            Change
          </button>
        </div>

        {selectedApproach && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary shrink-0">
              {APPROACH_ICONS[selectedApproach]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-foreground">{APPROACH_LABELS[selectedApproach]}</span>
                <Badge variant="success">Selected</Badge>
              </div>
              {recommendation && recommendation.architecture.techniques.length > 1 && (
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Combined with: {recommendation.architecture.techniques
                    .filter((t) => t !== selectedApproach)
                    .map((t) => APPROACH_LABELS[t])
                    .join(', ')}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowTerms(!showTerms)}
              className="text-[11px] text-primary hover:underline flex items-center gap-1"
            >
              <Info size={10} />
              Terms
            </button>
          </div>
        )}

        {/* Terminology glossary */}
        {showTerms && selectedApproach && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 animate-fade-in">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Terminology</div>
            {APPROACH_TERMS[selectedApproach]?.map((t) => (
              <div key={t.term} className="text-[11px]">
                <span className="font-semibold text-foreground">{t.term}</span>
                <span className="text-muted-foreground"> — {t.plain}</span>
              </div>
            ))}
          </div>
        )}

        {/* Change approach panel */}
        {showApproachOptions && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 animate-fade-in">
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

      {/* Model Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Foundation model</div>
          <button
            onClick={() => setShowModelOptions(!showModelOptions)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw size={10} />
            Change
          </button>
        </div>

        {currentModel && (
          <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/10 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Cpu size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-bold text-foreground">{currentModel.name}</span>
                  <span className="text-[12px] text-muted-foreground">{currentModel.provider}</span>
                  <Badge variant="success">{currentModel.fitScore}% fit</Badge>
                </div>
                <p className="text-[12px] text-muted-foreground mt-1">{currentModel.description}</p>
                <div className="flex items-center gap-4 mt-2 text-[11px]">
                  <span className={cn('flex items-center gap-1', COST_COLOR[currentModel.costIndicator])}>
                    <DollarSign size={10} />
                    {currentModel.costIndicator === 'low' ? 'Low cost' : currentModel.costIndicator === 'medium' ? 'Medium cost' : 'Higher cost'}
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Clock size={10} />
                    {currentModel.speedIndicator === 'fast' ? 'Fast' : currentModel.speedIndicator === 'medium' ? 'Medium' : 'Slower'}
                  </span>
                  <span className="font-mono text-muted-foreground">{currentModel.parameters}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Change model panel */}
        {showModelOptions && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 animate-fade-in">
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
