import { Platform } from 'react-native';

import { COLLAB_ADMIN_TOKEN, getCollabConfig } from './config';
import { useCollabStore } from './store';

function getBaseUrl(): string {
  return `${getCollabConfig().serverUrl}/api/v1`;
}

const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': Platform.OS,
} as const;

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

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
  return parseResponse<T>(res);
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
  return parseResponse<T>(res);
}

// ─── Admin fetch (admin token for vertivusers.* endpoints) ───────────────────
// WARNING: COLLAB_ADMIN_TOKEN is bundled in the client via EXPO_PUBLIC_*.
// TODO: Route admin calls through a backend proxy to remove token from the app binary.

export async function zivaFetchAdmin<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<T> {
  const { userId } = useCollabStore.getState();
  if (!userId) {
    throw new Error('Not authenticated with collab');
  }

  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      ...DEFAULT_HEADERS,
      'X-Auth-Token': COLLAB_ADMIN_TOKEN,
      'X-User-Id': userId,
    },
    body: method === 'POST' && body !== undefined ? JSON.stringify(body) : undefined,
  });
  return parseResponse<T>(res);
}
