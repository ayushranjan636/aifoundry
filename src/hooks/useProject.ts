import { useState, useEffect, useCallback } from 'react';
import { aiFoundryService } from '../services/aiFoundryService';
import type { Project } from '../types';

export function useProject(id: string | undefined) {
  const [project, setProject] = useState<Project | null>(() =>
    id ? aiFoundryService.getProject(id) || null : null
  );

  const refresh = useCallback(() => {
    if (id) setProject(aiFoundryService.getProject(id) || null);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { project, refresh };
}
