import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none',
        {
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 active:scale-[0.97]': variant === 'primary',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]': variant === 'secondary',
          'hover:bg-accent hover:text-accent-foreground active:scale-[0.98]': variant === 'ghost',
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/30 active:scale-[0.98]': variant === 'outline',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.97]': variant === 'destructive',
          'text-primary underline-offset-4 hover:underline p-0 h-auto': variant === 'link',
        },
        {
          'h-8 px-3 text-xs': size === 'sm',
          'h-9 px-4 text-sm': size === 'md',
          'h-11 px-6 text-[15px]': size === 'lg',
        },
        variant === 'link' && 'h-auto px-0',
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
