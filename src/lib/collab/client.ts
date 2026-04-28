import { Platform } from 'react-native';

import { getCollabConfig } from './config';
import { useCollabStore } from './store';

function getBaseUrl(): string {
  return `${getCollabConfig().serverUrl}/api/v1`;
}

const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': Platform.OS,
} as const;

// ─── Unauthenticated fetch (login endpoints) ─────────────────────────────────

export async function zivaFetchUnauth<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    method,
    headers: DEFAULT_HEADERS,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<T>;
}

// ─── Authenticated fetch (user token) ────────────────────────────────────────

// eslint-disable-next-line max-params
export async function zivaFetch<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
  params?: Record<string, string>,
): Promise<T> {
  const { authToken, userId } = useCollabStore.getState();
  if (!authToken || !userId) {
    throw new Error('Not authenticated with collab');
  }

  let url = `${getBaseUrl()}${path}`;
  if (method === 'GET' && params) {
    url = `${url}?${new URLSearchParams(params).toString()}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      ...DEFAULT_HEADERS,
      'X-Auth-Token': authToken,
      'X-User-Id': userId,
    },
    body: method === 'POST' && body !== undefined ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<T>;
}

// ─── Admin fetch (admin token for vertivusers.* endpoints) ───────────────────

export async function zivaFetchAdmin<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<T> {
  const { COLLAB_ADMIN_TOKEN } = await import('./config');
  const { userId } = useCollabStore.getState();

  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      ...DEFAULT_HEADERS,
      'X-Auth-Token': COLLAB_ADMIN_TOKEN,
      'X-User-Id': userId ?? '',
    },
    body: method === 'POST' && body !== undefined ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<T>;
}
