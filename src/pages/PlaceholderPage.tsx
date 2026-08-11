import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  const navigate = useNavigate();
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center space-y-3">
      <div className="text-base font-semibold text-foreground">{title}</div>
      <div className="text-sm text-muted-foreground max-w-sm">{description}</div>
      <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground bg-muted/50">
        Coming soon
      </div>
    </div>
  );
}
