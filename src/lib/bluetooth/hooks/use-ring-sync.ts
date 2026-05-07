/**
 * useRingSync
 * React hook wrapping the XState ringSyncMachine
 */

import type { JStyleAdapter, SyncContext, SyncStage } from '@/lib/bluetooth';

import { useMachine } from '@xstate/react';

import * as React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';

import { ringManager, ringSyncMachine } from '@/lib/bluetooth';

export type UseRingSyncReturn = {
  currentStage: SyncStage;
  isSyncing: boolean;
  isSuccess: boolean;
  isPersisting: boolean;
  isError: boolean;
  isIdle: boolean;
  progress: number;
  completedStages: SyncStage[];
  batteryLevel: number;
  deviceVersion: string;
  sleepData: SyncContext['sleepData'];
  activityData: SyncContext['activityData'];
  heartRateData: SyncContext['heartRateData'];
  hrvData: SyncContext['hrvData'];
  spo2Data: SyncContext['spo2Data'];
  temperatureData: SyncContext['temperatureData'];
  lastSyncTime: Date | null;
  error: string | null;
  startSync: (adapter: JStyleAdapter) => void;
  abort: () => void;
  retry: (adapter: JStyleAdapter) => void;
  reset: () => void;
  context: SyncContext;
};

/**
 * Background-persist synced data to RxDB via ringManager.
 * Runs after BLE sync completes so it doesn't block BLE comms.
 */
async function persistAllSyncData(ctx: SyncContext): Promise<void> {
  console.log('[RingSync] Starting background RxDB persistence...');
  try {
    await Promise.allSettled([
      ctx.heartRateData.length > 0
        ? ringManager.insertHeartRateData(
            ctx.heartRateData.map(h => ({ date: h.date, singleHR: h.heartRate })),
          )
        : Promise.resolve(),
      ctx.sleepData.length > 0
        ? ringManager.insertSleepData(
            ctx.sleepData.map(s => ({
              date: s.startTime,
              quality: s.sleepQuality,
              unitLength: s.unitLength,
            })),
          )
        : Promise.resolve(),
      ctx.spo2Data.length > 0
        ? ringManager.insertSpO2Data(
            ctx.spo2Data.map(s => ({ date: s.date, automaticSpo2Data: s.bloodOxygen })),
          )
        : Promise.resolve(),
      ctx.hrvData.length > 0
        ? ringManager.insertHRVData(
            ctx.hrvData.map(h => ({
              date: h.date,
              hrv: h.hrv,
              stress: h.stress,
              vascularAging: h.vascularAging,
              highBP: h.highBP,
              lowBP: h.lowBP,
            })),
          )
        : Promise.resolve(),
      ctx.activityData.length > 0
        ? ringManager.insertActivityData(
            ctx.activityData.map(a => ({
              date: a.date,
              step: a.steps,
              calories: a.calories,
              distance: a.distance,
              arraySteps: a.stepsArray,
            })),
          )
        : Promise.resolve(),
      ctx.temperatureData.length > 0
        ? ringManager.insertTemperatureData(
            ctx.temperatureData.map(t => ({ date: t.date, temperature: t.temperature })),
          )
        : Promise.resolve(),
    ]);
    await ringManager.setLastSyncDate(new Date().toISOString());
    console.log('[RingSync] Background RxDB persistence complete.');
  }
  catch (e) {
    console.warn('[RingSync] Background persistence failed:', e);
  }
}

export function useRingSync(): UseRingSyncReturn {
  const [state, send] = useMachine(ringSyncMachine);
  const [isPersisting, setIsPersisting] = useState(false);
  const lastPersistedTimeRef = useRef<number>(0);

  const currentStage = state.context.currentStage;
  const isSyncing = !['idle', 'success', 'error', 'aborting'].includes(state.value as string);
  const isSuccess = state.matches('success');
  const isError = state.matches('error');
  const isIdle = state.matches('idle');

  // Fire-and-forget: persist all data to RxDB when a new sync succeeds
  React.useEffect(() => {
    let cancelled = false;
    const currentSyncTime = state.context.lastSyncTime?.getTime() ?? 0;
    if (isSuccess && currentSyncTime > lastPersistedTimeRef.current) {
      lastPersistedTimeRef.current = currentSyncTime;
      void Promise.resolve().then(() => {
        if (cancelled)
          return;
        setIsPersisting(true);
        persistAllSyncData(state.context).finally(() => {
          if (!cancelled)
            setIsPersisting(false);
        });
      });
    }
    return () => {
      cancelled = true;
    };
  }, [isSuccess, state.context.lastSyncTime]);

  const startSync = useCallback(
    (adapter: JStyleAdapter) => send({ type: 'START_SYNC', adapter }),
    [send],
  );
  const abort = useCallback(() => send({ type: 'ABORT' }), [send]);
  const retry = useCallback(
    (adapter: JStyleAdapter) => send({ type: 'RETRY', adapter }),
    [send],
  );
  const reset = useCallback(() => send({ type: 'RESET' }), [send]);

  const {
    progress,
    completedStages,
    batteryLevel,
    deviceVersion,
    sleepData,
    activityData,
    heartRateData,
    hrvData,
    spo2Data,
    temperatureData,
    lastSyncTime,
    error,
  } = state.context;

  return useMemo(
    () => ({
      currentStage,
      isSyncing,
      isSuccess,
      isPersisting,
      isError,
      isIdle,
      progress,
      completedStages,
      batteryLevel,
      deviceVersion,
      sleepData,
      activityData,
      heartRateData,
      hrvData,
      spo2Data,
      temperatureData,
      lastSyncTime,
      error,
      startSync,
      abort,
      retry,
      reset,
      context: state.context,
    }),
    [
      currentStage,
      isSyncing,
      isSuccess,
      isPersisting,
      isError,
      isIdle,
      progress,
      completedStages,
      batteryLevel,
      deviceVersion,
      sleepData,
      activityData,
      heartRateData,
      hrvData,
      spo2Data,
      temperatureData,
      lastSyncTime,
      error,
      startSync,
      abort,
      retry,
      reset,
      state.context,
    ],
  );
}
