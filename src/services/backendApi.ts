// Frontend API client — talks to the backend
// In production: set VITE_API_URL to your Railway backend URL
// Locally: defaults to http://localhost:3001

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
let _backendAvailable: boolean | null = null;

async function checkBackend(): Promise<boolean> {
  if (_backendAvailable !== null) return _backendAvailable;
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
    _backendAvailable = res.ok;
  } catch {
    _backendAvailable = false;
  }
  return _backendAvailable;
}

export async function isBackendUp(): Promise<boolean> {
  return checkBackend();
}

// Reset cached availability (call on error)
export function resetBackendCache() {
  _backendAvailable = null;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Projects ──────────────────────────────────────────────
export const projectsApi = {
  list: (userId = 'demo-user') =>
    apiFetch<any[]>(`/api/projects?userId=${userId}`),

  get: (id: string) =>
    apiFetch<any>(`/api/projects/${id}`),

  create: (data: { name: string; description?: string; objective?: string }) =>
    apiFetch<any>('/api/projects', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, updates: Record<string, any>) =>
    apiFetch<any>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),

  createVersion: (projectId: string, data: Record<string, any>) =>
    apiFetch<any>(`/api/projects/${projectId}/versions`, { method: 'POST', body: JSON.stringify(data) }),

  getVersions: (projectId: string) =>
    apiFetch<any[]>(`/api/projects/${projectId}/versions`),
};

// ── Inference ─────────────────────────────────────────────
export const inferenceApi = {
  predict: (projectId: string, input: Record<string, any>, apiKey?: string) =>
    apiFetch<any>(`/api/v1/models/${projectId}`, {
      method: 'POST',
      body: JSON.stringify(input),
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
    }),
};

// ── Analytics ─────────────────────────────────────────────
export const analyticsApi = {
  overview: (params?: { projectId?: string; days?: number }) => {
    const q = new URLSearchParams(params as any).toString();
    return apiFetch<any>(`/api/analytics/overview?${q}`);
  },

  timeseries: (params?: { projectId?: string; days?: number }) => {
    const q = new URLSearchParams(params as any).toString();
    return apiFetch<any[]>(`/api/analytics/timeseries?${q}`);
  },

  requests: (params?: { projectId?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams(params as any).toString();
    return apiFetch<any>(`/api/analytics/requests?${q}`);
  },

  models: () => apiFetch<any[]>('/api/analytics/models'),
};

// ── Deployments ───────────────────────────────────────────
export const deploymentsApi = {
  list: () => apiFetch<any[]>('/api/deployments'),
  create: (projectId: string, versionId?: string) =>
    apiFetch<any>('/api/deployments', { method: 'POST', body: JSON.stringify({ projectId, versionId }) }),
  stop: (id: string) =>
    apiFetch<any>(`/api/deployments/${id}`, { method: 'DELETE' }),
};

// ── User ──────────────────────────────────────────────────
export const userApi = {
  me: () => apiFetch<any>('/api/user'),
  apiKey: () => apiFetch<any>('/api/apikey'),
};

// ── API Keys ──────────────────────────────────────────────
export const apiKeysApi = {
  list: (projectId: string) => apiFetch<any[]>(`/api/apikeys/${projectId}`),
  create: (projectId: string, name: string) =>
    apiFetch<any>(`/api/apikeys/${projectId}`, { method: 'POST', body: JSON.stringify({ name }) }),
  toggle: (id: string, isActive: boolean) =>
    apiFetch<any>(`/api/apikeys/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
  revoke: (id: string) =>
    apiFetch<any>(`/api/apikeys/${id}`, { method: 'DELETE' }),
};

// ── Health ────────────────────────────────────────────────
export const healthApi = {
  check: () => apiFetch<any>('/api/health'),
};
