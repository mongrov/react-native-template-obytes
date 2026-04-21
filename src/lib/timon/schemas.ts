export const HRVSchema = {
  date: {
    type: 'int',
    required: true,
    unique: true,
    datetime: true,
  },
  hrv: {
    type: 'int',
  },
  heartRate: {
    type: 'int',
  },
  stress: {
    type: 'int',
  },
  diastolicBP: {
    type: 'int',
  },
  systolicBP: {
    type: 'int',
  },
  vascularAging: {
    type: 'int',
  },
  highBP: {
    type: 'int',
  },
  lowBP: {
    type: 'int',
  },
  is_sync: {
    type: 'bool',
  },
};

export const Spo2Schema = {
  date: {
    type: 'int',
    required: true,
    unique: true,
    datetime: true,
  },
  automaticSpo2Data: {
    type: 'int',
    required: true,
  },
  is_sync: {
    type: 'bool',
  },
};

export const SleepSchema = {
  date: {
    type: 'int',
    required: true,
    unique: true,
    datetime: true,
  },
  unitLength: {
    type: 'float',
  },
  quality: {
    type: 'float',
  },
  start: {
    type: 'string',
  },
};

export const HeartRateSchema = {
  date: {
    type: 'int',
    required: true,
    unique: true,
    datetime: true,
  },
  singleHR: {
    type: 'int',
    required: true,
  },
  is_sync: {
    type: 'bool',
  },
};

export const BatterySchema = {
  date: {
    type: 'int',
    required: true,
    unique: true,
    datetime: true,
  },
  battery: {
    type: 'int',
    required: true,
  },
  max_rows: 100,
};

export const ActivityDetailsSchema = {
  date: {
    type: 'int',
    required: true,
    unique: true,
    datetime: true,
  },
  distance: {
    type: 'float',
  },
  step: {
    type: 'int',
  },
  calories: {
    type: 'float',
  },
  arraySteps: {
    type: 'array',
  },
  is_sync: {
    type: 'bool',
  },
};

export const TemperatureSchema = {
  date: {
    type: 'int',
    required: true,
    unique: true,
    datetime: true,
  },
  temperature: {
    type: 'float',
    required: true,
  },
  is_sync: {
    type: 'bool',
  },
};

export const BloodGlucoseSchema = {
  date: {
    type: 'int',
    required: true,
    unique: true,
    datetime: true,
  },
  time: {
    type: 'string',
  },
  seq: {
    type: 'string',
  },
  mac: {
    type: 'string',
  },
  userId: {
    type: 'string',
  },
  bgemType: {
    type: 'float',
  },
  classification: {
    type: 'string',
  },
  within2HrsMeal: {
    type: 'bool',
  },
  fasting: {
    type: 'bool',
  },
  day: {
    type: 'string',
  },
  completed: {
    type: 'bool',
  },
  useRiskLevel: {
    type: 'bool',
  },
  riskCode: {
    type: 'string',
  },
  riskLevel: {
    type: 'float',
  },
  analyse: {
    type: 'string',
  },
  timeStamp: {
    type: 'string',
  },
};
