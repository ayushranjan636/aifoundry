import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Code2, MessageCircle, Globe, Lock,
  Sparkles, Clock, Users, DollarSign,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { aiFoundryService } from '../../services/aiFoundryService';
import { cn } from '../../lib/utils';
import type { DeliveryMode, ModelVisibility } from '../../types';

const DELIVERY_OPTIONS: { id: DeliveryMode; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'api',
    label: 'API / Development',
    description: 'Get a REST API endpoint and developer interface to integrate your model anywhere',
    icon: <Code2 size={20} />,
  },
  {
    id: 'chat',
    label: 'Chat Screen',
    description: 'Get a ready-to-use conversational interface your users can interact with directly',
    icon: <MessageCircle size={20} />,
  },
];

export function NewProjectPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('api');
  const [modelVisibility, setModelVisibility] = useState<ModelVisibility>('private');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) {
      setError('Please enter a project name.');
      return;
    }
    const project = aiFoundryService.createProject({
      name,
      description,
      deliveryMode,
      modelVisibility,
    });
    navigate(`/projects/${project.id}/build`);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Header with value proposition */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[12px] font-medium">
          <Sparkles size={12} />
          Custom Fine-Tuned Model in Just Few Hours
        </div>
        <h1 className="text-[28px] font-bold text-foreground">Create your AI model</h1>
        <p className="text-[14px] text-muted-foreground max-w-md mx-auto leading-relaxed">
          No need for data cleaners, architecture designers, trainers, or testers.
          Save up to <span className="text-primary font-semibold">95% of resources</span> with our automated pipeline.
        </p>
      </div>

      {/* Savings banner */}
      <div className="flex items-center justify-center gap-6 py-3 px-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
        {[
          { icon: <Clock size={13} />, text: 'Hours, not months' },
          { icon: <Users size={13} />, text: 'No ML team needed' },
          { icon: <DollarSign size={13} />, text: '95% cost savings' },
        ].map((item) => (
          <div key={item.text} className="flex items-center gap-1.5 text-[12px] text-emerald-700 dark:text-emerald-400 font-medium">
            {item.icon}
            {item.text}
          </div>
        ))}
      </div>

      {/* Project name */}
      <div className="space-y-4">
        <Input
          label="Project name"
          placeholder="e.g. Credit Risk AI, Customer Support Bot"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          error={error}
          autoFocus
        />
        <Textarea
          label="Description (optional)"
          placeholder="Briefly describe what this AI will do..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      {/* Delivery Mode Selection */}
      <div className="space-y-3">
        <div>
          <div className="text-[13px] font-semibold text-foreground">How do you want to use your model?</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Choose how you'll interact with your trained model</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {DELIVERY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setDeliveryMode(opt.id)}
              className={cn(
                'relative flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-center transition-all duration-200',
                deliveryMode === opt.id
                  ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
              )}
            >
              <div className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
                deliveryMode === opt.id
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}>
                {opt.icon}
              </div>
              <div>
                <div className={cn(
                  'text-[14px] font-semibold',
                  deliveryMode === opt.id ? 'text-primary' : 'text-foreground'
                )}>
                  {opt.label}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  {opt.description}
                </div>
              </div>
              {deliveryMode === opt.id && (
                <div className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Public/Private Toggle */}
      <div className="space-y-3">
        <div>
          <div className="text-[13px] font-semibold text-foreground">Model visibility</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Control who can access your trained model</div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
          <button
            onClick={() => setModelVisibility('private')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-[13px] font-medium transition-all duration-200',
              modelVisibility === 'private'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Lock size={14} />
            Private
          </button>
          <button
            onClick={() => setModelVisibility('public')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-[13px] font-medium transition-all duration-200',
              modelVisibility === 'public'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Globe size={14} />
            Public
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground px-1">
          {modelVisibility === 'private'
            ? 'Only you and your team can access this model via API keys.'
            : 'Your model will be listed publicly and accessible to others.'}
        </p>
      </div>

      <div className="pt-2">
        <Button size="lg" onClick={handleCreate} className="w-full">
          Create project and define your AI
          <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  );
}
