/**
 * Timon Debug Hook
 * Provides reactive state and actions for debugging the native Timon database engine.
 * Includes the ability to persist real ring sync data (from BLE) into Timon's local DB,
 * mirroring how ziva_app stores ring data.
 * Only tests LOCAL functions — no cloud / server calls.
 */

import { useCallback, useState } from 'react';

import {
  DB_NAME,
  DEFAULT_BUCKET_INTERVAL,
  DEFAULT_TIMON_USER,
  ROOT_DIRECTORY_PATH,
  TABLES_LIST,
  TABLES_SCHEMA,
} from '../constants';
import {
  handleActivityDetailsData,
  handleAutomaticSpo2Data,
  handleDetailSleepData,
  handleHrvData,
  handleStaticHR,
  handleTemperatureData,
} from '../helpers';
import {
  createDatabase,
  createTable,
  deleteTable,
  initTimon,
  listDatabases,
  listTables,
  query,
} from '../timon-module';
import type {
  ActivityDataItem,
  HeartRateItem,
  HRVDataItem,
  SleepDataItem,
  SpO2DataItem,
  TemperatureDataItem,
} from '../types';

// ── Types ──────────────────────────────────────────────────────────────
export interface TimonDebugLog {
  id: number;
  timestamp: Date;
  action: string;
  success: boolean;
  message: string;
}

export interface TimonDebugState {
  isInitialized: boolean;
  isInitializing: boolean;
  initError: string | null;
  databases: string[];
  tables: string[];
  logs: TimonDebugLog[];
  isBusy: boolean;
}

// ── Hook ───────────────────────────────────────────────────────────────
// eslint-disable-next-line max-lines-per-function
export function useTimonDebug() {
  const [state, setState] = useState<TimonDebugState>({
    isInitialized: false,
    isInitializing: false,
    initError: null,
    databases: [],
    tables: [],
    logs: [],
    isBusy: false,
  });

  let logId = 0;
  const addLog = useCallback(
    (action: string, success: boolean, message: string) => {
      setState((s) => ({
        ...s,
        logs: [
          {
            id: ++logId,
            timestamp: new Date(),
            action,
            success,
            message,
          },
          ...s.logs,
        ].slice(0, 50),
      }));
    },
    [logId]
  );

  // ── Initialize Timon + create default DB + tables ──
  const initializeTimon = useCallback(async () => {
    setState((s) => ({ ...s, isInitializing: true, initError: null }));
    try {
      await initTimon(
        ROOT_DIRECTORY_PATH,
        DEFAULT_BUCKET_INTERVAL,
        DEFAULT_TIMON_USER
      );
      addLog('initTimon', true, 'Timon engine initialized');

      // Ensure default DB exists
      const dbList = await listDatabases();
      if (!dbList?.includes(DB_NAME)) {
        await createDatabase(DB_NAME);
        addLog('createDatabase', true, `Created ${DB_NAME}`);
      }

      // Ensure all tables exist
      const currentTables = (await listTables(DB_NAME)) ?? [];
      const missing = TABLES_LIST.filter((t) => !currentTables.includes(t));
      for (const table of missing) {
        await createTable(
          DB_NAME,
          table,
          JSON.stringify(TABLES_SCHEMA[table as keyof typeof TABLES_SCHEMA])
        );
        addLog('createTable', true, `Created ${table}`);
      }

      const finalDbs = (await listDatabases()) ?? [];
      const finalTables = (await listTables(DB_NAME)) ?? [];

      setState((s) => ({
        ...s,
        isInitialized: true,
        isInitializing: false,
        databases: finalDbs,
        tables: finalTables,
      }));
      addLog(
        'init',
        true,
        `Ready — ${finalDbs.length} DBs, ${finalTables.length} tables`
      );
    } catch (error) {
      const msg = String(error);
      setState((s) => ({ ...s, isInitializing: false, initError: msg }));
      addLog('initTimon', false, msg);
    }
  }, [addLog]);

  // ── Refresh DB/table lists ──
  const refreshLists = useCallback(async () => {
    try {
      const dbs = (await listDatabases()) ?? [];
      const tbls = (await listTables(DB_NAME)) ?? [];
      setState((s) => ({ ...s, databases: dbs, tables: tbls }));
      addLog('refresh', true, `${dbs.length} DBs, ${tbls.length} tables`);
    } catch (e) {
      addLog('refresh', false, String(e));
    }
  }, [addLog]);

  // ── Persist REAL ring sync data to Timon (mirrors sync-persistence.ts → RxDB) ──
  const persistSyncDataToTimon = useCallback(
    async (data: {
      sleepData: SleepDataItem[];
      activityData: ActivityDataItem[];
      heartRateData: HeartRateItem[];
      hrvData: HRVDataItem[];
      spo2Data: SpO2DataItem[];
      temperatureData: TemperatureDataItem[];
    }) => {
      setState((s) => ({ ...s, isBusy: true }));
      try {
        // Heart Rate
        if (data.heartRateData.length > 0) {
          const hrDocs = data.heartRateData.map((item) => ({
            date: item.date,
            singleHR: item.heartRate,
          }));
          await handleStaticHR(hrDocs);
          addLog('insert', true, `HR: ${hrDocs.length} rows`);
        }

        // Sleep
        if (data.sleepData.length > 0) {
          await handleDetailSleepData(data.sleepData);
          addLog('insert', true, `Sleep: ${data.sleepData.length} sessions`);
        }

        // SpO2
        if (data.spo2Data.length > 0) {
          const spo2Docs = data.spo2Data.map((item) => ({
            date: item.date,
            automaticSpo2Data: item.bloodOxygen,
          }));
          await handleAutomaticSpo2Data(spo2Docs);
          addLog('insert', true, `SpO2: ${spo2Docs.length} rows`);
        }

        // HRV
        if (data.hrvData.length > 0) {
          const hrvDocs = data.hrvData.map((item) => ({
            date: item.date,
            hrv: item.hrv,
            stress: item.stress,
            vascularAging: item.vascularAging,
            highBP: item.highBP,
            lowBP: item.lowBP,
          }));
          await handleHrvData(hrvDocs);
          addLog('insert', true, `HRV: ${hrvDocs.length} rows`);
        }

        // Temperature
        if (data.temperatureData.length > 0) {
          const tempDocs = data.temperatureData.map((item) => ({
            date: item.date,
            temperature: item.temperature,
          }));
          await handleTemperatureData(tempDocs);
          addLog('insert', true, `Temp: ${tempDocs.length} rows`);
        }

        // Activity Details
        if (data.activityData.length > 0) {
          const activityDocs = data.activityData.map((item) => ({
            date: item.date,
            step: item.steps,
            calories: item.calories,
            distance: item.distance,
            arraySteps: item.stepsArray || [],
          }));
          await handleActivityDetailsData(activityDocs);
          addLog('insert', true, `Activity: ${activityDocs.length} rows`);
        }

        addLog('persistSync', true, '✅ Real ring data persisted to Timon');
      } catch (e) {
        addLog('persistSync', false, String(e));
      } finally {
        setState((s) => ({ ...s, isBusy: false }));
      }
    },
    [addLog]
  );

  // ── Query a table ──
  const queryTable = useCallback(
    async (tableName: string) => {
      try {
        const result: any = await query(
          DB_NAME,
          `SELECT count(*) as cnt FROM ${tableName}`
        );
        if (result === null || result === undefined) {
          throw new Error('Table empty or query failed (Rust returned null)');
        }
        if (result instanceof Error) {
          throw result;
        }
        const resultStr = JSON.stringify(result);
        addLog('query', true, `${tableName}: ${resultStr}`);
      } catch (e) {
        addLog('query', false, String(e));
      }
    },
    [addLog]
  );

  // ── Clear a single table (delete + recreate) ──
  const clearTable = useCallback(
    async (tableName: string) => {
      try {
        await deleteTable(DB_NAME, tableName);
        const schema = TABLES_SCHEMA[tableName as keyof typeof TABLES_SCHEMA];
        if (schema) {
          await createTable(DB_NAME, tableName, JSON.stringify(schema));
        }
        addLog('clearTable', true, `Cleared & recreated ${tableName}`);
      } catch (e) {
        addLog('clearTable', false, String(e));
      }
    },
    [addLog]
  );

  // ── Clear ALL tables ──
  const clearAllTables = useCallback(async () => {
    setState((s) => ({ ...s, isBusy: true }));
    try {
      for (const table of TABLES_LIST) {
        await deleteTable(DB_NAME, table);
        await createTable(
          DB_NAME,
          table,
          JSON.stringify(TABLES_SCHEMA[table as keyof typeof TABLES_SCHEMA])
        );
      }
      addLog('clearAll', true, `All ${TABLES_LIST.length} tables cleared`);
    } catch (e) {
      addLog('clearAll', false, String(e));
    } finally {
      setState((s) => ({ ...s, isBusy: false }));
    }
  }, [addLog]);

  return {
    ...state,
    initializeTimon,
    refreshLists,
    persistSyncDataToTimon,
    queryTable,
    clearTable,
    clearAllTables,
  };
}
