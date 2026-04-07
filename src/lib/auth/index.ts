import type { AuthClientConfig } from '@mongrov/auth';
import { authAdapter } from './adapter';

export const authConfig: AuthClientConfig = {
  adapter: authAdapter,
  proactiveRefresh: true,
  refreshThreshold: 0.8,
};

export { defaultTenantId, isMultiTenant, tenants } from './tenants';
// Tenant management
export { getTenantById, useTenant } from './use-tenant';
// Biometric lock
export { useBiometricLock } from './use-biometric-lock';
export type { UseBiometricLockResult } from './use-biometric-lock';

// Re-export for app consumption
export { useAuth, useSession, useBiometricGate } from '@mongrov/auth';
export type {
  AuthMethodConfig,
  AuthState,
  Session,
  SocialProvider,
  TenantConfig,
  TenantContext,
  UserInfo,
} from '@mongrov/auth';
