import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight, FileText, Table2, ImageIcon, Mic, Video,
  AlignLeft, Tag, TrendingUp, List, Star, Braces, Layers,
  Database, ChevronDown,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Input';
import { aiFoundryService } from '../../services/aiFoundryService';
import { cn } from '../../lib/utils';
import type { InputFormat, OutputFormat } from '../../types';

const INPUT_FORMATS: { id: InputFormat; label: string; icon: React.ReactNode }[] = [
  { id: 'text', label: 'Text', icon: <AlignLeft size={15} /> },
  { id: 'documents', label: 'Documents', icon: <FileText size={15} /> },
  { id: 'tables', label: 'Tables / CSV', icon: <Table2 size={15} /> },
  { id: 'images', label: 'Images', icon: <ImageIcon size={15} /> },
  { id: 'audio', label: 'Audio', icon: <Mic size={15} /> },
  { id: 'video', label: 'Video', icon: <Video size={15} /> },
  { id: 'multiple', label: 'Multiple formats', icon: <Layers size={15} /> },
];

const OUTPUT_FORMATS: { id: OutputFormat; label: string; description: string; icon: React.ReactNode }[] = [
  { id: 'prediction', label: 'Prediction', description: 'Yes/No, binary or multi-class', icon: <Star size={15} /> },
  { id: 'classification', label: 'Classification', description: 'Assign to a category', icon: <Tag size={15} /> },
  { id: 'score', label: 'Score / Probability', description: 'Numeric confidence (0–1)', icon: <TrendingUp size={15} /> },
  { id: 'text', label: 'Text response', description: 'Free-form generated text', icon: <AlignLeft size={15} /> },
  { id: 'recommendation', label: 'Recommendation', description: 'Ranked list of options', icon: <List size={15} /> },
  { id: 'json', label: 'Structured JSON', description: 'Machine-readable output', icon: <Braces size={15} /> },
  { id: 'multiple', label: 'Multiple outputs', description: 'Combination of types', icon: <Layers size={15} /> },
];

const DATASET_SIZE_OPTIONS = [
  { id: 'none', label: 'No data yet', sub: 'I\'ll collect data later', icon: '—' },
  { id: 'tiny', label: '< 1,000 examples', sub: 'Very limited — may need augmentation', icon: '🔴' },
  { id: 'small', label: '1K – 10K examples', sub: 'Sufficient for simple tasks', icon: '🟡' },
  { id: 'medium', label: '10K – 100K examples', sub: 'Good for most use cases', icon: '🟢' },
  { id: 'large', label: '100K – 1M examples', sub: 'Excellent — enables fine-tuning', icon: '🟢' },
  { id: 'xlarge', label: '1M+ examples', sub: 'Enterprise scale', icon: '🟢' },
];

export function DefinePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [objective, setObjective] = useState('');
  const [selectedInputs, setSelectedInputs] = useState<InputFormat[]>([]);
  const [selectedOutputs, setSelectedOutputs] = useState<OutputFormat[]>([]);
  const [constraints, setConstraints] = useState('');
  const [datasetSize, setDatasetSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    const project = aiFoundryService.getProject(id);
    if (project) {
      if (project.objective) setObjective(project.objective);
      if (project.inputFormats?.length) setSelectedInputs(project.inputFormats);
      if (project.outputFormats?.length) setSelectedOutputs(project.outputFormats);
      if (project.constraints) setConstraints(project.constraints);
    }
  }, [id]);

  const toggle = <T extends string>(arr: T[], id: T): T[] =>
    arr.includes(id) ? arr.filter((i) => i !== id) : [...arr, id];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!objective.trim()) errs.objective = 'Please describe what you want your AI to do.';
    if (selectedInputs.length === 0) errs.inputs = 'Select at least one input type.';
    if (selectedOutputs.length === 0) errs.outputs = 'Select at least one output type.';
    return errs;
  };

  const handleAnalyze = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    if (id) {
      aiFoundryService.updateProject(id, {
        objective,
        inputFormats: selectedInputs,
        outputFormats: selectedOutputs,
        constraints,
        // Store dataset size as part of constraints context
        ...(datasetSize ? { constraints: [constraints, `Dataset size: ${datasetSize}`].filter(Boolean).join('. ') } : {}),
      });
      navigate(`/projects/${id}/architect`);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-7 animate-fade-in">
      <div>
        <h1 className="text-[24px] font-bold text-foreground">What do you want your AI to do?</h1>
        <p className="text-[13px] text-muted-foreground mt-1.5">
          Describe the problem in your own words. The more detail you give, the better Foundry can tailor the architecture and model selection.
        </p>
      </div>

      {/* Objective */}
      <div className="space-y-2">
        <Textarea
          label="Describe your AI"
          rows={4}
          placeholder="Example: I want an AI that analyzes customer support tickets and automatically routes them to the right team based on urgency and topic — billing issues, technical problems, or general inquiries."
          value={objective}
          onChange={(e) => { setObjective(e.target.value); if (errors.objective) setErrors((p) => ({ ...p, objective: '' })); }}
          error={errors.objective}
        />
      </div>

      {/* Input formats */}
      <div className="space-y-3">
        <div>
          <div className="text-[13px] font-semibold text-foreground">What will your AI receive?</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Select all that apply</div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {INPUT_FORMATS.map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => { setSelectedInputs(toggle(selectedInputs, fmt.id)); if (errors.inputs) setErrors((p) => ({ ...p, inputs: '' })); }}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-[11px] font-medium transition-all duration-150',
                selectedInputs.includes(fmt.id)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {fmt.icon}
              {fmt.label}
            </button>
          ))}
        </div>
        {errors.inputs && <p className="text-[11px] text-destructive">{errors.inputs}</p>}
      </div>

      {/* Output formats */}
      <div className="space-y-3">
        <div>
          <div className="text-[13px] font-semibold text-foreground">What should your AI produce?</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Select all that apply</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {OUTPUT_FORMATS.map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => { setSelectedOutputs(toggle(selectedOutputs, fmt.id)); if (errors.outputs) setErrors((p) => ({ ...p, outputs: '' })); }}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all duration-150',
                selectedOutputs.includes(fmt.id) ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'
              )}
            >
              <span className={selectedOutputs.includes(fmt.id) ? 'text-primary' : 'text-muted-foreground'}>{fmt.icon}</span>
              <div>
                <div className={cn('text-[12px] font-semibold', selectedOutputs.includes(fmt.id) ? 'text-primary' : 'text-foreground')}>
                  {fmt.label}
                </div>
                <div className="text-[11px] text-muted-foreground">{fmt.description}</div>
              </div>
            </button>
          ))}
        </div>
        {errors.outputs && <p className="text-[11px] text-destructive">{errors.outputs}</p>}
      </div>

      {/* Dataset size — helps architecture recommendation */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <Database size={14} className="text-primary" />
            <div className="text-[13px] font-semibold text-foreground">How much data do you have?</div>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            This directly influences which architecture and approach Foundry recommends.
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DATASET_SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setDatasetSize(datasetSize === opt.id ? '' : opt.id)}
              className={cn(
                'flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition-all duration-150',
                datasetSize === opt.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/40'
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[13px]">{opt.icon}</span>
                <span className={cn('text-[12px] font-semibold', datasetSize === opt.id ? 'text-primary' : 'text-foreground')}>
                  {opt.label}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground ml-5">{opt.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Constraints */}
      <div>
        <Textarea
          label="Behavioral constraints (optional)"
          rows={3}
          placeholder="Describe rules, constraints, or requirements. E.g.: The model must return a confidence score. It should escalate when confidence is below 80%. Avoid using protected attributes directly."
          value={constraints}
          onChange={(e) => setConstraints(e.target.value)}
        />
      </div>

      <div className="pt-1">
        <Button size="lg" onClick={handleAnalyze} loading={loading} className="w-full sm:w-auto">
          Analyze my use case
          <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  );
}
