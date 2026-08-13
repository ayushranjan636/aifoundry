import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight, FileText, Table2, ImageIcon, Mic, Video,
  AlignLeft, Tag, TrendingUp, List, Star, Braces, Layers,
  Database, Camera, Film, AudioLines, Sparkles,
  CheckCircle2, Loader2, MessageCircle, ChevronRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Input';
import { aiFoundryService } from '../../services/aiFoundryService';
import {
  generateClarifyingQuestions,
  parseRequirement,
  cleanAndImprovePrompt,
} from '../../services/recommendationEngine';
import { cn } from '../../lib/utils';
import type { InputFormat, OutputFormat, ClarifyingQuestion, TrainingDataType } from '../../types';

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

const TRAINING_DATA_TYPES: { id: TrainingDataType; label: string; description: string; icon: React.ReactNode }[] = [
  { id: 'text', label: 'Text Data', description: 'Conversations, articles, logs', icon: <AlignLeft size={16} /> },
  { id: 'photo', label: 'Photos / Images', description: 'Train on visual data', icon: <Camera size={16} /> },
  { id: 'video', label: 'Video', description: 'Video content for training', icon: <Film size={16} /> },
  { id: 'voice', label: 'Voice / Audio', description: 'Speech and audio patterns', icon: <AudioLines size={16} /> },
  { id: 'documents', label: 'Documents', description: 'PDFs, docs, knowledge base', icon: <FileText size={16} /> },
  { id: 'structured', label: 'Structured Data', description: 'Tables, CSV, databases', icon: <Table2 size={16} /> },
];

const DATASET_SIZE_OPTIONS = [
  { id: 'none', label: 'No data yet', sub: 'I\'ll collect data later', icon: '—' },
  { id: 'tiny', label: '< 1,000 examples', sub: 'Very limited', icon: '🔴' },
  { id: 'small', label: '1K – 10K examples', sub: 'Sufficient for simple tasks', icon: '🟡' },
  { id: 'medium', label: '10K – 100K examples', sub: 'Good for most use cases', icon: '🟢' },
  { id: 'large', label: '100K – 1M examples', sub: 'Excellent', icon: '🟢' },
  { id: 'xlarge', label: '1M+ examples', sub: 'Enterprise scale', icon: '🟢' },
];

export function DefinePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [objective, setObjective] = useState('');
  const [cleanedObjective, setCleanedObjective] = useState('');
  const [isCleaningPrompt, setIsCleaningPrompt] = useState(false);
  const [showCleanedVersion, setShowCleanedVersion] = useState(false);
  const [selectedInputs, setSelectedInputs] = useState<InputFormat[]>([]);
  const [selectedOutputs, setSelectedOutputs] = useState<OutputFormat[]>([]);
  const [trainingDataTypes, setTrainingDataTypes] = useState<TrainingDataType[]>([]);
  const [constraints, setConstraints] = useState('');
  const [datasetSize, setDatasetSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Clarifying questions state
  const [questions, setQuestions] = useState<ClarifyingQuestion[]>([]);
  const [showQuestions, setShowQuestions] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  // Free-text answers per question
  const [freeTextAnswers, setFreeTextAnswers] = useState<Record<string, string>>({});
  // Track which objective we last generated questions for to avoid redundant calls
  const lastQueriedObjective = useRef('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) return;
    const project = aiFoundryService.getProject(id);
    if (project) {
      if (project.objective) setObjective(project.objective);
      if (project.inputFormats?.length) setSelectedInputs(project.inputFormats);
      if (project.outputFormats?.length) setSelectedOutputs(project.outputFormats);
      if (project.constraints) setConstraints(project.constraints);
      if (project.trainingDataTypes?.length) setTrainingDataTypes(project.trainingDataTypes);
      if (project.clarifyingQuestions?.length) {
        setQuestions(project.clarifyingQuestions);
        setShowQuestions(true);
        lastQueriedObjective.current = project.objective ?? '';
      }
    }
  }, [id]);

  // Auto-trigger clarifying questions after the user pauses typing (1.2s debounce)
  useEffect(() => {
    const trimmed = objective.trim();
    if (trimmed.length < 30 || trimmed === lastQueriedObjective.current) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      if (trimmed === lastQueriedObjective.current) return;
      lastQueriedObjective.current = trimmed;
      setLoadingQuestions(true);
      setShowQuestions(false);
      try {
        const profile = await parseRequirement(trimmed);
        const qs = await generateClarifyingQuestions(trimmed, profile);
        setQuestions(qs);
        setShowQuestions(qs.length > 0);
        setFreeTextAnswers({});
      } finally {
        setLoadingQuestions(false);
      }
    }, 1200);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [objective]);

  const toggle = <T extends string>(arr: T[], id: T): T[] =>
    arr.includes(id) ? arr.filter((i) => i !== id) : [...arr, id];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!objective.trim()) errs.objective = 'Please describe what you want your AI to do.';
    if (selectedInputs.length === 0) errs.inputs = 'Select at least one input type.';
    if (selectedOutputs.length === 0) errs.outputs = 'Select at least one output type.';
    return errs;
  };

  const handleCleanPrompt = useCallback(async () => {
    if (!objective.trim() || objective.trim().length < 20) return;
    setIsCleaningPrompt(true);
    try {
      const cleaned = await cleanAndImprovePrompt(objective);
      if (cleaned !== objective) {
        setCleanedObjective(cleaned);
        setShowCleanedVersion(true);
      }
    } finally {
      setIsCleaningPrompt(false);
    }
  }, [objective]);

  const handleAcceptCleaned = () => {
    setObjective(cleanedObjective);
    setShowCleanedVersion(false);
    setCleanedObjective('');
  };

  const handleAnswerQuestion = (questionId: string, answer: string) => {
    setQuestions((prev) =>
      prev.map((q) => q.id === questionId ? { ...q, answer } : q)
    );
    setFreeTextAnswers((prev) => ({ ...prev, [questionId]: '' }));
  };

  const handleFreeTextChange = (questionId: string, value: string) => {
    setFreeTextAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleFreeTextSubmit = (questionId: string) => {
    const value = (freeTextAnswers[questionId] ?? '').trim();
    if (!value) return;
    handleAnswerQuestion(questionId, value);
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
        trainingDataTypes,
        clarifyingQuestions: questions,
        ...(datasetSize ? { constraints: [constraints, `Dataset size: ${datasetSize}`].filter(Boolean).join('. ') } : {}),
      });
      navigate(`/projects/${id}/architect`);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-7 animate-fade-in">
      <div>
        <h1 className="text-[24px] font-bold text-foreground">What do you want your AI to do?</h1>
        <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
          Describe the problem in your own words. We'll analyze your requirement, ask clarifying questions if needed, and recommend the best architecture automatically.
        </p>
      </div>

      {/* Objective with AI polish */}
      <div className="space-y-2">
        <Textarea
          label="Describe your AI"
          rows={4}
          placeholder="Example: I want an AI that analyzes customer support tickets and automatically routes them to the right team based on urgency and topic — billing issues, technical problems, or general inquiries."
          value={objective}
          onChange={(e) => {
            setObjective(e.target.value);
            if (errors.objective) setErrors((p) => ({ ...p, objective: '' }));
            setShowCleanedVersion(false);
          }}
          error={errors.objective}
        />

        {/* AI improve prompt button */}
        {objective.trim().length >= 20 && !showCleanedVersion && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCleanPrompt}
              disabled={isCleaningPrompt}
              className="flex items-center gap-1.5 text-[12px] text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
            >
              {isCleaningPrompt ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {isCleaningPrompt ? 'Improving...' : 'Improve with AI'}
            </button>
          </div>
        )}

        {/* Cleaned version suggestion */}
        {showCleanedVersion && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-primary">
              <Sparkles size={13} />
              AI-improved version
            </div>
            <p className="text-[13px] text-foreground leading-relaxed">{cleanedObjective}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAcceptCleaned}
                className="px-3 py-1.5 text-[11px] font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Use this version
              </button>
              <button
                onClick={() => setShowCleanedVersion(false)}
                className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Keep original
              </button>
            </div>
          </div>
        )}

        {/* Inline clarifying questions — auto-triggered after typing */}
        {(loadingQuestions || (showQuestions && questions.length > 0)) && (
          <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-muted/30">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {loadingQuestions
                  ? <Loader2 size={11} className="text-primary animate-spin" />
                  : <MessageCircle size={11} className="text-primary" />
                }
              </div>
              <div className="text-[12px] font-semibold text-foreground">
                {loadingQuestions ? 'Analyzing your prompt…' : 'A few things to clarify'}
              </div>
              {!loadingQuestions && (
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {questions.filter(q => q.answer).length}/{questions.length} answered
                </span>
              )}
            </div>

            {/* Questions */}
            {!loadingQuestions && (
              <div className="divide-y divide-border">
                {questions.map((q, idx) => (
                  <div key={q.id} className="px-4 py-3.5 space-y-2.5">
                    {/* Question */}
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 text-[10px] font-bold text-muted-foreground w-4">{idx + 1}.</span>
                      <p className="text-[12.5px] font-medium text-foreground leading-snug">{q.question}</p>
                    </div>

                    {/* Option chips */}
                    {q.options && q.options.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-6">
                        {q.options.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => handleAnswerQuestion(q.id, opt)}
                            className={cn(
                              'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-150',
                              q.answer === opt
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                            )}
                          >
                            {q.answer === opt && <CheckCircle2 size={9} className="inline mr-1 mb-0.5" />}
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Free-text fallback */}
                    <div className="pl-6 flex items-center gap-2">
                      {q.answer ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={11} />
                          <span className="font-medium">{q.answer}</span>
                          <button
                            onClick={() => handleAnswerQuestion(q.id, '')}
                            className="ml-1 text-muted-foreground hover:text-foreground text-[10px] underline"
                          >
                            change
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 w-full max-w-xs">
                          <input
                            type="text"
                            value={freeTextAnswers[q.id] ?? ''}
                            onChange={(e) => handleFreeTextChange(q.id, e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleFreeTextSubmit(q.id); }}
                            placeholder="Or type your own answer…"
                            className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                          />
                          <button
                            onClick={() => handleFreeTextSubmit(q.id)}
                            disabled={!(freeTextAnswers[q.id] ?? '').trim()}
                            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30"
                          >
                            <ChevronRight size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loading skeleton rows */}
            {loadingQuestions && (
              <div className="divide-y divide-border">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="px-4 py-3.5 space-y-2 animate-pulse">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="flex gap-1.5 pl-6">
                      <div className="h-6 w-16 bg-muted rounded-full" />
                      <div className="h-6 w-20 bg-muted rounded-full" />
                      <div className="h-6 w-14 bg-muted rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Training Data Types */}
      <div className="space-y-3">
        <div>
          <div className="text-[13px] font-semibold text-foreground">What kind of training data will you provide?</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Select all data types you plan to use for training</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {TRAINING_DATA_TYPES.map((dt) => (
            <button
              key={dt.id}
              onClick={() => setTrainingDataTypes(toggle(trainingDataTypes, dt.id))}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all duration-150',
                trainingDataTypes.includes(dt.id)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {dt.icon}
              <span className="text-[11px] font-medium">{dt.label}</span>
              <span className="text-[9px] text-muted-foreground leading-tight">{dt.description}</span>
            </button>
          ))}
        </div>
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

      {/* Dataset size */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <Database size={14} className="text-primary" />
            <div className="text-[13px] font-semibold text-foreground">How much data do you have?</div>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            This directly influences which architecture and approach we recommend.
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
