/**
 * useRingConnection
 * React hook wrapping the XState ringConnectionMachine
 */

import type { ConnectionContext, ConnectionStateValue, ScannedDevice } from '@/lib/bluetooth';

import { useMachine } from '@xstate/react';
import { useCallback, useMemo } from 'react';
import { ringConnectionMachine } from '@/lib/bluetooth';

export type UseRingConnectionReturn = {
  connectionState: ConnectionStateValue;
  isScanning: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  isDisconnecting: boolean;
  discoveredDevices: ScannedDevice[];
  deviceId: string | null;
  deviceName: string | null;
  error: string | null;
  startScan: () => void;
  stopScan: () => void;
  selectDevice: (device: ScannedDevice) => void;
  disconnect: () => void;
  retry: () => void;
  reset: () => void;
  sendConnectionLost: (error?: string) => void;
  context: ConnectionContext;
};

export function useRingConnection(): UseRingConnectionReturn {
  const [state, send] = useMachine(ringConnectionMachine);
  const connectionState = state.value as ConnectionStateValue;
  const isScanning = state.matches('scanning');
  const isConnecting = state.matches('connecting') || state.matches('retrying');
  const isConnected = state.matches('connected');
  const isDisconnecting = state.matches('disconnecting');

  const startScan = useCallback(() => send({ type: 'SCAN' }), [send]);
  const stopScan = useCallback(() => send({ type: 'STOP_SCAN' }), [send]);
  const selectDevice = useCallback(
    (device: ScannedDevice) =>
      send({
        type: 'SELECT_DEVICE',
        deviceId: device.id,
        deviceName: device.name ?? 'Unknown',
      }),
    [send],
  );
  const disconnect = useCallback(() => send({ type: 'DISCONNECT' }), [send]);
  const retry = useCallback(() => send({ type: 'RETRY' }), [send]);
  const reset = useCallback(() => send({ type: 'RESET' }), [send]);
  const sendConnectionLost = useCallback(
    (error?: string) => send({ type: 'CONNECTION_LOST', error }),
    [send],
  );

  const { discoveredDevices, deviceId, deviceName, error } = state.context;

  return useMemo(
    () => ({
      connectionState,
      isScanning,
      isConnecting,
      isConnected,
      isDisconnecting,
      discoveredDevices,
      deviceId,
      deviceName,
      error,
      startScan,
      stopScan,
      selectDevice,
      disconnect,
      retry,
      reset,
      sendConnectionLost,
      context: state.context,
    }),
    [
      connectionState,
      isScanning,
      isConnecting,
      isConnected,
      isDisconnecting,
      discoveredDevices,
      deviceId,
      deviceName,
      error,
      startScan,
      stopScan,
      selectDevice,
      disconnect,
      retry,
      reset,
      sendConnectionLost,
      state.context,
    ],
  );
}
