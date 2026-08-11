import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { aiFoundryService } from '../../services/aiFoundryService';

export function NewProjectPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) {
      setError('Please enter a project name.');
      return;
    }
    const project = aiFoundryService.createProject({ name, description });
    navigate(`/projects/${project.id}/build`);
  };

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New AI project</h1>
        <p className="text-muted-foreground mt-1">Give your project a name to get started.</p>
      </div>

      <div className="space-y-4">
        <Input
          label="Project name"
          placeholder="e.g. Credit Risk AI"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          error={error}
          autoFocus
        />
        <Textarea
          label="Description (optional)"
          placeholder="Briefly describe what this AI will do…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <Button size="lg" onClick={handleCreate}>
        Create project
        <ArrowRight size={14} />
      </Button>
    </div>
  );
}
