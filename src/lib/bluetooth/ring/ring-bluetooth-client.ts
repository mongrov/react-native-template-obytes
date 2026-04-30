import type { Device } from 'react-native-ble-plx';

import type { ScannedDevice } from '@/lib/bluetooth';
import {
  bleConnector,
  blePermissions,
  bleScanner,
  JStyleAdapter,
} from '@/lib/bluetooth';

export type RingClientState
  = | 'idle'
  | 'scanning'
  | 'connecting'
  | 'connected';

/**
 * RingBluetoothClient
 *
 * A small, reusable class wrapper around the existing BLE utilities:
 * - permissions (blePermissions)
 * - scan (bleScanner)
 * - connect/disconnect (bleConnector)
 * - protocol adapter (JStyleAdapter)
 *
 * Use it from any screen without needing XState hooks.
 */
export class RingBluetoothClient {
  public state: RingClientState = 'idle';
  public devices: ScannedDevice[] = [];
  public device: Device | null = null;
  public adapter: JStyleAdapter | null = null;

  async requestPermissions(): Promise<boolean> {
    const okBle = await blePermissions.requestBluetoothPermission();
    const okLoc = await blePermissions.requestLocationPermission();
    return okBle && okLoc;
  }

  async scan(timeoutMs: number = 8000): Promise<ScannedDevice[]> {
    this.state = 'scanning';
    this.devices = await bleScanner.startScan({ timeout: timeoutMs, filterZivaOnly: true });
    this.state = 'idle';
    return this.devices;
  }

  stopScan(): void {
    bleScanner.stopScan();
    if (this.state === 'scanning') this.state = 'idle';
  }

  async connect(deviceId: string): Promise<void> {
    this.state = 'connecting';
    const res = await bleConnector.connect(deviceId);
    this.device = res.device;
    this.state = 'connected';
  }

  async initAdapter(): Promise<void> {
    if (!this.device) throw new Error('No connected device');
    const a = new JStyleAdapter(this.device);
    await a.initialize();
    this.adapter = a;
  }

  async handshakeAndReadMeta(): Promise<{ battery: number; version: string }> {
    if (!this.adapter) throw new Error('Adapter not initialized');
    await this.adapter.handshake();
    const battery = await this.adapter.getBatteryLevel();
    const version = await this.adapter.getDeviceVersion();
    return { battery, version };
  }

  async disconnect(): Promise<void> {
    try {
      this.adapter?.cleanup();
    } finally {
      this.adapter = null;
      this.device = null;
      this.state = 'idle';
      await bleConnector.disconnect();
    }
  }
}
