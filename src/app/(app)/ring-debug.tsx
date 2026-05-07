/**
 * Ring Debug Screen
 * BLE connection, XState sync, and RxDB inspection for the BLE module
 */

import type {
  ActivityDataItem,
  ScannedDevice,
  SleepDataItem,
} from '@/lib/bluetooth';
import type { TimonDebugLog } from '@/lib/timon/hooks/use-timon-debug';

import { useCollab } from '@mongrov/collab';
import { Redirect } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  bleConnector,
  blePermissions,
  JStyleAdapter,
  ringManager,
} from '@/lib/bluetooth';
import { usePermissions } from '@/lib/bluetooth/hooks/use-permissions';
import { useRingConnection } from '@/lib/bluetooth/hooks/use-ring-connection';
import { useRingSync } from '@/lib/bluetooth/hooks/use-ring-sync';
import { useCollabMounted } from '@/lib/collab';

import { getChannelsList } from '@/lib/collab/groups';
import { useCollabSync } from '@/lib/collab/hooks/use-collab-sync';
import { useSocialLogin } from '@/lib/collab/hooks/use-social-login';
import { useWellnessGroups } from '@/lib/collab/hooks/use-wellness-groups';
import { useCollabStore } from '@/lib/collab/store';
import { useTimonDebug } from '@/lib/timon/hooks/use-timon-debug';

// ─── Sub-Components ─────────────────────────────────────────────────────────

function ConnectionStatusCard({
  connectionState,
  deviceName,
  batteryLevel,
  deviceVersion,
  connectionError,
}: {
  connectionState: string;
  deviceName: string | null;
  batteryLevel: number;
  deviceVersion: string;
  connectionError: string | null;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🔗 Connection Status</Text>
      <View style={styles.row}>
        <Text style={styles.label}>State:</Text>
        <Text
          style={[
            styles.value,
            connectionState === 'connected' && styles.successText,
          ]}
        >
          {connectionState.toUpperCase()}
        </Text>
      </View>
      {deviceName != null && (
        <View style={styles.row}>
          <Text style={styles.label}>Device:</Text>
          <Text style={styles.value}>{deviceName}</Text>
        </View>
      )}
      {batteryLevel > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Battery:</Text>
          <Text style={styles.value}>
            {batteryLevel}
            %
          </Text>
        </View>
      )}
      {deviceVersion.length > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Firmware:</Text>
          <Text style={styles.value}>{deviceVersion}</Text>
        </View>
      )}
      {connectionError != null && (
        <Text style={styles.errorText}>
          {'⚠ '}
          {connectionError}
        </Text>
      )}
    </View>
  );
}

function DiscoverySection({
  isScanning,
  handleScan,
  discoveredDevices,
  handleConnect,
}: {
  isScanning: boolean;
  handleScan: () => void;
  discoveredDevices: ScannedDevice[];
  handleConnect: (device: ScannedDevice) => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>📡 Device Discovery</Text>
      <TouchableOpacity
        style={[styles.button, isScanning && styles.buttonDisabled]}
        onPress={handleScan}
        disabled={isScanning}
      >
        <Text style={styles.buttonText}>
          {isScanning ? '⏳ Scanning...' : '🔍 Scan for Ring'}
        </Text>
      </TouchableOpacity>
      {discoveredDevices.length > 0 && (
        <View style={styles.deviceList}>
          {discoveredDevices.map((device) => (
            <TouchableOpacity
              key={device.id}
              style={styles.deviceItem}
              onPress={() => {
                handleConnect(device);
              }}
            >
              <Text style={styles.deviceName}>{device.name ?? 'Unknown'}</Text>
              <Text style={styles.deviceRssi}>
                {'RSSI: '}
                {device.rssi}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function SyncStatusCard({
  syncStatus,
  currentStage,
  completedStages,
  progress,
  lastSyncTime,
  syncError,
  isPersisting,
}: {
  syncStatus: string;
  currentStage: string;
  completedStages: string[];
  progress: number;
  lastSyncTime: Date | null;
  syncError: string | null;
  isPersisting: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🔄 XState Sync Machine</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Status:</Text>
        <Text
          style={[
            styles.value,
            syncStatus === 'success' && styles.successText,
            syncStatus === 'error' && styles.errorText,
          ]}
        >
          {syncStatus.toUpperCase()}
        </Text>
      </View>
      {currentStage !== 'idle' && (
        <View style={styles.row}>
          <Text style={styles.label}>Stage:</Text>
          <Text style={styles.value}>{currentStage}</Text>
        </View>
      )}
      {syncStatus === 'syncing' && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
          <Text style={styles.progressText}>
            {progress}
            %
          </Text>
        </View>
      )}
      {completedStages.length > 0 && (
        <View style={styles.tagContainer}>
          {completedStages.map((s, i) => (
            <View key={`${s}-${i}`} style={styles.tag}>
              <Text style={styles.tagText}>
                {'✓ '}
                {s}
              </Text>
            </View>
          ))}
        </View>
      )}
      {lastSyncTime != null && (
        <Text style={styles.hintText}>
          Last sync:
          {' '}
          {lastSyncTime.toLocaleTimeString()}
        </Text>
      )}
      {isPersisting && (
        <Text style={[styles.hintText, { color: '#7C3AED' }]}>
          💾 Persisting to RxDB...
        </Text>
      )}
      {syncError != null && (
        <Text style={styles.errorText}>
          {'⚠ '}
          {syncError}
        </Text>
      )}
    </View>
  );
}

function DataSummaryCard({
  sleepCount,
  activityCount,
  heartRateCount,
  hrvCount,
  spo2Count,
  temperatureCount,
}: {
  sleepCount: number;
  activityCount: number;
  heartRateCount: number;
  hrvCount: number;
  spo2Count: number;
  temperatureCount: number;
}) {
  const rows: [string, number][] = [
    ['🛏 Sleep', sleepCount],
    ['🏃 Activity', activityCount],
    ['❤️ Heart Rate', heartRateCount],
    ['🧠 HRV', hrvCount],
    ['🩸 SpO2', spo2Count],
    ['🌡 Temperature', temperatureCount],
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>📊 Synced Data Summary</Text>
      {rows.map(([label, count]) => (
        <View key={label} style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <View style={[styles.countBadge, count > 0 && styles.countBadgeActive]}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function DailyStepsCard({ activityData }: { activityData: ActivityDataItem[] }) {
  const dailySteps = React.useMemo(() => {
    const map = new Map<string, number>();
    activityData.forEach((item) => {
      const day = item.date.split(' ')[0];
      map.set(day, (map.get(day) ?? 0) + item.steps);
    });
    return Array.from(map.entries())
      .map(([date, steps]) => ({ date, steps }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [activityData]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🏃 Daily Steps</Text>
      {dailySteps.length === 0
        ? (
            <Text style={styles.hintText}>No activity data — run a sync first</Text>
          )
        : (
            dailySteps.map(({ date, steps }) => (
              <View key={date} style={styles.row}>
                <Text style={styles.label}>{date}</Text>
                <Text style={styles.valueBold}>
                  {steps.toLocaleString()}
                  {' steps'}
                </Text>
              </View>
            ))
          )}
    </View>
  );
}

function SleepRecordsCard({ sleepData }: { sleepData: SleepDataItem[] }) {
  const latest = React.useMemo(
    () =>
      [...sleepData]
        .sort((a, b) => b.startTime.localeCompare(a.startTime))
        .slice(0, 10),
    [sleepData],
  );

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🛏 Sleep Records</Text>
      {latest.length === 0
        ? (
            <Text style={styles.hintText}>No sleep data — run a sync first</Text>
          )
        : (
            latest.map((item, idx) => {
              const avg
                = item.sleepQuality.length > 0
                  ? Math.round(
                      item.sleepQuality.reduce((s, v) => s + v, 0) / item.sleepQuality.length,
                    )
                  : 0;
              return (
                <View key={`${item.startTime}-${idx}`} style={styles.sleepRow}>
                  <Text style={styles.valueBold}>{item.startTime}</Text>
                  <Text style={styles.hintText}>
                    {item.totalSleepTime}
                    ×
                    {item.unitLength}
                    {'min | Avg quality: '}
                    {avg}
                    {'% | '}
                    {item.sleepQuality.length}
                    {' intervals'}
                  </Text>
                </View>
              );
            })
          )}
    </View>
  );
}

function ActivityLogCard({ logs }: { logs: string[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>📋 Activity Log</Text>
      {logs.length === 0
        ? (
            <Text style={styles.hintText}>No log entries yet</Text>
          )
        : (
            <View style={styles.logBox}>
              {logs.slice(0, 30).map((entry, i) => (
                <Text
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  style={styles.logEntry}
                >
                  {entry}
                </Text>
              ))}
            </View>
          )}
    </View>
  );
}

type RingMeta = {
  batteryLevel?: number;
  deviceVersion?: string;
  macAddress?: string;
  lastSyncDate?: string;
};

function RxDBStatusCard({
  isDbReady,
  ringMeta,
  onRefresh,
}: {
  isDbReady: boolean;
  ringMeta: RingMeta | null;
  onRefresh: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🗄 RxDB Ring Metadata</Text>
      <View style={styles.row}>
        <Text style={styles.label}>DB Ready:</Text>
        <Text style={isDbReady ? styles.successText : styles.errorText}>
          {isDbReady ? '✅' : '❌'}
        </Text>
      </View>
      {ringMeta != null && (
        <>
          <View style={styles.row}>
            <Text style={styles.label}>Battery:</Text>
            <Text style={styles.value}>
              {ringMeta.batteryLevel ?? 'N/A'}
              {ringMeta.batteryLevel != null ? '%' : ''}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Firmware:</Text>
            <Text style={styles.value}>{ringMeta.deviceVersion ?? 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>MAC:</Text>
            <Text style={styles.value}>{ringMeta.macAddress ?? 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Last Sync:</Text>
            <Text style={styles.value}>{ringMeta.lastSyncDate ?? 'Never'}</Text>
          </View>
        </>
      )}
      <TouchableOpacity style={[styles.button, { marginTop: 8 }]} onPress={onRefresh}>
        <Text style={styles.buttonText}>🔄 Refresh RxDB</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Logic hooks ──────────────────────────────────────────────────────────────

function useActivityLog() {
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${ts}] ${msg}`, ...prev.slice(0, 99)]);
  }, []);
  return { logs, addLog };
}

function useRxDBStatus() {
  const [ringMeta, setRingMeta] = useState<RingMeta | null>(null);

  const refresh = useCallback(async () => {
    try {
      const doc = await ringManager.getRingDocument();
      if (doc != null) {
        setRingMeta({
          batteryLevel: doc.batteryLevel,
          deviceVersion: doc.deviceVersion,
          macAddress: doc.macAddress,
          lastSyncDate: doc.lastSyncDate,
        });
      }
    }
    catch (e) {
      console.warn('[RingDebug] RxDB refresh failed:', e);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { isDbReady: true, ringMeta, refresh };
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

function TimonDebugCard({
  isInitialized,
  isInitializing,
  initError,
  databases,
  tables,
  logs,
  isBusy,
  hasSyncData,
  syncDataSummary,
  onInitialize,
  onPersistSyncData,
  onQueryTable,
  onClearTable,
  onClearAll,
  onRefresh,
}: {
  isInitialized: boolean;
  isInitializing: boolean;
  initError: string | null;
  databases: string[];
  tables: string[];
  logs: TimonDebugLog[];
  isBusy: boolean;
  hasSyncData: boolean;
  syncDataSummary: string;
  onInitialize: () => void;
  onPersistSyncData: () => void;
  onQueryTable: (t: string) => void;
  onClearTable: (t: string) => void;
  onClearAll: () => void;
  onRefresh: () => void;
}) {
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🧪 Timon Engine Status</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Engine initialized:</Text>
        <Text style={isInitialized ? styles.successText : styles.errorText}>
          {isInitialized ? '✅' : '❌'}
        </Text>
      </View>

      {initError != null && (
        <Text style={styles.errorText}>
          Error:
          {initError}
        </Text>
      )}

      {!isInitialized && (
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, { marginTop: 12 }]}
          onPress={onInitialize}
          disabled={isInitializing}
        >
          <Text style={styles.buttonText}>
            {isInitializing ? 'Initializing...' : 'Initialize Timon'}
          </Text>
        </TouchableOpacity>
      )}

      {isInitialized && (
        <>
          <View style={[styles.row, { marginTop: 8 }]}>
            <Text style={styles.label}>Databases:</Text>
            <Text style={styles.value}>{databases.length > 0 ? databases.join(', ') : 'none'}</Text>
          </View>

          {tables.length > 0 && (
            <>
              <Text style={[styles.label, { marginTop: 8 }]}>Tables:</Text>
              <View style={styles.tagContainer}>
                {tables.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.tag,
                      expandedTable === t && { backgroundColor: '#7C3AED' },
                    ]}
                    onPress={() => {
                      setExpandedTable(expandedTable === t ? null : t);
                    }}
                  >
                    <Text style={styles.tagText}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {expandedTable != null && (
                <View style={[styles.buttonRow, { marginTop: 8 }]}>
                  <TouchableOpacity
                    style={[styles.smallButton, { backgroundColor: '#7C3AED' }]}
                    onPress={() => { onQueryTable(expandedTable); }}
                  >
                    <Text style={styles.smallButtonText}>Count</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallButton, styles.buttonDanger]}
                    onPress={() => { onClearTable(expandedTable); }}
                  >
                    <Text style={styles.smallButtonText}>🗑 Clear</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* Ring sync data → Timon */}
          <View style={{ marginTop: 12, padding: 12, backgroundColor: '#252525', borderRadius: 8 }}>
            <Text style={[styles.cardTitle, { marginBottom: 4 }]}>💍 Ring Sync → Timon</Text>
            <Text style={styles.hintText}>
              {hasSyncData
                ? syncDataSummary
                : 'No ring data synced yet. Sync your ring first using the buttons above.'}
            </Text>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                { marginTop: 12, marginBottom: 0 },
                (!hasSyncData || isBusy) && styles.buttonDisabled,
              ]}
              onPress={onPersistSyncData}
              disabled={!hasSyncData || isBusy}
            >
              <Text style={styles.buttonText}>
                {isBusy ? 'Persisting...' : '💾 Persist Ring Data to Timon'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.buttonRow, { marginTop: 12 }]}>
            <TouchableOpacity
              style={[styles.smallButton, { backgroundColor: '#2563EB' }]}
              onPress={onRefresh}
            >
              <Text style={styles.smallButtonText}>🔄 Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallButton, styles.buttonDanger]}
              onPress={onClearAll}
              disabled={isBusy}
            >
              <Text style={styles.smallButtonText}>⚠️ Clear All</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable log output */}
          {logs.length > 0 && (
            <View
              style={{
                marginTop: 12,
                maxHeight: 200,
                backgroundColor: '#0D0D0D',
                borderRadius: 8,
                padding: 8,
              }}
            >
              <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 'bold', marginBottom: 4 }}>
                Log Output:
              </Text>
              {logs.slice(0, 20).map((log) => (
                <Text
                  key={log.id}
                  style={{
                    fontSize: 11,
                    fontFamily: 'monospace',
                    marginBottom: 3,
                    lineHeight: 16,
                    color: log.success ? '#22C55E' : '#FF4444',
                  }}
                  numberOfLines={2}
                >
                  [
                  {log.action}
                  ]
                  {' '}
                  {log.message}
                </Text>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

// ─── Collab Debug Components ──────────────────────────────────────────────────

function CollabDebugCard() {
  const { userId, isAuthenticated } = useCollabStore();
  const { status } = useCollab();
  const { loginWithGoogle, loginWithApple, isLoading, error } = useSocialLogin();
  const collabSync = useCollabSync();

  const [pushRingStatus, setPushRingStatus] = React.useState<string | null>(null);
  const [fetchGlucoseStatus, setFetchGlucoseStatus] = React.useState<string | null>(null);
  const [registerStatus, setRegisterStatus] = React.useState<string | null>(null);
  const [appleStatus, setAppleStatus] = React.useState<string | null>(null);

  const notify = (opts: { title: string; ok: boolean; message?: string; details?: unknown }) => {
    if (opts.details !== undefined) {
      console.log(`[RingDebug] ${opts.title} details:`, opts.details);
    }
    showMessage({
      message: opts.title,
      description: opts.message ?? (opts.ok ? 'Success' : 'Failed'),
      type: 'default',
      duration: opts.ok ? 3500 : 6000,
      backgroundColor: opts.ok ? '#16A34A' : '#DC2626',
      color: '#FFFFFF',
    });
  };

  const handlePushRingInfo = async () => {
    setPushRingStatus('Pushing...');
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const result = await collabSync.pushRingInfo('debug-ring', tz);
    setPushRingStatus(result.success ? '✅ Success' : `❌ ${result.error}`);
    notify({
      title: 'Push Ring Info',
      ok: result.success,
      message: result.success ? `Saved ringId=debug-ring, timezone=${tz}` : result.error,
      details: result,
    });
  };

  const handleFetchGlucose = async () => {
    setFetchGlucoseStatus('Fetching...');
    const data = await collabSync.fetchGlucoseData();
    setFetchGlucoseStatus(`✅ ${data.length} records`);
    notify({
      title: 'Fetch Glucose Data',
      ok: true,
      message: `Fetched ${data.length} records`,
      details: data,
    });
  };

  const handleRegisterUser = async () => {
    setRegisterStatus('Registering...');
    const result = await collabSync.registerZivaUser();
    setRegisterStatus(result.success ? '✅ Registered' : `❌ ${result.error}`);
    notify({
      title: 'Register Ziva User',
      ok: result.success,
      message: result.success ? 'Registered on collab server' : result.error,
      details: result,
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>☁️ Collab Debug</Text>

      <View style={styles.row}>
        <Text style={styles.label}>DDP Status:</Text>
        <Text style={[styles.value, status === 'connected' && styles.successText]}>
          {status.toUpperCase()}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Auth:</Text>
        <Text style={isAuthenticated ? styles.successText : styles.errorText}>
          {isAuthenticated ? `✅ ${userId}` : '❌ Not logged in'}
        </Text>
      </View>

      {error != null && (
        <Text style={styles.errorText}>
          {'⚠ '}
          {error}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, styles.buttonPrimary, { marginTop: 8 }, isLoading && styles.buttonDisabled]}
        onPress={() => {
          void loginWithGoogle().then((success) => {
            notify({
              title: 'Login to Collab (Google)',
              ok: success,
              message: success ? 'Logged in successfully' : 'Cancelled or failed',
            });
          });
        }}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? '⏳ Logging in...' : '🔑 Login to Collab (Google)'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: '#000000' },
          (isLoading || Platform.OS !== 'ios') && styles.buttonDisabled,
        ]}
        onPress={() => {
          setAppleStatus('Logging in...');
          void loginWithApple().then((success) => {
            setAppleStatus(success ? '✅ Apple login success' : '❌ Cancelled or failed');
            notify({
              title: 'Apple Sign In',
              ok: success,
              message: success ? 'Logged in successfully' : 'Cancelled or failed',
            });
          });
        }}
        disabled={isLoading || Platform.OS !== 'ios'}
      >
        <Text style={styles.buttonText}> Apple Sign In (iOS only)</Text>
      </TouchableOpacity>
      {appleStatus != null && <Text style={styles.hintText}>{appleStatus}</Text>}

      <TouchableOpacity
        style={[styles.button, !isAuthenticated && styles.buttonDisabled]}
        onPress={() => { void handlePushRingInfo(); }}
        disabled={!isAuthenticated}
      >
        <Text style={styles.buttonText}>💍 Push Ring Info</Text>
      </TouchableOpacity>
      {pushRingStatus != null && <Text style={styles.hintText}>{pushRingStatus}</Text>}

      <TouchableOpacity
        style={[styles.button, !isAuthenticated && styles.buttonDisabled]}
        onPress={() => { void handleFetchGlucose(); }}
        disabled={!isAuthenticated}
      >
        <Text style={styles.buttonText}>🩸 Fetch Glucose Data</Text>
      </TouchableOpacity>
      {fetchGlucoseStatus != null && <Text style={styles.hintText}>{fetchGlucoseStatus}</Text>}

      <TouchableOpacity
        style={[styles.button, !isAuthenticated && styles.buttonDisabled]}
        onPress={() => { void handleRegisterUser(); }}
        disabled={!isAuthenticated}
      >
        <Text style={styles.buttonText}>👤 Register Ziva User</Text>
      </TouchableOpacity>
      {registerStatus != null && <Text style={styles.hintText}>{registerStatus}</Text>}
    </View>
  );
}

function WellnessGroupsDebugCard() {
  const { isAuthenticated } = useCollabStore();
  const groups = useWellnessGroups();

  const [statusMsg, setStatusMsg] = React.useState<string | null>(null);
  const [isBusy, setIsBusy] = React.useState(false);

  const isApiErrorPayload = (result: unknown): result is {
    success?: boolean;
    error?: string;
    errorType?: string;
    details?: unknown;
    message?: string;
  } => {
    return typeof result === 'object' && result !== null && 'success' in result;
  };

  const run = async (action: () => Promise<unknown>, label: string) => {
    setIsBusy(true);
    setStatusMsg(`${label}...`);
    try {
      const result = await action();
      if (isApiErrorPayload(result) && result.success === false) {
        const errorMessage = result.error ?? result.message ?? 'Request failed';
        throw new Error(errorMessage);
      }
      setStatusMsg(`✅ ${label}: ${JSON.stringify(result).slice(0, 120)}`);
      console.log(`[RingDebug] Wellness Groups ${label} result:`, result);
      showMessage({
        message: `Wellness Groups: ${label}`,
        description: 'Success',
        type: 'default',
        duration: 3500,
        backgroundColor: '#16A34A',
        color: '#FFFFFF',
      });
    }
    catch (err) {
      setStatusMsg(`❌ ${label}: ${err instanceof Error ? err.message : String(err)}`);
      console.warn(`[RingDebug] Wellness Groups ${label} error:`, err);
      showMessage({
        message: `Wellness Groups: ${label}`,
        description: err instanceof Error ? err.message : String(err),
        type: 'default',
        duration: 6000,
        backgroundColor: '#DC2626',
        color: '#FFFFFF',
      });
    }
    finally {
      setIsBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>👥 Wellness Groups</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.smallButton, (!isAuthenticated || isBusy) && styles.buttonDisabled]}
          onPress={() => { void run(() => getChannelsList({}), 'List Joined Channels'); }}
          disabled={!isAuthenticated || isBusy}
        >
          <Text style={styles.smallButtonText}>📋 List</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.smallButton, (!isAuthenticated || isBusy) && styles.buttonDisabled]}
          onPress={() => {
            Alert.prompt('Create Group', 'Enter group name:', (name) => {
              if (name)
                void run(() => groups.createGroup({ name }), 'Create');
            });
          }}
          disabled={!isAuthenticated || isBusy}
        >
          <Text style={styles.smallButtonText}>➕ Create</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.smallButton, (!isAuthenticated || isBusy) && styles.buttonDisabled]}
          onPress={() => {
            Alert.prompt('Join Group', 'Enter room ID:', (roomId) => {
              if (roomId)
                void run(() => groups.joinGroup({ roomId }), 'Join');
            });
          }}
          disabled={!isAuthenticated || isBusy}
        >
          <Text style={styles.smallButtonText}>🚪 Join</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.smallButton, (!isAuthenticated || isBusy) && styles.buttonDisabled]}
          onPress={() => {
            Alert.prompt('Members', 'Enter room ID:', (roomId) => {
              if (roomId)
                void run(() => groups.getGroupMembers(roomId), 'Members');
            });
          }}
          disabled={!isAuthenticated || isBusy}
        >
          <Text style={styles.smallButtonText}>👤 Members</Text>
        </TouchableOpacity>
      </View>

      {statusMsg != null && (
        <View style={[styles.logBox, { marginTop: 8 }]}>
          <Text style={styles.logEntry} numberOfLines={5}>{statusMsg}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RingDebugScreen() {
  const {
    bleStatus,
    locationStatus,
    isBluetoothEnabled,
    loading: permissionsLoading,
  } = usePermissions();

  const conn = useRingConnection();
  const sync = useRingSync();
  const timonDebug = useTimonDebug();
  const { logs, addLog } = useActivityLog();
  const rxdb = useRxDBStatus();
  const collabMounted = useCollabMounted();
  const collabStore = useCollabStore();
  const collabSync = useCollabSync();
  const [adapter, setAdapter] = useState<JStyleAdapter | null>(null);

  const syncStatus = sync.isSuccess
    ? 'success'
    : sync.isError
      ? 'error'
      : sync.isSyncing
        ? 'syncing'
        : 'idle';

  const isConnected = conn.connectionState === 'connected';

  // Cleanup adapter on unmount
  useEffect(() => {
    return () => {
      if (adapter != null) {
        adapter.cleanup();
      }
    };
  }, [adapter]);

  // Initialize adapter when connected
  useEffect(() => {
    if (!isConnected || adapter != null) return;

    const init = async () => {
      try {
        const device = bleConnector.getConnectedDevice();
        if (device == null) {
          addLog('⚠ Connected state but no device in connector');
          return;
        }
        addLog(`📱 Initializing adapter for ${device.id}`);
        const newAdapter = new JStyleAdapter(device);
        await newAdapter.initialize();
        setAdapter(newAdapter);

        addLog('🤝 Handshaking...');
        await newAdapter.handshake();
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 500);
        });

        const battery = await newAdapter.getBatteryLevel();
        const version = await newAdapter.getDeviceVersion();
        addLog(`🔋 Battery: ${battery}% | Firmware: ${version}`);

        await ringManager.initRingDocument();
        await ringManager.setBatteryLevel(battery);
        await ringManager.setDeviceVersion(version);
        if (device.id)
          await ringManager.setMacAddress(device.id);
        addLog('💾 Persisted device info to RxDB');
        rxdb.refresh();
      }
      catch (err) {
        addLog(`❌ Adapter init failed: ${String(err)}`);
        conn.sendConnectionLost(String(err));
      }
    };

    void init();
  }, [isConnected, adapter, addLog, conn, rxdb]);

  // Reset sync on unexpected disconnect
  useEffect(() => {
    if (!isConnected && syncStatus !== 'idle') {
      sync.reset();
      addLog('🔌 Disconnected — sync reset');
    }
  }, [isConnected, syncStatus, sync, addLog]);

  // Log stage changes
  const prevStageRef = useRef(sync.currentStage);
  useEffect(() => {
    if (sync.currentStage !== prevStageRef.current) {
      addLog(`⚙ Stage: ${prevStageRef.current} → ${sync.currentStage}`);
      prevStageRef.current = sync.currentStage;
    }
  }, [sync.currentStage, addLog]);

  // Log sync success
  useEffect(() => {
    if (sync.isSuccess) {
      addLog(
        `✅ Sync complete | HR:${sync.heartRateData.length} Sleep:${sync.sleepData.length} `
        + `Activity:${sync.activityData.length} HRV:${sync.hrvData.length} `
        + `SpO2:${sync.spo2Data.length} Temp:${sync.temperatureData.length}`,
      );
      rxdb.refresh();
      if (collabStore.isAuthenticated) {
        const ringId = rxdb.ringMeta?.macAddress ?? 'unknown';
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        collabSync.pushRingInfo(ringId, timezone).catch(console.error);
      }
    }
  }, [sync.isSuccess, sync.heartRateData, sync.sleepData, sync.activityData, sync.hrvData, sync.spo2Data, sync.temperatureData, addLog, rxdb, collabStore, collabSync]);

  // Actions
  const handleScan = useCallback(async () => {
    addLog('🔑 Requesting Bluetooth permission...');
    const granted = await blePermissions.requestBluetoothPermission();
    if (!granted) {
      addLog('❌ Bluetooth permission denied');
      return;
    }
    addLog('🔍 Starting scan...');
    conn.startScan();
  }, [conn, addLog]);

  const handleConnect = useCallback(
    (device: ScannedDevice) => {
      addLog(`🔗 Connecting to ${device.name ?? device.id}...`);
      conn.selectDevice(device);
    },
    [conn, addLog],
  );

  const handleDisconnect = useCallback(async () => {
    if (adapter != null) {
      await adapter.abortSync();
      adapter.cleanup();
    }
    conn.disconnect();
    setAdapter(null);
    sync.reset();
    addLog('🔌 Disconnected');
  }, [adapter, conn, sync, addLog]);

  const handleSyncAll = useCallback(() => {
    if (adapter == null) {
      Alert.alert('Error', 'Not connected to a device');
      return;
    }
    addLog('🔄 Starting full sync...');
    sync.startSync(adapter);
  }, [adapter, sync, addLog]);

  const handleSyncSleep = useCallback(async () => {
    if (adapter == null)
      return;
    addLog('🛏 Syncing sleep...');
    const res = await adapter.syncSleepData();
    addLog(
      res.success
        ? `✅ Sleep: ${res.data.length} records`
        : `❌ Sleep failed: ${res.error}`,
    );
  }, [adapter, addLog]);

  const handleSyncActivity = useCallback(async () => {
    if (adapter == null)
      return;
    addLog('🏃 Syncing activity...');
    const res = await adapter.syncActivityData();
    addLog(
      res.success
        ? `✅ Activity: ${res.data.length} records`
        : `❌ Activity failed: ${res.error}`,
    );
  }, [adapter, addLog]);

  const handleSyncHR = useCallback(async () => {
    if (adapter == null)
      return;
    addLog('❤️ Syncing heart rate...');
    const res = await adapter.syncHeartRateData();
    addLog(
      res.success
        ? `✅ HR: ${res.data.length} records`
        : `❌ HR failed: ${res.error}`,
    );
  }, [adapter, addLog]);

  if (!permissionsLoading && (bleStatus !== 'granted' || locationStatus !== 'granted' || !isBluetoothEnabled)) {
    return (
      <Redirect
        href={{ pathname: '/permissions' as any, params: { returnTo: 'ring-debug' } }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>💍 Ring Debug</Text>
        <Text style={styles.subtitle}>BLE · XState · RxDB</Text>

        {/* ── Connection ── */}
        <ConnectionStatusCard
          connectionState={conn.connectionState}
          deviceName={conn.deviceName}
          batteryLevel={sync.batteryLevel}
          deviceVersion={sync.deviceVersion}
          connectionError={conn.error}
        />

        {!isConnected && (
          <DiscoverySection
            isScanning={conn.isScanning}
            handleScan={handleScan}
            discoveredDevices={conn.discoveredDevices}
            handleConnect={handleConnect}
          />
        )}

        {isConnected && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.buttonDanger]}
              onPress={() => {
                void handleDisconnect();
              }}
            >
              <Text style={styles.buttonText}>🔌 Disconnect</Text>
            </TouchableOpacity>

            <Text style={styles.sectionHeader}>Sync</Text>

            <SyncStatusCard
              syncStatus={syncStatus}
              currentStage={sync.currentStage}
              completedStages={sync.completedStages}
              progress={sync.progress}
              lastSyncTime={sync.lastSyncTime}
              syncError={sync.error}
              isPersisting={sync.isPersisting}
            />

            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                syncStatus === 'syncing' && styles.buttonDisabled,
              ]}
              onPress={handleSyncAll}
              disabled={syncStatus === 'syncing'}
            >
              <Text style={styles.buttonText}>
                {syncStatus === 'syncing' ? '⏳ Syncing...' : '🔄 Sync All Data'}
              </Text>
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Individual Sync (Debug)</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => {
                    void handleSyncSleep();
                  }}
                >
                  <Text style={styles.smallButtonText}>🛏 Sleep</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => {
                    void handleSyncActivity();
                  }}
                >
                  <Text style={styles.smallButtonText}>🏃 Activity</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => {
                    void handleSyncHR();
                  }}
                >
                  <Text style={styles.smallButtonText}>❤️ HR</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.sectionHeader}>Synced Data</Text>

            <DataSummaryCard
              sleepCount={sync.sleepData.length}
              activityCount={sync.activityData.length}
              heartRateCount={sync.heartRateData.length}
              hrvCount={sync.hrvData.length}
              spo2Count={sync.spo2Data.length}
              temperatureCount={sync.temperatureData.length}
            />
            <DailyStepsCard activityData={sync.activityData} />
            <SleepRecordsCard sleepData={sync.sleepData} />
          </>
        )}

        <Text style={styles.sectionHeader}>🗄 RxDB Debug</Text>

        <RxDBStatusCard
          isDbReady={rxdb.isDbReady}
          ringMeta={rxdb.ringMeta}
          onRefresh={rxdb.refresh}
        />

        <Text style={styles.sectionHeader}>🧪 Timon Debug</Text>

        <TimonDebugCard
          isInitialized={timonDebug.isInitialized}
          isInitializing={timonDebug.isInitializing}
          initError={timonDebug.initError}
          databases={timonDebug.databases}
          tables={timonDebug.tables}
          logs={timonDebug.logs}
          isBusy={timonDebug.isBusy}
          hasSyncData={
            sync.sleepData.length > 0
            || sync.activityData.length > 0
            || sync.heartRateData.length > 0
            || sync.hrvData.length > 0
            || sync.spo2Data.length > 0
            || sync.temperatureData.length > 0
          }
          syncDataSummary={`Sleep: ${sync.sleepData.length}, Activity: ${sync.activityData.length}, HR: ${sync.heartRateData.length}`}
          onInitialize={timonDebug.initializeTimon}
          onPersistSyncData={() => {
            timonDebug.persistSyncDataToTimon({
              sleepData: sync.sleepData,
              activityData: sync.activityData,
              heartRateData: sync.heartRateData,
              hrvData: sync.hrvData,
              spo2Data: sync.spo2Data,
              temperatureData: sync.temperatureData,
            });
          }}
          onQueryTable={timonDebug.queryTable}
          onClearTable={timonDebug.clearTable}
          onClearAll={timonDebug.clearAllTables}
          onRefresh={timonDebug.refreshLists}
        />

        <Text style={styles.sectionHeader}>☁️ Collab Debug</Text>

        {collabMounted && <CollabDebugCard />}

        <Text style={styles.sectionHeader}>👥 Wellness Groups</Text>

        <WellnessGroupsDebugCard />

        <Text style={styles.sectionHeader}>📋 Activity Log</Text>

        <ActivityLogCard logs={logs} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888888', marginBottom: 24 },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 12,
  },
  card: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: { fontSize: 13, color: '#888888' },
  value: { fontSize: 13, color: '#CCCCCC', flexShrink: 1, textAlign: 'right' },
  valueBold: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
  successText: { color: '#22C55E', fontSize: 13 },
  errorText: { color: '#EF4444', fontSize: 13, marginTop: 4 },
  hintText: { fontSize: 12, color: '#666666', fontStyle: 'italic', marginTop: 4 },
  button: {
    backgroundColor: '#333333',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonPrimary: { backgroundColor: '#7C3AED' },
  buttonDanger: { backgroundColor: '#DC2626' },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 8 },
  smallButton: {
    flex: 1,
    backgroundColor: '#252525',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  smallButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '500' },
  deviceList: { marginTop: 8, gap: 6 },
  deviceItem: {
    backgroundColor: '#252525',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceName: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  deviceRssi: { color: '#666666', fontSize: 12 },
  progressContainer: {
    height: 20,
    backgroundColor: '#2D2D2D',
    borderRadius: 10,
    marginVertical: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: { height: '100%', backgroundColor: '#7C3AED' },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  tag: {
    backgroundColor: '#2D2D2D',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { fontSize: 11, color: '#22C55E' },
  countBadge: {
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    minWidth: 32,
    alignItems: 'center',
  },
  countBadgeActive: { backgroundColor: '#7C3AED' },
  countText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  sleepRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#252525' },
  logBox: { backgroundColor: '#0D0D0D', borderRadius: 8, padding: 8 },
  logEntry: {
    fontSize: 11,
    color: '#888888',
    fontFamily: 'monospace',
    marginBottom: 3,
    lineHeight: 16,
  },
});
