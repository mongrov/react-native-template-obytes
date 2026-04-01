import { jwtDecode } from 'jwt-decode';
import { useMemo } from 'react';
import { useAuthStore } from '@/features/auth/use-auth-store';

type JwtPayload = {
  sub?: string;
  email?: string;
  name?: string;
  tenant_id?: string;
  tenant_name?: string;
  permissions?: string[];
  [key: string]: unknown;
};

export type Session = {
  user: { id: string; email: string; name: string } | null;
  tenant: { id: string; name: string } | null;
  permissions: string[];
  hasPermission: (p: string) => boolean;
};

export function useSession(): Session {
  const token = useAuthStore.use.token();

  return useMemo(() => {
    if (!token?.access) {
      return {
        user: null,
        tenant: null,
        permissions: [],
        hasPermission: () => false,
      };
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token.access);
      const permissions = decoded.permissions ?? [];

      return {
        user: decoded.sub
          ? {
              id: decoded.sub,
              email: decoded.email ?? '',
              name: decoded.name ?? '',
            }
          : null,
        tenant: decoded.tenant_id
          ? {
              id: decoded.tenant_id,
              name: decoded.tenant_name ?? '',
            }
          : null,
        permissions,
        hasPermission: (p: string) => permissions.includes(p),
      };
    }
    catch {
      return {
        user: null,
        tenant: null,
        permissions: [],
        hasPermission: () => false,
      };
    }
  }, [token?.access]);
}
