import React, { useState } from 'react';
import { Moon, Sun, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export function SettingsPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences.</p>
      </div>

      {/* ── Appearance ──────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/20">
          <div className="text-[13px] font-semibold text-foreground">Appearance</div>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium text-foreground">Theme</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">Choose between light and dark mode.</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => document.documentElement.classList.remove('dark')} className="gap-1.5">
                <Sun size={12} />Light
              </Button>
              <Button variant="outline" size="sm" onClick={() => document.documentElement.classList.add('dark')} className="gap-1.5">
                <Moon size={12} />Dark
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Platform Info ───────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/20">
          <div className="text-[13px] font-semibold text-foreground">Platform</div>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">API endpoint</span>
            <span className="font-mono text-foreground text-[12px]">aifoundry-production.up.railway.app</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">Frontend</span>
            <span className="font-mono text-foreground text-[12px]">aifoundry-iitm.vercel.app</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="success">Operational</Badge>
          </div>
        </div>
      </div>

      {/* ── Danger zone ─────────────────────────────────────── */}
      <div className="rounded-xl border border-destructive/20 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-destructive/20 bg-destructive/5">
          <div className="text-[13px] font-semibold text-destructive">Danger zone</div>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[13px] font-medium text-foreground">Reset demo data</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">
                Restore all projects to their original demo state. This cannot be undone.
              </div>
            </div>
            <Button
              variant="outline" size="sm"
              onClick={() => { localStorage.removeItem('aifoundry_projects_v2'); window.location.reload(); }}
              className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <RefreshCw size={12} />Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
