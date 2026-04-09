import { act } from '@testing-library/react-native';

// Mock ble-manager module
jest.mock('../ble-manager', () => ({
  getBleManager: jest.fn(),
  isPhysicalDevice: true,
}));

describe('BleScanner', () => {
  let mockBleManager: any;
  let scanner: any;
  let bleManagerModule: any;

  beforeEach(() => {
    jest.clearAllMocks();
    bleManagerModule = require('../ble-manager');

    mockBleManager = {
      startDeviceScan: jest.fn(),
      stopDeviceScan: jest.fn(),
    };
    (bleManagerModule.getBleManager as jest.Mock).mockReturnValue(
      mockBleManager
    );
    bleManagerModule.isPhysicalDevice = true;

    // Isolate scanner
    jest.isolateModules(() => {
      scanner = require('../ble-scanner').bleScanner;
    });
  });

  afterEach(() => {
    scanner.stopScan();
    jest.useRealTimers();
  });

  describe('startScan', () => {
    it('successfully starts and completes a scan with timeout', async () => {
      jest.useFakeTimers();

      const scanPromise = scanner.startScan({ timeout: 1000 });

      expect(mockBleManager.startDeviceScan).toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(1100);
      });

      const devices = await scanPromise;
      expect(devices).toEqual([]);
      expect(mockBleManager.stopDeviceScan).toHaveBeenCalled();
    });

    it('returns empty array on simulator', async () => {
      bleManagerModule.isPhysicalDevice = false;
      const devices = await scanner.startScan();
      expect(devices).toEqual([]);
    });

    it('handles scan errors', async () => {
      mockBleManager.startDeviceScan.mockImplementation(
        (uuids: any, options: any, callback: any) => {
          callback(new Error('Scan failed'), null);
        }
      );

      const devices = await scanner.startScan();
      expect(devices).toEqual([]);
    });

    it('handles manual stop', async () => {
      jest.useFakeTimers();
      scanner.startScan();
      scanner.stopScan();

      expect(mockBleManager.stopDeviceScan).toHaveBeenCalled();
      // Ensure timer is cleared or advanced to avoid open handles
      jest.runAllTimers();
    });
  });

  describe('getDiscoveredDevices', () => {
    it('returns unique devices', () => {
      mockBleManager.startDeviceScan.mockImplementation(
        (uuids: any, options: any, callback: any) => {
          callback(null, { id: '1', name: 'ZR100', rssi: -60 });
        }
      );

      scanner.startScan();
      expect(scanner.getDiscoveredDevices().length).toBe(1);
      scanner.stopScan();
    });
  });
});
