import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, FolderOpen, Cpu, Rocket, BarChart3,
  FlaskConical, Code2, Settings, Plus, ArrowRight,
  Zap, BookOpen,
} from 'lucide-react';
import { aiFoundryService } from '../../services/aiFoundryService';
import { cn } from '../../lib/utils';

interface CmdItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  href: string;
  group: string;
}

const STATIC_ITEMS: CmdItem[] = [
  { id: 'console', label: 'Overview', description: 'Dashboard', icon: <Zap size={14} />, href: '/console', group: 'Navigation' },
  { id: 'projects', label: 'All Projects', description: 'View all AI projects', icon: <FolderOpen size={14} />, href: '/projects', group: 'Navigation' },
  { id: 'models', label: 'Models', description: 'All trained models', icon: <Cpu size={14} />, href: '/console/models', group: 'Navigation' },
  { id: 'deployments', label: 'Deployments', description: 'Active API endpoints', icon: <Rocket size={14} />, href: '/console/deployments', group: 'Navigation' },
  { id: 'usage', label: 'Usage & Analytics', description: 'API metrics and charts', icon: <BarChart3 size={14} />, href: '/console/usage', group: 'Navigation' },
  { id: 'docs', label: 'API Documentation', description: 'Full API reference', icon: <BookOpen size={14} />, href: '/docs', group: 'Navigation' },
  { id: 'settings', label: 'Settings', description: 'Configure AI engine', icon: <Settings size={14} />, href: '/settings', group: 'Navigation' },
  { id: 'new', label: 'New Project', description: 'Start building a new AI', icon: <Plus size={14} />, href: '/projects/new', group: 'Actions' },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build dynamic items from projects
  const projects = aiFoundryService.getProjects();
  const projectItems: CmdItem[] = projects.flatMap((p) => [
    { id: `proj-${p.id}`, label: p.name, description: `${p.status} · ${p.selectedApproach || 'draft'}`, icon: <FolderOpen size={14} />, href: `/projects/${p.id}`, group: 'Projects' },
    ...(p.modelHealth ? [{ id: `test-${p.id}`, label: `Test ${p.name}`, description: 'Open Testing Lab', icon: <FlaskConical size={14} />, href: `/projects/${p.id}/test`, group: 'Projects' }] : []),
    ...(p.deployment?.status === 'production' ? [{ id: `api-${p.id}`, label: `${p.name} API`, description: 'Open API Playground', icon: <Code2 size={14} />, href: `/projects/${p.id}/api`, group: 'Projects' }] : []),
  ]);

  const allItems = [...STATIC_ITEMS, ...projectItems];

  const filtered = query.trim()
    ? allItems.filter(
        (i) =>
          i.label.toLowerCase().includes(query.toLowerCase()) ||
          i.description?.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  // Group filtered items
  const groups = filtered.reduce<Record<string, CmdItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const flatFiltered = Object.values(groups).flat();

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => { setSelected(0); }, [query]);

  const handleSelect = useCallback((item: CmdItem) => {
    navigate(item.href);
    onClose();
  }, [navigate, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, flatFiltered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); if (flatFiltered[selected]) handleSelect(flatFiltered[selected]); }
    if (e.key === 'Escape') onClose();
  };

  if (!open) return null;

  let globalIdx = -1;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in-fast">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Jump to project, page, or action…"
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 font-mono shrink-0">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto py-1.5">
          {flatFiltered.length === 0 ? (
            <div className="px-4 py-6 text-center text-[13px] text-muted-foreground">No results for "{query}"</div>
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <div key={group}>
                <div className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{group}</div>
                {items.map((item) => {
                  globalIdx++;
                  const idx = globalIdx;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelected(idx)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        selected === idx ? 'bg-accent' : 'hover:bg-accent/50'
                      )}
                    >
                      <span className={cn('shrink-0', selected === idx ? 'text-primary' : 'text-muted-foreground')}>
                        {item.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-foreground">{item.label}</div>
                        {item.description && <div className="text-[11px] text-muted-foreground">{item.description}</div>}
                      </div>
                      {selected === idx && <ArrowRight size={12} className="text-muted-foreground shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span><kbd className="border border-border rounded px-1 font-mono">↑↓</kbd> Navigate</span>
          <span><kbd className="border border-border rounded px-1 font-mono">↵</kbd> Open</span>
          <span className="ml-auto">Press <kbd className="border border-border rounded px-1 font-mono">⌘K</kbd> anytime</span>
        </div>
      </div>
    </div>
  );
}
