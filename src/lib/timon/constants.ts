import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

import {
  ActivityDetailsSchema,
  BatterySchema,
  BloodGlucoseSchema,
  HeartRateSchema,
  HRVSchema,
  SleepSchema,
  Spo2Schema,
  TemperatureSchema,
} from './schemas';

// ── Platform helpers ──────────────────────────────────────────────────
export const IS_ANDROID = Platform.OS === 'android';
export const IS_IOS = Platform.OS === 'ios';

// ── Timon configuration ──────────────────────────────────────────────
export const DEFAULT_BUCKET_INTERVAL = 10080;
export const ROOT_DIRECTORY_NAME = 'zivaringapp';
export const DEFAULT_TIMON_USER = 'default_user';

export const DB_NAME = 'zivaring';

const stripFileScheme = (uri: string) =>
  uri.startsWith('file://') ? uri.replace('file://', '') : uri;

export const ROOT_DIRECTORY_PATH =
  Platform.OS === 'android'
    ? stripFileScheme(FileSystem.Paths.document.uri)
    : stripFileScheme(FileSystem.Paths.document.uri + ROOT_DIRECTORY_NAME);

// ── Collection / table names ─────────────────────────────────────────
export const SPO2_COLLECTION = 'spo2';
export const HRV_COLLECTION = 'hrv_table';
export const SLEEP_COLLECTION = 'sleep';
export const HEART_RATE_COLLECTION = 'heartrate';
export const BATTERY_COLLECTION = 'battery_table';
export const ACTIVITY_DETAILS_COLLECTION = 'activitydetails';
export const TEMPERATURE_COLLECTION = 'temperature_table';
export const BLOOD_GLUCOSE_COLLECTION = 'blood_glucose_table';

export const TABLES_LIST = [
  HRV_COLLECTION,
  SPO2_COLLECTION,
  SLEEP_COLLECTION,
  BATTERY_COLLECTION,
  HEART_RATE_COLLECTION,
  TEMPERATURE_COLLECTION,
  BLOOD_GLUCOSE_COLLECTION,
  ACTIVITY_DETAILS_COLLECTION,
];

export const TABLES_SCHEMA = {
  [SPO2_COLLECTION]: Spo2Schema,
  [SLEEP_COLLECTION]: SleepSchema,
  [HRV_COLLECTION]: HRVSchema,
  [HEART_RATE_COLLECTION]: HeartRateSchema,
  [BATTERY_COLLECTION]: BatterySchema,
  [ACTIVITY_DETAILS_COLLECTION]: ActivityDetailsSchema,
  [TEMPERATURE_COLLECTION]: TemperatureSchema,
  [BLOOD_GLUCOSE_COLLECTION]: BloodGlucoseSchema,
};
