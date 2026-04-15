import { 
  transformSleepData, 
  handleDetailSleepData,
  handleStaticHR,
  handleBatteryLevel
} from '../helpers';
import * as timonModule from '../timon-module';
import { DB_NAME, SLEEP_COLLECTION, HEART_RATE_COLLECTION, BATTERY_COLLECTION } from '../constants';

// Mock timon-module
jest.mock('../timon-module', () => ({
  insert: jest.fn(),
  initTimon: jest.fn(),
}));

describe('Timon Data Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


  describe('transformSleepData', () => {
    it('correctly transforms aggregate sleep records into individual resolution rows', () => {
      const mockData = [
        {
          startTime: '2023.01.01 00:00:00',
          unitLength: 5,
          sleepQuality: [1, 2, 3]
        }
      ];

      const result = transformSleepData(mockData);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        date: '2023.01.01 00:00:00',
        unitLength: 5,
        quality: 1,
        start: '2023.01.01 00:00:00'
      });
      expect(result[1].date).toBe('2023.01.01 00:05:00');
      expect(result[2].date).toBe('2023.01.01 00:10:00');
    });

    it('handles malformed data by returning empty array', () => {
      const mockData = [
        {
          startTime: null,
          unitLength: 5,
          sleepQuality: [1]
        }
      ];
      const result = transformSleepData(mockData);
      expect(result).toEqual([]);
    });

    it('normalizes date separators (dashes to dots)', () => {
      const mockData = [
        {
          startTime: '2023-01-01 00:00:00',
          unitLength: 1,
          sleepQuality: [1]
        }
      ];
      const result = transformSleepData(mockData);
      expect(result[0].date).toBe('2023.01.01 00:00:00');
      expect(result[0].start).toBe('2023.01.01 00:00:00');
    });
  });

  describe('handleDetailSleepData', () => {
    it('calls insert with transformed sleep data', async () => {
      const mockData = [
        {
          startTime: '2023.01.01 00:00:00',
          unitLength: 5,
          sleepQuality: [1]
        }
      ];
      
      (timonModule.insert as jest.Mock).mockResolvedValue({ success: true });

      await handleDetailSleepData(mockData);

      expect(timonModule.insert).toHaveBeenCalledWith(
        DB_NAME,
        SLEEP_COLLECTION,
        expect.arrayContaining([
          expect.objectContaining({ quality: 1 })
        ])
      );
    });

    it('returns undefined if input array is empty', async () => {
      const result = await handleDetailSleepData([]);
      expect(result).toBeUndefined();
      expect(timonModule.insert).not.toHaveBeenCalled();
    });
  });

  describe('handleStaticHR', () => {
    it('calls insert with raw heart rate data', async () => {
      const mockData = [{ date: '...', value: 70 }];
      (timonModule.insert as jest.Mock).mockResolvedValue({ success: true });

      await handleStaticHR(mockData);

      expect(timonModule.insert).toHaveBeenCalledWith(
        DB_NAME,
        HEART_RATE_COLLECTION,
        mockData
      );
    });
  });

  describe('handleBatteryLevel', () => {
    it('performs insertion and sets battery level in manager', async () => {
      (timonModule.insert as jest.Mock).mockResolvedValue({ success: true });
      
      await handleBatteryLevel(85);

      expect(timonModule.insert).toHaveBeenCalledWith(
        DB_NAME,
        BATTERY_COLLECTION,
        expect.arrayContaining([
          expect.objectContaining({ battery: 85 })
        ])
      );
    });

    it('skips if battery level is null/undefined', async () => {
      await handleBatteryLevel(null as any);
      expect(timonModule.insert).not.toHaveBeenCalled();
    });
  });
});
