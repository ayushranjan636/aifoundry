import React, { useState, useEffect } from 'react';
import {
  DollarSign, Cpu, Database, Wifi, FlaskConical, Activity,
  ChevronDown, ChevronUp, AlertTriangle, Zap, TrendingDown,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ProjectCostEstimate } from '../../services/pricingApi';

interface CostEstimationCardProps {
  estimate: ProjectCostEstimate | null;
  loading?: boolean;
  compact?: boolean;
  showBreakdown?: boolean;
}

export function CostEstimationCard({ estimate, loading, compact, showBreakdown: initialShowBreakdown }: CostEstimationCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(initialShowBreakdown || false);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-8 w-24 bg-muted rounded" />
          <div className="h-3 w-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!estimate) return null;

  const { training, deployment, rag, summary, costRange } = estimate;

  if (compact) {
    return (
      <div className="rounded-xl border border-amber-200/50 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-950/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-amber-600 dark:text-amber-400" />
            <span className="text-[12px] font-semibold text-foreground">Estimated cost</span>
          </div>
          <div className="text-right">
            <div className="text-[16px] font-bold text-foreground">
              ${summary.oneTimeTrainingCost.toFixed(2)}
            </div>
            <div className="text-[10px] text-muted-foreground">one-time training</div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-200/30 dark:border-amber-800/20">
          <span className="text-[11px] text-muted-foreground">Deployment</span>
          <span className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400">Pay as you go</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
              <DollarSign size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-foreground">Estimated Cost</div>
              <div className="text-[11px] text-muted-foreground">Based on your configuration</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-muted-foreground">Training</div>
            <div className="text-[18px] font-bold text-foreground">
              ${costRange.trainingMin.toFixed(2)}–${costRange.trainingMax.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Training</div>
            <div className="text-[16px] font-bold text-foreground mt-1">${summary.oneTimeTrainingCost.toFixed(2)}</div>
            <div className="text-[10px] text-muted-foreground">one-time</div>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Deployment</div>
            <div className="text-[14px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">Pay as you go</div>
            <div className="text-[10px] text-muted-foreground">after training</div>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Per 1K req</div>
            <div className="text-[16px] font-bold text-foreground mt-1">${summary.per1KRequests.toFixed(2)}</div>
            <div className="text-[10px] text-muted-foreground">inference</div>
          </div>
        </div>

        {/* What's included */}
        <div className="rounded-lg bg-muted/30 p-3 space-y-1.5">
          <div className="text-[11px] font-semibold text-foreground">Includes:</div>
          <div className="grid grid-cols-2 gap-1">
            {[
              'Model training',
              `${Math.round(training.estimatedTrainingHours * 10) / 10}h GPU compute`,
              'Monitoring & logging',
              'API access',
              'Storage',
              'Evaluation & testing',
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="h-1 w-1 rounded-full bg-emerald-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingDown size={10} />
              Deployment billed separately — pay only for what you use
            </div>
          </div>
        </div>

        {/* Breakdown toggle */}
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex items-center gap-1.5 text-[12px] text-primary hover:underline"
        >
          <Activity size={11} />
          {showBreakdown ? 'Hide' : 'View'} cost breakdown
          {showBreakdown ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>

        {/* Detailed breakdown */}
        {showBreakdown && (
          <div className="space-y-3 animate-fade-in border-t border-border pt-4">
            <div className="text-[11px] font-semibold text-foreground uppercase tracking-wide">Training Breakdown</div>
            <div className="space-y-1.5">
              {[
                { icon: <Cpu size={11} />, label: 'GPU compute', value: training.breakdown.gpuCompute, color: 'text-blue-600 dark:text-blue-400' },
                { icon: <Zap size={11} />, label: 'Data processing', value: training.breakdown.dataProcessing, color: 'text-violet-600 dark:text-violet-400' },
                { icon: <Database size={11} />, label: 'Storage', value: training.breakdown.storage, color: 'text-emerald-600 dark:text-emerald-400' },
                { icon: <Wifi size={11} />, label: 'Network', value: training.breakdown.network, color: 'text-amber-600 dark:text-amber-400' },
                { icon: <FlaskConical size={11} />, label: 'Evaluation', value: training.breakdown.evaluation, color: 'text-pink-600 dark:text-pink-400' },
                { icon: <Activity size={11} />, label: 'Monitoring', value: training.breakdown.monitoring, color: 'text-muted-foreground' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className={cn('flex items-center gap-2 text-[11px]', item.color)}>
                    {item.icon}
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="text-[11px] font-mono text-foreground">${item.value.toFixed(4)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1.5 border-t border-border">
                <span className="text-[11px] font-semibold text-foreground">Infrastructure cost</span>
                <span className="text-[12px] font-mono font-bold text-foreground">${training.directCost.toFixed(4)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">+ Overhead (10%)</span>
                <span className="text-[11px] font-mono text-muted-foreground">${training.pricing.overheadAllocation.toFixed(4)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">+ Buffer (5%)</span>
                <span className="text-[11px] font-mono text-muted-foreground">${training.pricing.costBuffer.toFixed(4)}</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-border">
                <span className="text-[11px] font-semibold text-primary">Your price</span>
                <span className="text-[13px] font-mono font-bold text-primary">${training.pricing.customerPrice.toFixed(2)}</span>
              </div>
            </div>

            {deployment && (
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <TrendingDown size={10} />
                  Deployment: Pay as you go after model training
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  You'll only be charged for actual inference requests — no fixed monthly hosting fees.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
