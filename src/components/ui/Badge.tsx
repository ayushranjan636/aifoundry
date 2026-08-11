import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        {
          'border-primary/30 bg-primary/10 text-primary': variant === 'default',
          'border-border bg-muted text-muted-foreground': variant === 'secondary',
          'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400': variant === 'success',
          'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-400': variant === 'warning',
          'border-red-200 bg-red-50 text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-400': variant === 'destructive',
          'border-border bg-transparent text-foreground': variant === 'outline',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
