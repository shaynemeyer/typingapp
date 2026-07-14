export interface Passage {
  id: number;
  text: string;
  created_at: string;
}

export interface Result {
  id: number;
  passage_id: number;
  wpm: number;
  accuracy: number;
  created_at: string;
}

const TOKEN_KEY = 'typingToken';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

class ApiError extends Error {}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      ...init.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new ApiError(detail?.detail ?? `Request failed (${response.status})`);
  }

  return response.status === 204 ? (undefined as T) : response.json();
}

function json(body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export async function register(username: string, password: string): Promise<void> {
  const { access_token } = await request<{ access_token: string }>(
    '/api/register',
    json({ username, password }),
  );
  setToken(access_token);
}

export async function login(username: string, password: string): Promise<void> {
  // OAuth2 password flow expects form encoding, not JSON.
  const { access_token } = await request<{ access_token: string }>('/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }),
  });
  setToken(access_token);
}

export const nextPassage = () => request<Passage>('/api/passages/next');

export const myResults = () => request<Result[]>('/api/users/me/results');

export const saveResult = (passage_id: number, wpm: number, accuracy: number) =>
  request<Result>('/api/results', json({ passage_id, wpm, accuracy }));

export const me = () => request<{ id: number; username: string }>('/api/users/me');
