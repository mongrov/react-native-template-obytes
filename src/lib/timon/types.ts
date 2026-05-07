/**
 * Ring data types used by timon persistence helpers.
 * Extracted from the JStyle response-parser so timon stays self-contained
 * without depending on the full ring/protocols module.
 */

export type SleepDataItem = {
  startTime: string;
  totalSleepTime: number;
  sleepQuality: number[];
  unitLength: number; // 1 = 1 minute, 5 = 5 minutes
};

export type ActivityDataItem = {
  date: string;
  steps: number;
  calories: number;
  distance: number;
  stepsArray: number[];
};

export type HeartRateItem = {
  date: string;
  heartRate: number;
};

export type HRVDataItem = {
  date: string;
  hrv: number;
  vascularAging: number;
  stress: number;
  heartRate: number;
  highBP: number;
  lowBP: number;
  diastolicBP?: number;
  systolicBP?: number;
};

export type SpO2DataItem = {
  date: string;
  bloodOxygen: number;
};

export type TemperatureDataItem = {
  date: string;
  temperature: number;
};
