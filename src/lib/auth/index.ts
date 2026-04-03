import type { AuthClientConfig } from '@mongrov/auth';
import { authAdapter } from './adapter';

export const authConfig: AuthClientConfig = {
  adapter: authAdapter,
  proactiveRefresh: true,
  refreshThreshold: 0.8,
};

export { defaultTenantId, isMultiTenant, tenants } from './tenants';
// OAuth/SSO hooks
export { useOAuthFlow, useSocialAuth, useSSOAuth } from './use-oauth-flow';

export type { OAuthConfig, OAuthResult, SSOConfig } from './use-oauth-flow';
// Tenant management
export { getTenantById, useTenant } from './use-tenant';

// Re-export for app consumption
export { useAuth, useSession } from '@mongrov/auth';
export type {
  AuthMethodConfig,
  AuthState,
  Session,
  SocialProvider,
  TenantConfig,
  TenantContext,
  UserInfo,
} from '@mongrov/auth';
