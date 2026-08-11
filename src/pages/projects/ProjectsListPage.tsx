import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronRight, Clock, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { aiFoundryService } from '../../services/aiFoundryService';
import { cn, getHealthColor, formatNumber, formatDate } from '../../lib/utils';
import type { Project } from '../../types';

export function ProjectsListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setProjects(aiFoundryService.getProjects());
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await aiFoundryService.deleteProject(deleteTarget.id);
    setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  };

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: Project['status']) => {
    switch (status) {
      case 'production': return <Badge variant="success">Production</Badge>;
      case 'training': return <Badge variant="default">Training</Badge>;
      case 'evaluating': return <Badge variant="warning">Evaluating</Badge>;
      case 'draft': return <Badge variant="secondary">Draft</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{projects.length} AI projects</p>
        </div>
        <Button onClick={() => navigate('/projects/new')}>
          <Plus size={14} />
          New project
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Projects list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
            <p className="text-muted-foreground text-sm">No projects found.</p>
            <Button className="mt-4" onClick={() => navigate('/projects/new')}>
              <Plus size={14} />
              Build your first AI
            </Button>
          </div>
        ) : (
          filtered.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200 group"
            >
              <div className={cn(
                'shrink-0 mt-1.5 h-2 w-2 rounded-full',
                project.status === 'production' && 'bg-emerald-500',
                project.status === 'training' && 'bg-blue-500 animate-pulse-dot',
                project.status === 'evaluating' && 'bg-amber-500',
                project.status === 'draft' && 'bg-muted-foreground/40',
                project.status === 'failed' && 'bg-red-500',
              )} />

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{project.name}</span>
                  {statusBadge(project.status)}
                  {project.selectedApproach && (
                    <Badge variant="outline" className="capitalize">{project.selectedApproach}</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-0.5">
                  {project.selectedModel && (
                    <span className="capitalize">Model: {project.selectedModel}</span>
                  )}
                  {project.datasetAnalysis && (
                    <span>{formatNumber(project.datasetAnalysis.rows)} records</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {formatDate(project.updatedAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {project.modelHealth && (
                  <div className="text-right hidden sm:block">
                    <div className={cn('text-sm font-semibold', getHealthColor(project.modelHealth.score))}>
                      {project.modelHealth.score}/100
                    </div>
                    <div className="text-xs text-muted-foreground">health</div>
                  </div>
                )}
                <button
                  onClick={(e) => { e.preventDefault(); setDeleteTarget(project); }}
                  className="p-1.5 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
                <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative rounded-2xl border border-border bg-card shadow-2xl p-6 w-full max-w-sm space-y-4 animate-fade-in">
            <div>
              <h3 className="text-base font-semibold text-foreground">Delete project?</h3>
              <p className="text-[13px] text-muted-foreground mt-1.5">
                <span className="font-semibold text-foreground">{deleteTarget.name}</span> and all its models, versions, and deployment data will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" size="sm" loading={deleting} onClick={handleDelete}>
                <Trash2 size={13} />Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
