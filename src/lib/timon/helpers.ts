/**
 * Timon Data Helpers
 * Transform and persist ring health data into the native Timon DB.
 */
import {
  ACTIVITY_DETAILS_COLLECTION,
  BATTERY_COLLECTION,
  DB_NAME,
  HEART_RATE_COLLECTION,
  HRV_COLLECTION,
  SLEEP_COLLECTION,
  SPO2_COLLECTION,
  TEMPERATURE_COLLECTION,
} from './constants';
import { insert } from './timon-module';
import {
  addNumberOfMinutes,
  FULL_DATE_24_HOUR_TIME_FORMAT,
  getTodaysDate,
  getTodaysDateInUtc,
  handleCatch,
} from './utils';

type StorageDep = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

type RingManagerDep = {
  setBatteryLevel: (level: number) => Promise<void>;
};

let _storage: StorageDep | null = null;
let _ringManager: RingManagerDep | null = null;

export function configureTimonHelpers(deps: {
  storage?: StorageDep;
  ringManager?: RingManagerDep;
}) {
  if (deps.storage)
    _storage = deps.storage;
  if (deps.ringManager)
    _ringManager = deps.ringManager;
}

const LAST_BATTERY_STORED_TIME_STAMP = 'LAST_BATTERY_STORED_TIME_STAMP';
const EMPTY_DATA_ERROR_MESSAGE = 'Empty or falsy data received';

/**
 * Transforms aggregate sleep records into individual resolution rows (1 or 5 min).
 * Matches legacy ziva_app logic exactly.
 */
export function transformSleepData(data: any[]) {
  return data.flatMap((entry) => {
    const { sleepQuality, unitLength, startTime } = entry;

    if (!sleepQuality?.length || !startTime) {
      handleCatch(
        {
          message: 'Malformed sleep entry — missing sleepQuality or startTime',
        },
        'transformSleepData',
        false,
        { unitLength, hasQuality: !!sleepQuality, hasStart: !!startTime },
      );
      return [];
    }

    // Normalize date separators: SDK sometimes uses dashes, but Timon expects dots
    // eslint-disable-next-line e18e/prefer-static-regex
    const normalizedStart = startTime.replace(/-/g, '.');

    return sleepQuality.map((quality: number, index: number) => ({
      date: addNumberOfMinutes(
        normalizedStart,
        FULL_DATE_24_HOUR_TIME_FORMAT,
        index * unitLength,
      ),
      unitLength,
      quality,
      start: normalizedStart,
    }));
  });
}

export async function handleDetailSleepData(arrayDetailSleepData: any[]) {
  if (!arrayDetailSleepData?.length)
    return;

  const processedSleep = transformSleepData(arrayDetailSleepData);
  return insert(DB_NAME, SLEEP_COLLECTION, processedSleep);
}

export async function handleStaticHR(data: any[]) {
  if (!data?.length)
    return;
  return insert(DB_NAME, HEART_RATE_COLLECTION, data);
}

export async function handleHrvData(data: any[]) {
  if (!data?.length)
    return;
  return insert(DB_NAME, HRV_COLLECTION, data);
}

export async function handleAutomaticSpo2Data(data: any[]) {
  if (!data?.length)
    return;
  return insert(DB_NAME, SPO2_COLLECTION, data);
}

export async function handleTemperatureData(data: any[]) {
  if (!data?.length)
    return;
  return insert(DB_NAME, TEMPERATURE_COLLECTION, data);
}

export async function handleActivityDetailsData(data: any[]) {
  if (!data?.length)
    return;
  return insert(DB_NAME, ACTIVITY_DETAILS_COLLECTION, data);
}

/**
 * Battery level handling with once-per-day throttling.
 * Inserts one snapshot per day into battery_table, then updates ringManager state.
 * Requires storage + ringManager deps via configureTimonHelpers.
 */
export async function handleBatteryLevel(batteryLevel: number | string) {
  try {
    if (!batteryLevel) {
      handleCatch(EMPTY_DATA_ERROR_MESSAGE, 'handleBatteryLevel', false, batteryLevel);
      return;
    }

    const lastBatteryUpdated = await _storage?.getItem(LAST_BATTERY_STORED_TIME_STAMP) ?? null;
    const today = getTodaysDate();

    if (lastBatteryUpdated !== today) {
      await insert(DB_NAME, BATTERY_COLLECTION, [
        {
          date: getTodaysDateInUtc(FULL_DATE_24_HOUR_TIME_FORMAT),
          battery: +batteryLevel,
        },
      ]);

      await _storage?.setItem(LAST_BATTERY_STORED_TIME_STAMP, today);
    }

    await _ringManager?.setBatteryLevel(+batteryLevel);
  }
  catch (error) {
    handleCatch(error, 'handleBatteryLevel error', true, { batteryLevel });
  }
}
