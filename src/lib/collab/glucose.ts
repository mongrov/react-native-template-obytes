import { zivaFetch } from './client';
import { useCollabStore } from './store';

// ─── Types ───────────────────────────────────────────────────────────────────

export type GlucoseSubmitRequest = {
  [key: string]: unknown;
};

export type GlucoseSubmitResponse = {
  success: boolean;
  [key: string]: unknown;
};

export type GlucoseRecord = {
  analyse?: string;
  time?: string;
  date?: string;
  [key: string]: unknown;
};

export type GlucoseReportResponse = {
  success: boolean;
  customFields?: {
    glucoseResult?: {
      success?: GlucoseRecord[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type ZivaUserResponse = {
  success: boolean;
  [key: string]: unknown;
};

// ─── Methods ─────────────────────────────────────────────────────────────────

/**
 * Submit PPG glucose data — ported from rc/index.js L3294
 * POST /api/v1/ziva.glucose
 */
export async function submitGlucoseData(
  jcData: GlucoseSubmitRequest,
): Promise<GlucoseSubmitResponse> {
  const { userId } = useCollabStore.getState();
  return zivaFetch<GlucoseSubmitResponse>('POST', '/ziva.glucose', { ...jcData, userId });
}

/**
 * Fetch glucose reports — ported from rc/index.js L3324
 * GET /api/v1/ziva.reports
 */
export async function getGlucoseReports(
  startDate: string,
  endDate = '',
): Promise<GlucoseReportResponse> {
  const { userId } = useCollabStore.getState();
  return zivaFetch<GlucoseReportResponse>('GET', '/ziva.reports', undefined, {
    userId: userId ?? '',
    asc: '-1',
    startDay: startDate,
    endDate,
    sortBy: 'day',
  });
}

/**
 * Register Ziva user on the collab server
 * POST /api/v1/ziva.user
 */
export async function registerZivaUser(): Promise<ZivaUserResponse> {
  return zivaFetch<ZivaUserResponse>('POST', '/ziva.user', {});
}
