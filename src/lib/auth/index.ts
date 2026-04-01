import type { AuthClientConfig } from '@mongrov/auth';
import { authAdapter } from './adapter';

export const authConfig: AuthClientConfig = {
  adapter: authAdapter,
  proactiveRefresh: true,
  refreshThreshold: 0.8,
};

// Re-export for app consumption
export { useAuth, useSession } from '@mongrov/auth';
export type { AuthState, Session, UserInfo } from '@mongrov/auth';
