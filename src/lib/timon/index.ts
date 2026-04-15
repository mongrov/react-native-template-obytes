/**
 * Timon Module
 * Self-contained wrapper around the native Timon (Rust-backed) database engine.
 *
 * Re-exports everything consumers need:
 *  - Native bridge functions (init, CRUD, cloud sync, etc.)
 *  - Data transformation helpers (sleep, HR, HRV, SpO2, temperature, activity, battery)
 *  - Table schemas & constants
 *  - Ring data types
 *  - Debug hook
 */

// ── Native module bridge ──────────────────────────────────────────────
export {
  cloudFetchParquet,
  cloudFetchParquetBatch,
  cloudSinkParquet,
  cloudSyncParquet,
  createDatabase,
  createTable,
  currentDataViewUser,
  deleteDatabase,
  deleteTable,
  getAllSyncMetadata,
  getSyncMetadata,
  initBucket,
  initTimon,
  insert,
  listDatabases,
  listTables,
  preloadTables,
  query,
  queryBucket,
  setCurrentDataViewUser,
} from './timon-module';

// ── Data helpers ──────────────────────────────────────────────────────
export {
  handleActivityDetailsData,
  handleAutomaticSpo2Data,
  handleBatteryLevel,
  handleDetailSleepData,
  handleHrvData,
  handleStaticHR,
  handleTemperatureData,
  transformSleepData,
} from './helpers';

// ── Schemas ───────────────────────────────────────────────────────────
export {
  ActivityDetailsSchema,
  BatterySchema,
  BloodGlucoseSchema,
  HeartRateSchema,
  HRVSchema,
  SleepSchema,
  Spo2Schema,
  TemperatureSchema,
} from './schemas';

// ── Constants ─────────────────────────────────────────────────────────
export {
  ACTIVITY_DETAILS_COLLECTION,
  BATTERY_COLLECTION,
  BLOOD_GLUCOSE_COLLECTION,
  DB_NAME,
  DEFAULT_BUCKET_INTERVAL,
  DEFAULT_TIMON_USER,
  HEART_RATE_COLLECTION,
  HRV_COLLECTION,
  IS_ANDROID,
  IS_IOS,
  ROOT_DIRECTORY_NAME,
  ROOT_DIRECTORY_PATH,
  SLEEP_COLLECTION,
  SPO2_COLLECTION,
  TABLES_LIST,
  TABLES_SCHEMA,
  TEMPERATURE_COLLECTION,
} from './constants';

// ── Types ─────────────────────────────────────────────────────────────
export type {
  ActivityDataItem,
  HeartRateItem,
  HRVDataItem,
  SleepDataItem,
  SpO2DataItem,
  TemperatureDataItem,
} from './types';

// ── Hooks ─────────────────────────────────────────────────────────────
export { useTimonDebug } from './hooks/use-timon-debug';
export type { TimonDebugLog, TimonDebugState } from './hooks/use-timon-debug';
