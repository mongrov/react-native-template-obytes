/**
 * Ring data types used by timon persistence helpers.
 * Extracted from the JStyle response-parser so timon stays self-contained
 * without depending on the full ring/protocols module.
 */

export interface SleepDataItem {
  startTime: string;
  totalSleepTime: number;
  sleepQuality: number[];
  unitLength: number; // 1 = 1 minute, 5 = 5 minutes
}

export interface ActivityDataItem {
  date: string;
  steps: number;
  calories: number;
  distance: number;
  stepsArray: number[];
}

export interface HeartRateItem {
  date: string;
  heartRate: number;
}

export interface HRVDataItem {
  date: string;
  hrv: number;
  vascularAging: number;
  stress: number;
  heartRate: number;
  highBP: number;
  lowBP: number;
}

export interface SpO2DataItem {
  date: string;
  bloodOxygen: number;
}

export interface TemperatureDataItem {
  date: string;
  temperature: number;
}
