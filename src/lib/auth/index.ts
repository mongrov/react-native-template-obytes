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
// OAuth/SSO hooks - uncomment if you install expo-auth-session and expo-web-browser
// export { useOAuthFlow, useSocialAuth, useSSOAuth } from './use-oauth-flow';
// export type { OAuthConfig, OAuthResult, SSOConfig } from './use-oauth-flow';

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
