/**
 * Example authentication adapters for different backends.
 *
 * These adapters implement the AuthAdapter interface from @mongrov/auth
 * and can be used to authenticate with various backend systems.
 *
 * Usage:
 * ```ts
 * // In src/lib/auth/adapter.ts
 * import { createOdooAdapter } from './adapters/odoo';
 * import { createRocketChatAdapter } from './adapters/rocketchat';
 *
 * // Choose based on tenant config
 * export function createAdapterForTenant(tenant: TenantConfig): AuthAdapter {
 *   switch (tenant.backend.type) {
 *     case 'odoo':
 *       return createOdooAdapter({
 *         baseUrl: tenant.backend.url,
 *         database: 'your-db', // Could be part of tenant config
 *       });
 *     case 'rocketchat':
 *       return createRocketChatAdapter({
 *         baseUrl: tenant.backend.url,
 *       });
 *     default:
 *       return defaultAdapter;
 *   }
 * }
 * ```
 */

export { createOdooAdapter } from './odoo';
export type { OdooAdapterConfig } from './odoo';

export { createRocketChatAdapter, createRocketChatClient } from './rocketchat';
export type { RocketChatAdapterConfig } from './rocketchat';
