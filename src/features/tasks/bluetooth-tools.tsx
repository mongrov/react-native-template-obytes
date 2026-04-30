import { useRouter } from 'expo-router';
import * as React from 'react';
import { ScrollView, StatusBar, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { FocusAwareStatusBar, Text, View } from '@/components/ui';
import type { ScannedDevice } from '@/lib/bluetooth';
import { useColorScheme, useTheme } from '@/lib/theme';
import { RingBluetoothClient } from '@/lib/bluetooth/ring/ring-bluetooth-client';

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bgPrimary },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderSubtle,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.colors.bgTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: { fontFamily: theme.fonts.displayBold, fontSize: 18, color: theme.colors.textPrimary },
    subtitle: { fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
    content: { paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
    buttonRow: { flexDirection: 'row', gap: 10 },
    button: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.borderDefault,
      backgroundColor: theme.colors.bgPrimary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: { fontFamily: theme.fonts.bodyBold, fontSize: 13, color: theme.colors.textPrimary },
    card: {
      borderWidth: 1,
      borderColor: theme.colors.borderDefault,
      borderRadius: 12,
      padding: 12,
      backgroundColor: theme.colors.bgPrimary,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.textSecondary },
    value: { fontFamily: theme.fonts.bodyBold, fontSize: 12, color: theme.colors.textPrimary, flexShrink: 1, textAlign: 'right' },
    deviceItem: {
      borderWidth: 1,
      borderColor: theme.colors.borderDefault,
      borderRadius: 12,
      padding: 12,
      backgroundColor: theme.colors.bgPrimary,
      marginTop: 10,
    },
    deviceName: { fontFamily: theme.fonts.bodyBold, fontSize: 14, color: theme.colors.textPrimary },
    deviceMeta: { marginTop: 4, fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.textSecondary },
  });
}

export function BluetoothToolsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isDark } = useColorScheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const clientRef = React.useRef<RingBluetoothClient | null>(null);
  if (!clientRef.current) clientRef.current = new RingBluetoothClient();
  const client = clientRef.current;

  const [busy, setBusy] = React.useState(false);
  const [devices, setDevices] = React.useState<ScannedDevice[]>([]);
  const [selected, setSelected] = React.useState<ScannedDevice | null>(null);
  const [battery, setBattery] = React.useState<number | null>(null);
  const [version, setVersion] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onPermissions = () => run(async () => {
    const ok = await client.requestPermissions();
    if (!ok) throw new Error('Permissions not granted');
  });

  const onScan = () => run(async () => {
    const list = await client.scan(8000);
    setDevices(list);
  });

  const onConnect = (d: ScannedDevice) => run(async () => {
    setSelected(d);
    await client.connect(d.id);
    await client.initAdapter();
    const meta = await client.handshakeAndReadMeta();
    setBattery(meta.battery);
    setVersion(meta.version);
  });

  const onDisconnect = () => run(async () => {
    await client.disconnect();
    setSelected(null);
    setBattery(null);
    setVersion('');
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <FocusAwareStatusBar />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path
                d="M6 7l12 10M6 17l12-10"
                stroke={theme.colors.textTertiary}
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.title} numberOfLines={1}>Bluetooth tools</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {busy ? 'Working…' : selected ? `Connected: ${selected.name ?? selected.id}` : 'Scan and connect'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} activeOpacity={0.7} onPress={onPermissions} disabled={busy}>
            <Text style={styles.buttonText}>Permissions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} activeOpacity={0.7} onPress={onScan} disabled={busy}>
            <Text style={styles.buttonText}>Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} activeOpacity={0.7} onPress={onDisconnect} disabled={busy}>
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Battery</Text>
            <Text style={styles.value}>{battery == null ? '—' : `${battery}%`}</Text>
          </View>
          <View style={[styles.row, { marginTop: 8 }]}>
            <Text style={styles.label}>Firmware</Text>
            <Text style={styles.value}>{version || '—'}</Text>
          </View>
          {error ? (
            <Text style={[styles.label, { marginTop: 10, color: theme.colors.critical }]}>
              {error}
            </Text>
          ) : null}
        </View>

        {devices.map(d => (
          <TouchableOpacity
            key={d.id}
            style={styles.deviceItem}
            activeOpacity={0.7}
            onPress={() => onConnect(d)}
            disabled={busy}
          >
            <Text style={styles.deviceName}>{d.name ?? 'Unknown'}</Text>
            <Text style={styles.deviceMeta}>
              {d.id}
              {d.rssi != null ? ` • RSSI ${d.rssi}` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
