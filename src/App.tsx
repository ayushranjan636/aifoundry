import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { CommandPalette } from './components/ui/CommandPalette';
import { OnboardingTour, useOnboardingTour } from './components/ui/OnboardingTour';

import { AppLayout } from './components/layout/AppLayout';
import { BuildWizardLayout } from './components/layout/BuildWizardLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { HowItWorksPage } from './pages/marketing/HowItWorksPage';
import { CapabilitiesPage } from './pages/marketing/CapabilitiesPage';
import { AboutPage } from './pages/marketing/AboutPage';
import { ConsolePage } from './pages/console/ConsolePage';
import { ModelsPage } from './pages/console/ModelsPage';
import { DeploymentsPage } from './pages/console/DeploymentsPage';
import { UsagePage } from './pages/console/UsagePage';
import { PricingPage } from './pages/console/PricingPage';
import { ProjectsListPage } from './pages/projects/ProjectsListPage';
import { NewProjectPage } from './pages/projects/NewProjectPage';
import { ProjectOverviewPage } from './pages/projects/ProjectOverviewPage';
import { ModelHealthPage } from './pages/projects/ModelHealthPage';
import { TestingLabPage } from './pages/projects/TestingLabPage';
import { DeploymentPage } from './pages/projects/DeploymentPage';
import { ApiPlaygroundPage } from './pages/projects/ApiPlaygroundPage';
import { ModelVersionsPage } from './pages/projects/ModelVersionsPage';
import { ImprovePage } from './pages/projects/ImprovePage';
import { BenchmarkPage } from './pages/projects/BenchmarkPage';
import { DefinePage } from './pages/build/DefinePage';
import { ArchitectPage } from './pages/build/ArchitectPage';
import { DatasetPage } from './pages/build/DatasetPage';
import { CheckpointPage } from './pages/build/CheckpointPage';
import { BuildingPage } from './pages/build/BuildingPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { SettingsPage } from './pages/SettingsPage';

function RequireAuth() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const { show: showTour, dismiss: dismissTour } = useOnboardingTour();
  const [cmdOpen, setCmdOpen] = useState(false);

  // Global Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary animate-pulse" />
          <p className="text-[13px] text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return (
    <AppLayout>
      <Outlet />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      {showTour && <OnboardingTour onComplete={dismissTour} />}
    </AppLayout>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/capabilities" element={<CapabilitiesPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/console" element={<ConsolePage />} />
        <Route path="/console/models" element={<ModelsPage />} />
        <Route path="/console/deployments" element={<DeploymentsPage />} />
        <Route path="/console/usage" element={<UsagePage />} />
        <Route path="/console/pricing" element={<PricingPage />} />

        <Route path="/projects" element={<ProjectsListPage />} />
        <Route path="/projects/new" element={<NewProjectPage />} />
        <Route path="/projects/:id" element={<ProjectOverviewPage />} />

        {/* Build wizard with step progress */}
        <Route path="/projects/:id" element={<BuildWizardLayout />}>
          <Route path="build" element={<DefinePage />} />
          <Route path="architect" element={<ArchitectPage />} />
          <Route path="data" element={<DatasetPage />} />
          <Route path="checkpoint" element={<CheckpointPage />} />
          <Route path="building" element={<BuildingPage />} />
        </Route>

        <Route path="/projects/:id/health" element={<ModelHealthPage />} />
        <Route path="/projects/:id/benchmark" element={<BenchmarkPage />} />
        <Route path="/projects/:id/test" element={<TestingLabPage />} />
        <Route path="/projects/:id/deploy" element={<DeploymentPage />} />
        <Route path="/projects/:id/api" element={<ApiPlaygroundPage />} />
        <Route path="/projects/:id/versions" element={<ModelVersionsPage />} />
        <Route path="/projects/:id/improve" element={<ImprovePage />} />

        <Route path="/docs" element={<DocumentationPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        <Route path="*" element={<Navigate to="/console" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) document.documentElement.classList.add('dark');
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
