import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { WizardProgress } from '../../components/layout/WizardProgress';

const WIZARD_STEPS = [
  { id: 'define', label: 'Define', href: '/projects/:id/build' },
  { id: 'architect', label: 'Architect', href: '/projects/:id/architect' },
  { id: 'data', label: 'Data', href: '/projects/:id/data' },
  { id: 'checkpoint', label: 'Checkpoint', href: '/projects/:id/checkpoint' },
  { id: 'build', label: 'Build', href: '/projects/:id/building' },
];

export function BuildWizardLayout() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col h-full">
      {id && <WizardProgress steps={WIZARD_STEPS} projectId={id} />}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
