const envKey = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_KEY;

export const API_KEY = envKey && envKey.length > 0 ? envKey : "";

export function getApiUrl(): string {
  return `${window.location.origin}/api/v1`;
}

export function apiHeaders(extra: Record<string, string> = {}): HeadersInit {
  return {
    "x-api-key": API_KEY,
    ...extra,
  };
}