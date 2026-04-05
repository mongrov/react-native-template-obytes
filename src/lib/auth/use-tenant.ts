import type { TenantConfig, TenantContext } from '@mongrov/auth';

import { useCallback, useEffect, useMemo } from 'react';
import { create } from 'zustand';

import { kvStore } from '@/lib/storage';

import { defaultTenantId, isMultiTenant, tenants } from './tenants';

const TENANT_STORAGE_KEY = 'selected_tenant_id';

type TenantStore = {
  tenantId: string | null;
  isReady: boolean;
  setTenantId: (id: string | null) => void;
  setReady: (ready: boolean) => void;
};

const useTenantStore = create<TenantStore>(set => ({
  tenantId: null,
  isReady: false,
  setTenantId: id => set({ tenantId: id }),
  setReady: ready => set({ isReady: ready }),
}));

/**
 * Hook to manage tenant selection and context.
 *
 * Usage:
 * ```tsx
 * const { tenant, tenants, setTenant, isMultiTenant, isReady } = useTenant();
 *
 * // Get current tenant's auth config
 * const authConfig = tenant?.auth;
 *
 * // Switch tenant
 * setTenant('acme-corp');
 * ```
 */
export function useTenant(): TenantContext {
  const { tenantId, isReady, setTenantId, setReady } = useTenantStore();

  // Load persisted tenant on mount
  useEffect(() => {
    async function loadTenant() {
      const storedId = await kvStore.get(TENANT_STORAGE_KEY);
      const validId = tenants.find(t => t.id === storedId)?.id;

      // Use stored tenant if valid, otherwise use default
      setTenantId(validId ?? (isMultiTenant ? null : defaultTenantId));
      setReady(true);
    }
    loadTenant();
  }, [setTenantId, setReady]);

  const tenant = useMemo((): TenantConfig | null => {
    if (!tenantId)
      return null;
    return tenants.find(t => t.id === tenantId) ?? null;
  }, [tenantId]);

  const setTenant = useCallback(
    (id: string | null) => {
      setTenantId(id);
      if (id) {
        kvStore.set(TENANT_STORAGE_KEY, id);
      }
    },
    [setTenantId],
  );

  return {
    tenant,
    tenants,
    setTenant,
    isMultiTenant,
    isReady,
  };
}

/**
 * Get a tenant by ID (non-reactive, for use outside React components).
 */
export function getTenantById(id: string): TenantConfig | undefined {
  return tenants.find(t => t.id === id);
}
