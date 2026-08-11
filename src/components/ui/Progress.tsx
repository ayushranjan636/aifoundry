import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function Progress({
  value,
  max = 100,
  className,
  indicatorClassName,
  showLabel,
  size = 'md',
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="flex items-center gap-3 w-full">
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-secondary',
          size === 'sm' ? 'h-1.5' : 'h-2',
          className
        )}
      >
        <div
          className={cn(
            'h-full rounded-full bg-primary transition-all duration-500 ease-out',
            indicatorClassName
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground w-8 text-right shrink-0">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}
