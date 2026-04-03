import type { TenantConfig } from '@mongrov/auth';

/**
 * Define your tenants here. Each tenant can have its own:
 * - auth method (email-password, social, SSO, or composite)
 * - backend configuration (odoo, rocketchat, postgres, etc.)
 *
 * For single-tenant apps, define one tenant.
 * For multi-tenant apps, define multiple and enable tenant selection.
 */
export const tenants: TenantConfig[] = [
  {
    id: 'default',
    name: 'Demo App',
    auth: { method: 'email-password' },
    backend: { type: 'odoo', url: 'https://demo.example.com' },
  },
  // Example: Multi-tenant with different auth methods
  // {
  //   id: 'acme-corp',
  //   name: 'Acme Corporation',
  //   auth: {
  //     method: 'composite',
  //     primary: { method: 'email-password' },
  //     alternatives: [
  //       { method: 'social', providers: ['google', 'github'] },
  //       { method: 'sso', provider: 'Okta', issuer: 'https://acme.okta.com', clientId: 'xxx' },
  //     ],
  //   },
  //   backend: { type: 'odoo', url: 'https://acme.example.com' },
  // },
  // {
  //   id: 'beta-corp',
  //   name: 'Beta Inc',
  //   auth: { method: 'sso', provider: 'Azure AD', issuer: 'https://login.microsoftonline.com/xxx', clientId: 'yyy' },
  //   backend: { type: 'rocketchat', url: 'https://chat.beta.com' },
  // },
];

/**
 * Whether the app supports multiple tenants.
 * Set to true to enable tenant selection on login.
 */
export const isMultiTenant = tenants.length > 1;

/**
 * Default tenant ID (used when not in multi-tenant mode).
 */
export const defaultTenantId = tenants[0]?.id ?? 'default';
