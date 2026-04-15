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

// Dependency placeholders for ring manager / storage
// In the future, these can be replaced with real RxDB/Native calls
const ringManager = {
  setBatteryLevel: async (level: number) =>
    console.log('Battery level set:', level),
  setDeviceVersion: async (version: string) =>
    console.log('Device version set:', version),
  setMacAddressToStore: async (mac: string) =>
    console.log('MAC address set:', mac),
};

const storage = {
  getItem: async (_key: string) => null,
  setItem: async (_key: string, _value: string) =>
    console.log('Storage set:', _key, _value),
};

const LAST_BATTERY_STORED_TIME_STAMP = 'LAST_BATTERY_STORED_TIME_STAMP';

/**
 * Transforms aggregate sleep records into individual resolution rows (1 or 5 min).
 * Matches legacy ziva_app logic exactly.
 */
export const transformSleepData = (data: any[]) => {
  return data.flatMap((entry) => {
    const { sleepQuality, unitLength, startTime } = entry;

    if (!sleepQuality?.length || !startTime) {
      handleCatch(
        {
          message: 'Malformed sleep entry — missing sleepQuality or startTime',
        },
        'transformSleepData',
        false,
        { unitLength, hasQuality: !!sleepQuality, hasStart: !!startTime }
      );
      return [];
    }

    // Normalize date separators: SDK sometimes uses dashes, but Timon expects dots
    const normalizedStart = startTime.replace(/-/g, '.');

    return sleepQuality.map((quality: number, index: number) => ({
      date: addNumberOfMinutes(
        normalizedStart,
        FULL_DATE_24_HOUR_TIME_FORMAT,
        index * unitLength
      ),
      unitLength: unitLength,
      quality,
      start: normalizedStart,
    }));
  });
};

/**
 * Handle insertion of Sleep data with transformation.
 */
export const handleDetailSleepData = async (arrayDetailSleepData: any[]) => {
  if (!arrayDetailSleepData?.length) return;

  const processedSleep = transformSleepData(arrayDetailSleepData);
  const result = await insert(DB_NAME, SLEEP_COLLECTION, processedSleep);
  if (result instanceof Error) throw result;
  return result;
};

/**
 * Standard handlers for simpler data types.
 */
export const handleStaticHR = async (data: any[]) => {
  if (!data?.length) return;
  return await insert(DB_NAME, HEART_RATE_COLLECTION, data);
};

export const handleHrvData = async (data: any[]) => {
  if (!data?.length) return;
  return await insert(DB_NAME, HRV_COLLECTION, data);
};

export const handleAutomaticSpo2Data = async (data: any[]) => {
  if (!data?.length) return;
  return await insert(DB_NAME, SPO2_COLLECTION, data);
};

export const handleTemperatureData = async (data: any[]) => {
  if (!data?.length) return;
  return await insert(DB_NAME, TEMPERATURE_COLLECTION, data);
};

export const handleActivityDetailsData = async (data: any[]) => {
  if (!data?.length) return;
  return await insert(DB_NAME, ACTIVITY_DETAILS_COLLECTION, data);
};

/**
 * Battery level handling with once-per-day throttling.
 */
export const handleBatteryLevel = async (batteryLevel: number | string) => {
  try {
    if (batteryLevel === undefined || batteryLevel === null) return;

    const lastBatteryUpdated = await storage.getItem(
      LAST_BATTERY_STORED_TIME_STAMP
    );
    const today = getTodaysDate();

    if (lastBatteryUpdated !== today) {
      const result = await insert(DB_NAME, BATTERY_COLLECTION, [
        {
          date: getTodaysDateInUtc(FULL_DATE_24_HOUR_TIME_FORMAT),
          battery: +batteryLevel,
        },
      ]);

      if (result instanceof Error) throw result;
      await storage.setItem(LAST_BATTERY_STORED_TIME_STAMP, today);
    }

    await ringManager.setBatteryLevel(+batteryLevel);
  } catch (error) {
    handleCatch(error, 'handleBatteryLevel error');
  }
};
