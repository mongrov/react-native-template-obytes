jest.mock('../client', () => ({
  zivaFetch: jest.fn(),
}));

jest.mock('../store', () => ({
  useCollabStore: {
    getState: jest.fn(() => ({
      userId: 'user123',
    })),
  },
}));

const mockZivaFetch = jest.requireMock('../client').zivaFetch as jest.Mock;
const mockUseCollabStore = jest.requireMock('../store').useCollabStore as any;

describe('Collab Glucose', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitGlucoseData', () => {
    it('posts glucose data with userId', async () => {
      mockZivaFetch.mockResolvedValue({
        success: true,
      });

      const { submitGlucoseData } = require('../glucose');
      const glucoseData = {
        value: 120,
        time: '2026-04-24T10:30:00Z',
      };

      await submitGlucoseData(glucoseData);

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'POST',
        '/ziva.glucose',
        {
          userId: 'user123',
          value: 120,
          time: '2026-04-24T10:30:00Z',
        }
      );
    });

    it('includes all custom fields in request', async () => {
      mockZivaFetch.mockResolvedValue({
        success: true,
      });

      const { submitGlucoseData } = require('../glucose');
      const glucoseData = {
        value: 95,
        time: '2026-04-24T14:00:00Z',
        analyse: 'normal',
        notes: 'After meal',
      };

      await submitGlucoseData(glucoseData);

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'POST',
        '/ziva.glucose',
        expect.objectContaining({
          userId: 'user123',
          value: 95,
          time: '2026-04-24T14:00:00Z',
          analyse: 'normal',
          notes: 'After meal',
        })
      );
    });

    it('returns success response', async () => {
      const response = { success: true, data: { id: 'glucose_123' } };
      mockZivaFetch.mockResolvedValue(response);

      const { submitGlucoseData } = require('../glucose');
      const result = await submitGlucoseData({ value: 120 });

      expect(result).toEqual(response);
    });

    it('returns error response on server error', async () => {
      const errorResponse = { success: false, error: 'Submission failed' };
      mockZivaFetch.mockResolvedValue(errorResponse);

      const { submitGlucoseData } = require('../glucose');
      const result = await submitGlucoseData({ value: 120 });

      expect(result).toEqual(errorResponse);
    });

    it('throws on network error', async () => {
      mockZivaFetch.mockRejectedValue(new Error('Network error'));

      const { submitGlucoseData } = require('../glucose');

      await expect(submitGlucoseData({ value: 120 })).rejects.toThrow('Network error');
    });

    it('handles empty glucose data', async () => {
      mockZivaFetch.mockResolvedValue({
        success: true,
      });

      const { submitGlucoseData } = require('../glucose');
      await submitGlucoseData({});

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'POST',
        '/ziva.glucose',
        { userId: 'user123' }
      );
    });
  });

  describe('getGlucoseReports', () => {
    it('fetches reports with startDate and endDate', async () => {
      mockZivaFetch.mockResolvedValue({
        success: true,
        customFields: {
          glucoseResult: {
            success: [],
          },
        },
      });

      const { getGlucoseReports } = require('../glucose');
      await getGlucoseReports('2026-04-01', '2026-04-24');

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'GET',
        '/ziva.reports',
        undefined,
        expect.objectContaining({
          userId: 'user123',
          startDay: '2026-04-01',
          endDate: '2026-04-24',
          asc: '-1',
          sortBy: 'day',
        })
      );
    });

    it('uses empty string for endDate if not provided', async () => {
      mockZivaFetch.mockResolvedValue({
        success: true,
      });

      const { getGlucoseReports } = require('../glucose');
      await getGlucoseReports('2026-04-01');

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'GET',
        '/ziva.reports',
        undefined,
        expect.objectContaining({
          endDate: '',
        })
      );
    });

    it('returns report response with glucose data', async () => {
      const response = {
        success: true,
        customFields: {
          glucoseResult: {
            success: [
              { value: 120, date: '2026-04-24', time: '10:30' },
              { value: 95, date: '2026-04-23', time: '14:00' },
            ],
          },
        },
      };
      mockZivaFetch.mockResolvedValue(response);

      const { getGlucoseReports } = require('../glucose');
      const result = await getGlucoseReports('2026-04-01', '2026-04-24');

      expect(result).toEqual(response);
      expect(result.customFields?.glucoseResult?.success).toHaveLength(2);
    });

    it('returns report with empty glucose data', async () => {
      const response = {
        success: true,
        customFields: {
          glucoseResult: {
            success: [],
          },
        },
      };
      mockZivaFetch.mockResolvedValue(response);

      const { getGlucoseReports } = require('../glucose');
      const result = await getGlucoseReports('2026-04-01', '2026-04-24');

      expect(result.customFields?.glucoseResult?.success).toEqual([]);
    });

    it('throws on network error', async () => {
      mockZivaFetch.mockRejectedValue(new Error('Network failed'));

      const { getGlucoseReports } = require('../glucose');

      await expect(
        getGlucoseReports('2026-04-01', '2026-04-24')
      ).rejects.toThrow('Network failed');
    });

    it('handles missing userId gracefully', async () => {
      mockUseCollabStore.getState.mockReturnValue({ userId: null });
      mockZivaFetch.mockResolvedValue({ success: true });

      const { getGlucoseReports } = require('../glucose');
      await getGlucoseReports('2026-04-01');

      expect(mockZivaFetch).toHaveBeenCalledWith(
        'GET',
        '/ziva.reports',
        undefined,
        expect.objectContaining({
          userId: '',
        })
      );
    });
  });

  describe('registerZivaUser', () => {
    it('registers user with POST request', async () => {
      mockZivaFetch.mockResolvedValue({
        success: true,
      });

      const { registerZivaUser } = require('../glucose');
      await registerZivaUser();

      expect(mockZivaFetch).toHaveBeenCalledWith('POST', '/ziva.user', {});
    });

    it('returns success response on registration', async () => {
      const response = { success: true, data: { userId: 'user123' } };
      mockZivaFetch.mockResolvedValue(response);

      const { registerZivaUser } = require('../glucose');
      const result = await registerZivaUser();

      expect(result).toEqual(response);
    });

    it('returns error response on failed registration', async () => {
      const response = { success: false, error: 'User already registered' };
      mockZivaFetch.mockResolvedValue(response);

      const { registerZivaUser } = require('../glucose');
      const result = await registerZivaUser();

      expect(result).toEqual(response);
    });

    it('throws on network error during registration', async () => {
      mockZivaFetch.mockRejectedValue(new Error('Connection timeout'));

      const { registerZivaUser } = require('../glucose');

      await expect(registerZivaUser()).rejects.toThrow('Connection timeout');
    });
  });
});
