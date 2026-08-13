// AI engine configuration — key is read from environment only.
// Set VITE_OPENAI_API_KEY in your .env file.
// The Settings page also allows overriding via localStorage for local dev.

export function getOpenAIKey(): string {
  // Priority: .env variable → localStorage override (dev only)
  const envKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (envKey && envKey.startsWith('sk-')) return envKey;
  const stored = localStorage.getItem('deeployment_engine_key');
  if (stored && stored.startsWith('sk-')) return stored;
  return '';
}

export function setOpenAIKey(key: string): void {
  localStorage.setItem('deeployment_engine_key', key.trim());
}

export function hasOpenAIKey(): boolean {
  return getOpenAIKey().length > 0;
}
