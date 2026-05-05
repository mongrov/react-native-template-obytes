import { Platform } from 'react-native';

import { zivaFetch, zivaFetchAdmin } from './client';
import { getCollabConfig } from './config';
import { useCollabStore } from './store';

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserUpdateRequest = {
  customFields?: Record<string, unknown>;
  name?: string;
  email?: string;
  bio?: string;
  [key: string]: unknown;
};

export type UserUpdateResponse = {
  success: boolean;
  user?: Record<string, unknown>;
};

export type UserInfoResponse = {
  success: boolean;
  user?: {
    _id?: string;
    username?: string;
    customFields?: Record<string, unknown>;
    [key: string]: unknown;
  };
};

// ─── Methods ─────────────────────────────────────────────────────────────────

/**
 * Update user info — ported from rc/index.js L3264
 */
export async function updateUsersInfo(data: UserUpdateRequest): Promise<UserUpdateResponse> {
  const { userId } = useCollabStore.getState();
  return zivaFetch<UserUpdateResponse>('POST', '/users.update', { userId, data });
}

/**
 * Get custom fields for a user — ported from rc/index.js L1632
 */
export async function getAllCustomFields(userId?: string): Promise<UserInfoResponse> {
  const { userId: storeUserId } = useCollabStore.getState();
  const targetId = userId ?? storeUserId ?? '';
  return zivaFetch<UserInfoResponse>('GET', '/users.info', undefined, {
    userId: targetId,
    fields: JSON.stringify({ customFields: 1 }),
  });
}

/**
 * Update only custom fields — ported from rc/index.js L1660
 */
export async function updateCustomFields(
  data: Record<string, unknown>,
): Promise<UserUpdateResponse> {
  return updateUsersInfo({ customFields: data });
}

/**
 * Admin update via vertivusers.update — uses COLLAB_ADMIN_TOKEN
 */
export async function updateUserFieldsInCollab(data: unknown): Promise<unknown> {
  return zivaFetchAdmin<unknown>('POST', '/vertivusers.update', data);
}

/**
 * Reset user avatar — ported from rc/index.js
 */
export async function resetUserAvatar(data: unknown): Promise<unknown> {
  return zivaFetch<unknown>('POST', '/users.resetAvatar', data);
}

/**
 * Upload user avatar (multipart/form-data) — ported from rc/index.js
 */
export async function updateUserAvatar(formData: FormData): Promise<unknown> {
  const { authToken, userId } = useCollabStore.getState();
  if (!authToken || !userId) {
    throw new Error('Not authenticated with collab');
  }

  const url = `${getCollabConfig().serverUrl}/api/v1/users.setAvatar`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Auth-Token': authToken,
      'X-User-Id': userId,
      'User-Agent': Platform.OS,
    },
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}
