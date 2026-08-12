import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, Shield, AlertTriangle, Plus,
  Trash2, Activity, Cpu, Database, Wifi, Settings,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';
import { pricingApi } from '../../services/pricingApi';

interface Budget {
  id: string;
  budget_type: string;
  limit_amount: number;
  current_spend: number;
  period: string;
  alert_threshold: number;
  is_hard_limit: number;
}

export function PricingPage() {
  const [config, setConfig] = useState<Record<string, { value: number; description: string }>>({});
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [newBudget, setNewBudget] = useState({ type: 'monthly', limit: 100, hard: false });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configRes, budgetRes] = await Promise.all([
        pricingApi.getConfig(),
        pricingApi.getBudgets(),
      ]);
      setConfig(configRes.config || {});
      setBudgets(budgetRes.budgets || []);
    } catch {
      // Use empty defaults
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudget = async () => {
    try {
      await pricingApi.createBudget({
        budgetType: newBudget.type,
        limitAmount: newBudget.limit,
        period: newBudget.type === 'monthly' ? '30d' : '1d',
        isHardLimit: newBudget.hard,
      });
      setShowAddBudget(false);
      loadData();
    } catch {}
  };

  const targetMargin = config.target_gross_margin?.value
    ? `${config.target_gross_margin.value * 100}%`
    : '50%';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Pricing & Billing</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Understand your costs, set budgets, and manage spending
          </p>
        </div>
      </div>

      {/* How pricing works */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-primary" />
          <span className="text-[14px] font-semibold text-foreground">How pricing works</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <div className="text-[12px] font-semibold text-foreground">Pay for what you use</div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Costs are calculated dynamically from actual GPU time, API calls, storage, and network usage.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="text-[12px] font-semibold text-foreground">Transparent breakdown</div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Every charge shows the infrastructure cost, overhead, and margin. No hidden fees.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="text-[12px] font-semibold text-foreground">Cost controls</div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Set monthly and per-job budgets. Get alerts before you hit limits.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing tiers */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/20">
          <div className="text-[13px] font-semibold text-foreground">What you're charged for</div>
        </div>
        <div className="p-5">
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: <Cpu size={14} />, label: 'Training', unit: 'Per job', desc: 'GPU compute + data processing + evaluation', color: 'text-blue-600 dark:text-blue-400' },
              { icon: <Activity size={14} />, label: 'Deployment', unit: 'Per hour', desc: 'Model hosting + load balancing + monitoring', color: 'text-emerald-600 dark:text-emerald-400' },
              { icon: <TrendingUp size={14} />, label: 'Inference', unit: 'Per 1K requests', desc: 'API calls to your deployed model', color: 'text-violet-600 dark:text-violet-400' },
              { icon: <Database size={14} />, label: 'Storage', unit: 'Per GB/month', desc: 'Datasets, model artifacts, vector DB', color: 'text-amber-600 dark:text-amber-400' },
              { icon: <Wifi size={14} />, label: 'Network', unit: 'Per GB', desc: 'Data transfer in/out', color: 'text-pink-600 dark:text-pink-400' },
              { icon: <Settings size={14} />, label: 'RAG', unit: 'Ingestion + usage', desc: 'Document processing + embeddings + retrieval', color: 'text-cyan-600 dark:text-cyan-400' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background">
                <div className={cn('mt-0.5', item.color)}>{item.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-foreground">{item.label}</span>
                    <Badge variant="outline" className="text-[10px]">{item.unit}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Free tier */}
      <div className="rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/10 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-[13px] font-semibold text-foreground">Free tier included</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-background border border-border">
            <div className="text-[18px] font-bold text-foreground">1,000</div>
            <div className="text-[11px] text-muted-foreground">requests/month</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-background border border-border">
            <div className="text-[18px] font-bold text-foreground">5 GB</div>
            <div className="text-[11px] text-muted-foreground">storage</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-background border border-border">
            <div className="text-[18px] font-bold text-foreground">3</div>
            <div className="text-[11px] text-muted-foreground">projects</div>
          </div>
        </div>
      </div>

      {/* Budget Controls */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
          <div className="text-[13px] font-semibold text-foreground">Budget Controls</div>
          <Button size="sm" variant="outline" onClick={() => setShowAddBudget(true)}>
            <Plus size={12} />
            Add budget
          </Button>
        </div>
        <div className="p-5">
          {budgets.length === 0 ? (
            <div className="text-center py-6">
              <AlertTriangle size={20} className="mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-[13px] text-muted-foreground">No budgets set</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Set a monthly budget to get alerts before you overspend
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {budgets.map((b) => {
                const pct = b.limit_amount > 0 ? (b.current_spend / b.limit_amount) * 100 : 0;
                return (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-foreground capitalize">{b.budget_type} budget</span>
                        {b.is_hard_limit ? (
                          <Badge variant="destructive" className="text-[9px]">Hard limit</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px]">Alert only</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                            )}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          ${b.current_spend.toFixed(2)} / ${b.limit_amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add budget form */}
          {showAddBudget && (
            <div className="mt-4 p-4 rounded-lg border border-border bg-background space-y-3 animate-fade-in">
              <div className="text-[12px] font-semibold text-foreground">New budget</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-muted-foreground">Type</label>
                  <select
                    value={newBudget.type}
                    onChange={(e) => setNewBudget({ ...newBudget, type: e.target.value })}
                    className="mt-1 w-full h-8 rounded-lg border border-input bg-background px-2 text-[12px]"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="daily">Daily</option>
                    <option value="training">Per training job</option>
                    <option value="deployment">Deployment</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Limit ($)</label>
                  <input
                    type="number"
                    value={newBudget.limit}
                    onChange={(e) => setNewBudget({ ...newBudget, limit: Number(e.target.value) })}
                    className="mt-1 w-full h-8 rounded-lg border border-input bg-background px-2 text-[12px]"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={newBudget.hard}
                  onChange={(e) => setNewBudget({ ...newBudget, hard: e.target.checked })}
                  className="rounded border-border"
                />
                Hard limit (stop workloads when exceeded)
              </label>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddBudget}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddBudget(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
