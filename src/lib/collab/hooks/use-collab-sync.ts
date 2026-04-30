import type { GlucoseRecord } from '../glucose';

import { useCallback } from 'react';
import { getGlucoseReports, registerZivaUser } from '../glucose';
import { useCollabStore } from '../store';
import { updateUsersInfo } from '../users';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CollabSyncResult = {
  success: boolean;
  error?: string;
};

export type UseCollabSyncResult = {
  /** Push ring ID + timezone to collab custom fields — ported from AppContextProvider L442 */
  pushRingInfo: (ringId: string, timezone: string) => Promise<CollabSyncResult>;
  /** Push MAC address to collab custom fields */
  pushMacAddress: (mac: string) => Promise<CollabSyncResult>;
  /** Fetch glucose reports from collab server — ported from AppContextProvider L497 */
  fetchGlucoseData: (lastSyncDate?: string) => Promise<GlucoseRecord[]>;
  /** Register this user on the Ziva collab server */
  registerZivaUser: () => Promise<CollabSyncResult>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Post-BLE-sync collab operations.
 * Ported from ziva_app AppContextProvider.tsx L442–526.
 */
export function useCollabSync(): UseCollabSyncResult {
  const { isAuthenticated } = useCollabStore();

  const pushRingInfo = useCallback(
    async (ringId: string, timezone: string): Promise<CollabSyncResult> => {
      if (!isAuthenticated)
        return { success: false, error: 'Not authenticated' };
      try {
        await updateUsersInfo({ customFields: { ringId, timezone } });
        return { success: true };
      }
      catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
    [isAuthenticated],
  );

  const pushMacAddress = useCallback(
    async (mac: string): Promise<CollabSyncResult> => {
      if (!isAuthenticated)
        return { success: false, error: 'Not authenticated' };
      try {
        await updateUsersInfo({ customFields: { ringMacAddress: mac } });
        return { success: true };
      }
      catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
    [isAuthenticated],
  );

  const fetchGlucoseData = useCallback(
    async (lastSyncDate?: string): Promise<GlucoseRecord[]> => {
      if (!isAuthenticated)
        return [];
      try {
        const today = new Date().toISOString().split('T')[0];
        const startDate = lastSyncDate ?? getDateDaysAgo(90);
        const response = await getGlucoseReports(startDate, today);
        return response.customFields?.glucoseResult?.success ?? [];
      }
      catch {
        return [];
      }
    },
    [isAuthenticated],
  );

  const doRegisterZivaUser = useCallback(async (): Promise<CollabSyncResult> => {
    if (!isAuthenticated)
      return { success: false, error: 'Not authenticated' };
    try {
      await registerZivaUser();
      return { success: true };
    }
    catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }, [isAuthenticated]);

  return {
    pushRingInfo,
    pushMacAddress,
    fetchGlucoseData,
    registerZivaUser: doRegisterZivaUser,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}
