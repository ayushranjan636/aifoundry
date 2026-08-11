import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface Toast {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (opts: Omit<Toast, 'id'>) => string;
  success: (message: string, description?: string) => string;
  error: (message: string, description?: string) => string;
  info: (message: string, description?: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((opts: Omit<Toast, 'id'>): string => {
    const id = Math.random().toString(36).slice(2);
    const t: Toast = { ...opts, id };
    setToasts((prev) => [...prev.slice(-4), t]);
    const dur = opts.duration ?? (opts.type === 'error' ? 5000 : 3500);
    if (dur > 0) setTimeout(() => dismiss(id), dur);
    return id;
  }, [dismiss]);

  const success = useCallback((msg: string, desc?: string) => toast({ message: msg, description: desc, type: 'success' }), [toast]);
  const error = useCallback((msg: string, desc?: string) => toast({ message: msg, description: desc, type: 'error' }), [toast]);
  const info = useCallback((msg: string, desc?: string) => toast({ message: msg, description: desc, type: 'info' }), [toast]);

  const ICONS: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />,
    error: <AlertCircle size={15} className="text-red-500 shrink-0" />,
    info: <Info size={15} className="text-primary shrink-0" />,
    loading: <Zap size={15} className="text-amber-500 shrink-0 animate-pulse" />,
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, info, dismiss }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border bg-card shadow-xl px-4 py-3 animate-slide-up',
              t.type === 'success' && 'border-emerald-200 dark:border-emerald-800/50',
              t.type === 'error' && 'border-red-200 dark:border-red-800/50',
              t.type === 'info' && 'border-primary/20',
              t.type === 'loading' && 'border-amber-200 dark:border-amber-800/50',
            )}
          >
            {ICONS[t.type]}
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-foreground">{t.message}</div>
              {t.description && <div className="text-[11px] text-muted-foreground mt-0.5">{t.description}</div>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-muted-foreground hover:text-foreground shrink-0">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
