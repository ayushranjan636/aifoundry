import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, Cpu, Rocket,
  BarChart3, Settings, ChevronDown, LogOut,
  Moon, Sun, Menu, X, Zap, BookOpen, DollarSign,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../store/AuthContext';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: <LayoutDashboard size={15} />, label: 'Overview', href: '/console', exact: true },
  { icon: <FolderOpen size={15} />, label: 'Projects', href: '/projects' },
  { icon: <Cpu size={15} />, label: 'Models', href: '/console/models' },
  { icon: <Rocket size={15} />, label: 'Deployments', href: '/console/deployments' },
  { icon: <BarChart3 size={15} />, label: 'Usage', href: '/console/usage' },
  { icon: <DollarSign size={15} />, label: 'Pricing', href: '/console/pricing' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Close menus on nav
  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDark((d) => !d);
  };

  const isActive = (item: NavItem) =>
    item.exact
      ? location.pathname === item.href
      : location.pathname.startsWith(item.href);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ──────────────────────────────────────── */}
      <aside
        style={{ background: 'hsl(var(--sidebar-bg))' }}
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-[220px] border-r border-border flex flex-col transition-transform duration-200 md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-[52px] flex items-center px-4 border-b border-border gap-2.5 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-sm">
            <Zap size={13} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-[13px] text-foreground tracking-tight">AI Foundry</span>
          <button
            className="ml-auto md:hidden text-muted-foreground hover:text-foreground p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={15} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-colors duration-100',
                isActive(item)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          <div className="my-2 border-t border-border/50" />

          <Link
            to="/docs"
            className={cn(
              'flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-colors duration-100',
              location.pathname === '/docs'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <BookOpen size={15} className="shrink-0" />
            API Docs
          </Link>

          <Link
            to="/settings"
            className={cn(
              'flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-colors duration-100',
              location.pathname === '/settings'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Settings size={15} className="shrink-0" />
            Settings
          </Link>
        </nav>

        {/* Cmd+K hint */}
        <div className="mx-2 mb-2 px-3 py-2 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Quick search</span>
          <div className="flex items-center gap-1">
            <kbd className="text-[10px] border border-border rounded px-1 py-0.5 font-mono text-muted-foreground">⌘</kbd>
            <kbd className="text-[10px] border border-border rounded px-1 py-0.5 font-mono text-muted-foreground">K</kbd>
          </div>
        </div>

        {/* API docs banner */}
        <Link to="/docs" className="mx-2 mb-2 rounded-lg border border-primary/20 bg-primary/5 p-3 hover:bg-primary/10 transition-colors block">
          <div className="text-[11px] font-semibold text-primary mb-0.5">API Reference</div>
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            Integrate your model via REST API.
          </div>
          <div className="mt-1.5 text-[11px] text-primary font-medium">
            View docs →
          </div>
        </Link>

        {/* User */}
        <div className="px-2 pb-2 border-t border-border pt-2 shrink-0 relative">
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] hover:bg-accent transition-colors group"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold shrink-0">
              {user?.avatar || 'U'}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-[12px] font-semibold text-foreground truncate">{user?.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{user?.email}</div>
            </div>
            <ChevronDown size={12} className="text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-full left-2 right-2 mb-1 rounded-xl border border-border bg-card shadow-xl p-1.5 z-50 animate-fade-in-fast">
              <button
                onClick={toggleDark}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              >
                {dark ? <Sun size={13} /> : <Moon size={13} />}
                {dark ? 'Light mode' : 'Dark mode'}
              </button>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ─── Main content ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="h-[52px] border-b border-border flex items-center px-4 gap-3 md:hidden bg-card shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
              <Zap size={11} className="text-white" />
            </div>
            <span className="font-semibold text-[13px]">AI Foundry</span>
          </div>
          <button onClick={toggleDark} className="ml-auto text-muted-foreground hover:text-foreground">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
