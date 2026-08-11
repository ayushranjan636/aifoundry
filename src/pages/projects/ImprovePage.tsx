import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, GitBranch, Sliders, Cpu, TrendingUp, ArrowRight, CheckCircle, File } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { aiFoundryService } from '../../services/aiFoundryService';
import { useToast } from '../../components/ui/Toast';
import { cn, formatNumber } from '../../lib/utils';

const IMPROVE_OPTIONS = [
  { id: 'data', icon: <Upload size={16} />, label: 'Add new data', description: 'Upload more training examples to improve coverage and accuracy.' },
  { id: 'behavior', icon: <Sliders size={16} />, label: 'Change behavior', description: 'Adjust output format, confidence thresholds, or behavioral constraints.' },
  { id: 'model', icon: <Cpu size={16} />, label: 'Change model', description: 'Switch to a different foundation model for better task fit.' },
  { id: 'performance', icon: <TrendingUp size={16} />, label: 'Improve performance', description: 'Focus training on underperforming classes or edge cases.' },
];

export function ImprovePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = id ? aiFoundryService.getProject(id) : null;

  const { success } = useToast();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [newVersionCreated, setNewVersionCreated] = useState(false);

  const currentDatasetSize = project?.datasetAnalysis?.rows || 0;
  const estimatedNewSize = currentDatasetSize + Math.floor(20000 + Math.random() * 5000);

  const handleFileChange = (f: File) => {
    setNewFile(f);
    setSelectedOption('data');
  };

  const handleCreateVersion = async () => {
    if (!id) return;
    setCreating(true);
    try {
      await aiFoundryService.createModelVersion(id, notes || 'New version with additional training data.');
      setNewVersionCreated(true);
      success('New version created!', 'Model retrained with updated dataset.');
    } finally {
      setCreating(false);
    }
  };

  if (newVersionCreated) {
    const updatedProject = aiFoundryService.getProject(id || '');
    const latest = updatedProject?.versions[0];
    return (
      <div className="p-6 max-w-xl mx-auto space-y-5 animate-fade-in">
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/10 p-6 text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 mx-auto">
            <CheckCircle size={24} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="font-semibold text-foreground text-lg">New version created</div>
            {latest && (
              <div className="text-sm text-muted-foreground mt-1">
                {latest.version} · {latest.accuracy}% accuracy · {formatNumber(latest.datasetSize)} records
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/projects/${id}/health`)}>
            View model health
            <ArrowRight size={14} />
          </Button>
          <Button variant="outline" onClick={() => navigate(`/projects/${id}/versions`)}>
            View versions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Improve your AI</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add more data or change your requirements. Foundry will analyze the changes and recommend the next build.
        </p>
      </div>

      {/* Current state */}
      {project?.modelHealth && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Current version</div>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Version</div>
              <div className="font-mono text-sm font-semibold text-foreground">
                {project.versions.find((v) => v.status === 'production')?.version || 'v1.0'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
              <div className="text-sm font-semibold text-foreground">{project.modelHealth.accuracy}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Dataset</div>
              <div className="text-sm font-semibold text-foreground">{formatNumber(currentDatasetSize)} records</div>
            </div>
          </div>
        </div>
      )}

      {/* Improvement options */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-foreground mb-3">What do you want to improve?</div>
        {IMPROVE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelectedOption(opt.id)}
            className={cn(
              'w-full text-left flex items-start gap-3 rounded-xl border p-4 transition-all duration-150',
              selectedOption === opt.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
            )}
          >
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
              selectedOption === opt.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              {opt.icon}
            </div>
            <div>
              <div className={cn('text-sm font-medium', selectedOption === opt.id ? 'text-primary' : 'text-foreground')}>
                {opt.label}
              </div>
              <div className="text-xs text-muted-foreground">{opt.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* New data upload */}
      {selectedOption === 'data' && (
        <div className="space-y-3 animate-fade-in">
          <label
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all',
              dragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:border-primary/40'
            )}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileChange(f); }}
          >
            <Upload size={20} className="text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              {newFile ? newFile.name : 'Upload new training data'}
            </div>
            <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f); }} />
          </label>

          {newFile && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 animate-fade-in">
              <div className="text-sm font-medium text-foreground mb-2">New data detected</div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground">Current dataset</div>
                  <div className="font-semibold text-foreground">{formatNumber(currentDatasetSize)} records</div>
                </div>
                <div>
                  <div className="text-muted-foreground">After adding</div>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">~{formatNumber(estimatedNewSize)} records</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Recommended action: <span className="text-foreground font-medium">Retrain</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Expected benefit: <span className="text-foreground">Improved minority-class coverage</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Version notes */}
      {selectedOption && (
        <div className="animate-fade-in">
          <Textarea
            label="Version notes (optional)"
            placeholder="Describe what changed in this version…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
      )}

      {selectedOption && (
        <Button
          size="lg"
          onClick={handleCreateVersion}
          loading={creating}
          className="w-full sm:w-auto"
        >
          <GitBranch size={14} />
          Create new version
        </Button>
      )}
    </div>
  );
}
