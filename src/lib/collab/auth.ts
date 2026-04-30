import { zivaFetchUnauth } from './client'
import { useCollabStore } from './store'

// ─── Types ───────────────────────────────────────────────────────────────────

export type SocialLoginRequest = {
  serviceName: 'google' | 'apple'
  accessToken?: string
  idToken?: string
  identityToken?: string
  email?: string
  expiresIn?: number
  scope?: string
  fullName?: {
    givenName?: string | null
    familyName?: string | null
  }
}

export type SocialLoginResponse = {
  status: 'success' | 'error'
  data?: {
    authToken: string
    userId: string
    me?: Record<string, unknown>
  }
  message?: string
  error?: string
}

// ─── Auth methods ─────────────────────────────────────────────────────────────

/**
 * Login via username/password — ported from rc/index.js L3218
 */
export async function loginViaRest(
  username: string,
  password: string
): Promise<SocialLoginResponse> {
  const response = await zivaFetchUnauth<SocialLoginResponse>('POST', '/login', {
    user: username,
    password,
  })
  if (response.status === 'success' && response.data?.authToken && response.data?.userId) {
    useCollabStore.getState().setCredentials(response.data.authToken, response.data.userId)
  }
  return response
}

/**
 * Social login (Google / Apple) via REST — ported from rc/index.js L3243
 */
export async function socialLoginViaRest(
  data: SocialLoginRequest
): Promise<SocialLoginResponse> {
  const response = await zivaFetchUnauth<SocialLoginResponse>('POST', '/login', data)
  if (response.status === 'success' && response.data?.authToken && response.data?.userId) {
    useCollabStore.getState().setCredentials(response.data.authToken, response.data.userId)
  }
  return response
}
