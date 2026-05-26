const BASE = import.meta.env.VITE_API_BASE ?? '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// CSRF token cache. Fetched lazily before the first mutating request and
// refreshed if the server ever rejects us with a 403 CSRF error.
let csrfToken: string | null = null;
let csrfInflight: Promise<string> | null = null;

async function fetchCsrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  if (!csrfInflight) {
    csrfInflight = fetch(`${BASE}/auth/csrf`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        csrfToken = d.csrfToken as string;
        return csrfToken;
      })
      .finally(() => {
        csrfInflight = null;
      });
  }
  return csrfInflight;
}

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

async function request<T>(path: string, init: RequestInit = {}, retryOnCsrf = true): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  };

  if (MUTATING.has(method)) {
    headers['x-csrf-token'] = await fetchCsrf();
  }

  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    // A stale CSRF token (e.g. after a server restart) — refresh once.
    if (res.status === 403 && data?.error === 'CSRF' && retryOnCsrf) {
      csrfToken = null;
      return request<T>(path, init, false);
    }
    const msg = data?.message ?? res.statusText;
    const code = data?.error ?? 'HttpError';
    throw new ApiError(res.status, code, msg, data);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
  // Clears the cached CSRF token (call on logout so the next session
  // gets a fresh one).
  resetCsrf: () => {
    csrfToken = null;
  },
};
