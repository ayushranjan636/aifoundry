import React from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Step {
  id: string;
  label: string;
  href: string;
  status: 'completed' | 'active' | 'pending';
}

interface ProjectLayoutProps {
  children: React.ReactNode;
  steps?: Step[];
  breadcrumb?: { label: string; href?: string }[];
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function ProjectLayout({
  children,
  steps,
  breadcrumb,
  title,
  subtitle,
  actions,
}: ProjectLayoutProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      {(breadcrumb || title) && (
        <div className="border-b border-border bg-card/50 px-6 py-4 shrink-0">
          {breadcrumb && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              {breadcrumb.map((item, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight size={12} />}
                  {item.href ? (
                    <Link to={item.href} className="hover:text-foreground transition-colors">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium">{item.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
          <div className="flex items-start justify-between gap-4">
            <div>
              {title && <h1 className="text-xl font-semibold text-foreground">{title}</h1>}
              {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
        </div>
      )}

      {/* Step indicator */}
      {steps && (
        <div className="border-b border-border bg-card/30 px-6 py-3 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-0 min-w-max">
            {steps.map((step, i) => (
              <React.Fragment key={step.id}>
                <Link
                  to={step.href}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors',
                    step.status === 'active' && 'text-primary',
                    step.status === 'completed' && 'text-muted-foreground hover:text-foreground',
                    step.status === 'pending' && 'text-muted-foreground/50 pointer-events-none'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold border',
                      step.status === 'active' && 'border-primary bg-primary/10 text-primary',
                      step.status === 'completed' && 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                      step.status === 'pending' && 'border-muted-foreground/30 text-muted-foreground/50'
                    )}
                  >
                    {step.status === 'completed' ? '✓' : i + 1}
                  </span>
                  {step.label}
                </Link>
                {i < steps.length - 1 && (
                  <ChevronRight size={12} className="text-muted-foreground/30 mx-1" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
