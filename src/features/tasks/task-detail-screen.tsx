import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import {
  LayoutAnimation,
  Platform,
  StatusBar,
  StyleSheet,
  TextInput,
  UIManager,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
} from 'react-native-svg';

import {
  FocusAwareStatusBar,
  Image,
  Text,
  TouchableOpacity,
  View,
} from '@/components/ui';
import { getTaskDetail } from '@/features/tasks/data/mock-tasks';
import { useColorScheme, useTheme } from '@/lib/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TabKey = 'details' | 'resources' | 'history';

function createDetailStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.gray50,
      alignSelf: 'center',
      width: '100%',
    },
    header: {
      backgroundColor: theme.colors.bgPrimary,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderDefault,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.colors.gray100,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    headerTitleContainer: {
      flex: 1,
      minWidth: 0,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: theme.fonts.displayBold,
      color: theme.colors.textPrimary,
      letterSpacing: -0.02,
      lineHeight: 26,
    },
    headerSubtitle: {
      fontSize: 15,
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.gray400,
      marginTop: 2,
      letterSpacing: 0.02,
    },
    menuButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.colors.gray100,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 16,
    },
    menuIcon: {
      width: 26,
      height: 26,
    },
    syncIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
    },
    syncDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    syncText: {
      fontSize: 14,
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.gray400,
    },
    statusSection: {
      backgroundColor: theme.colors.primary50,
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.primary200,
    },
    statusTopLine: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: theme.colors.primary500,
      opacity: 0.5,
    },
    statusContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusIcon: {
      width: 52,
      height: 52,
      borderRadius: 14,
      backgroundColor: theme.colors.primary500,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    statusTextContainer: {
      flex: 1,
      minWidth: 0,
    },
    statusLabel: {
      fontSize: 16,
      fontFamily: theme.fonts.displayBold,
      color: theme.colors.primary700,
      textTransform: 'uppercase',
      letterSpacing: 0.08,
      marginBottom: 4,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    statusTitle: {
      fontSize: 20,
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.textPrimary,
      letterSpacing: -0.02,
      marginRight: 8,
    },
    priorityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 9,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: theme.colors.criticalBg,
    },
    priorityText: {
      fontSize: 13,
      fontFamily: theme.fonts.bodySemiBold,
      color: theme.colors.critical,
      textTransform: 'uppercase',
      letterSpacing: 0.05,
    },
    statusTime: {
      fontSize: 16,
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    statusCompletion: {
      fontSize: 16,
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.primary600,
    },
    locationSection: {
      backgroundColor: theme.colors.bgPrimary,
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderDefault,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionHeaderText: {
      fontSize: 15,
      fontFamily: theme.fonts.displayBold,
      color: theme.colors.gray600,
      textTransform: 'uppercase',
      letterSpacing: 0.08,
    },
    locationText: {
      fontSize: 17,
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.textPrimary,
      lineHeight: 26,
      marginBottom: 12,
    },
    mapPreview: {
      width: '100%',
      height: 120,
      borderRadius: 12,
      backgroundColor: theme.colors.gray100,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.gray300,
      position: 'relative',
      overflow: 'hidden',
    },
    mapContent: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.primary50,
    },
    mapButton: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    mapButtonText: {
      fontSize: 14,
      fontFamily: theme.fonts.bodySemiBold,
      color: theme.colors.primary600,
    },
    actionButtonsRow: {
      flexDirection: 'row',
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 40,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.gray300,
      backgroundColor: theme.colors.gray50,
      marginRight: 8,
    },
    actionButtonText: {
      fontSize: 16,
      fontFamily: theme.fonts.bodySemiBold,
      color: theme.colors.textPrimary,
      marginLeft: 8,
    },
    description: {
      backgroundColor: theme.colors.bgPrimary,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderDefault,
      marginBottom: 10,
    },
    descriptionText: {
      fontSize: 17,
      fontFamily: theme.fonts.body,
      color: theme.colors.textSecondary,
      lineHeight: 26,
      letterSpacing: -0.01,
    },
    tabsContainer: {
      backgroundColor: theme.colors.bgPrimary,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.gray300,
    },
    tabsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      position: 'relative',
    },
    tab: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 20,
      position: 'relative',
    },
    tabText: {
      fontSize: 16,
      fontFamily: theme.fonts.display,
      textAlign: 'center',
    },
    tabTextActive: {
      color: theme.colors.primary600,
      fontFamily: theme.fonts.bodyMedium,
    },
    tabTextInactive: {
      color: theme.colors.gray400,
      fontFamily: theme.fonts.bodyMedium,
    },
    tabIndicator: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: theme.colors.primary500,
    },
    tabPill: {
      position: 'absolute',
      bottom: -6,
      left: '50%',
      marginLeft: -16,
      width: 32,
      height: 6,
      backgroundColor: theme.colors.primary500,
      borderRadius: 3,
    },
    tabIndicatorInactive: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: theme.colors.gray300,
    },
    tabContent: {
      backgroundColor: theme.colors.bgPrimary,
      paddingHorizontal: 20,
      paddingVertical: 20,
      marginTop: -1,
    },
    customerSection: {
      marginBottom: 3,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 3,
      marginTop: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: theme.fonts.displayBold,
    },
    customerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.colors.gray50,
      borderWidth: 1,
      borderColor: theme.colors.gray200,
      borderRadius: 12,
      marginBottom: 10,
    },
    customerAvatar: {
      width: 52,
      height: 52,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    customerInfo: {
      flex: 1,
      minWidth: 0,
    },
    customerName: {
      fontSize: 20,
      fontFamily: theme.fonts.displayMedium,
      color: theme.colors.textPrimary,
      marginBottom: 4,
      marginLeft: 12,
      marginRight: 10,
    },
    customerContact: {
      fontSize: 16,
      fontFamily: theme.fonts.body,
      color: theme.colors.gray500,
      marginLeft: 12,
    },
    customerActions: {
      flexDirection: 'row',
      flexShrink: 0,
    },
    customerActionButton: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: theme.colors.bgPrimary,
      borderWidth: 1,
      borderColor: theme.colors.gray200,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoItem: {},
    infoLabel: {
      fontSize: 16,
      fontFamily: theme.fonts.displayBold,
      color: theme.colors.gray500,
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 16,
      fontFamily: theme.fonts.bodySemiBold,
      color: theme.colors.textPrimary,
    },
    equipmentSection: {
      marginBottom: 24,
    },
    equipmentList: {
      marginTop: 8,
    },
    equipmentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      backgroundColor: theme.colors.gray50,
      borderWidth: 1,
      borderColor: theme.colors.gray200,
      borderRadius: 10,
      marginBottom: 12,
    },
    equipmentIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: theme.colors.primary50,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    equipmentName: {
      fontSize: 16,
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.textPrimary,
      flex: 1,
    },
    scheduleGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 8,
    },
    scheduleCard: {
      flex: 1,
      minWidth: '46%',
      padding: 16,
      backgroundColor: theme.colors.gray50,
      borderWidth: 1,
      borderColor: theme.colors.gray300,
      borderRadius: 12,
    },
    scheduleLabel: {
      fontSize: 13,
      fontFamily: theme.fonts.displayBold,
      color: theme.colors.gray600,
      textTransform: 'uppercase',
      letterSpacing: 0.05,
      marginBottom: 8,
    },
    scheduleValue: {
      fontSize: 20,
      fontFamily: theme.fonts.displayBold,
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    scheduleSubtext: {
      fontSize: 16,
      fontFamily: theme.fonts.body,
      color: theme.colors.gray400,
    },
    historyList: {
      marginBottom: -5,
      paddingTop: 4,
    },
    historyItem: {
      flexDirection: 'row',
      position: 'relative',
      marginBottom: 10,
    },
    historyTimeline: {
      alignItems: 'center',
      position: 'relative',
      width: 12,
      marginRight: 12,
      paddingTop: 2,
    },
    historyDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.primary500,
      borderWidth: 2,
      borderColor: theme.colors.bgPrimary,
      zIndex: 10,
    },
    historyLine: {
      position: 'absolute',
      width: 1,
      backgroundColor: theme.colors.gray100,
      top: 14,
      left: 5.5,
      bottom: -10,
    },
    historyContent: {
      flex: 1,
      paddingTop: 0,
    },
    historyText: {
      fontSize: 18,
      fontFamily: theme.fonts.displayMedium,
      color: theme.colors.textPrimary,
      marginBottom: 4,
      lineHeight: 24,
    },
    historyTime: {
      fontSize: 15,
      fontFamily: theme.fonts.body,
      color: theme.colors.gray500,
      lineHeight: 22,
    },
    workNotesSection: {
      backgroundColor: theme.colors.bgPrimary,
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderTopWidth: 5,
      borderTopColor: theme.colors.gray50,
    },
    workNotesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    workNotesTitle: {
      fontSize: 17,
      fontFamily: theme.fonts.bodySemiBold,
      color: theme.colors.textPrimary,
    },
    workNotesInput: {
      width: '100%',
      minHeight: 120,
      maxHeight: 120,
      padding: 14,
      fontSize: 16,
      fontFamily: theme.fonts.body,
      lineHeight: 26,
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.gray50,
      borderWidth: 1,
      borderColor: theme.colors.gray300,
      borderRadius: 12,
    },
    saveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    saveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 6,
    },
    saveText: {
      fontSize: 15,
      fontFamily: theme.fonts.body,
      color: theme.colors.gray400,
    },
    actionButtonsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 20,
      backgroundColor: theme.colors.bgPrimary,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderDefault,
      maxWidth: 400,
      alignSelf: 'center',
      width: '100%',
    },
    pauseButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 48,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: theme.colors.gray50,
      borderWidth: 1,
      borderColor: theme.colors.gray300,
      marginRight: 12,
    },
    pauseButtonText: {
      fontSize: 16,
      fontFamily: theme.fonts.bodySemiBold,
      color: theme.colors.gray900,
    },
    completeButton: {
      flex: 1,
      backgroundColor: theme.colors.gray900,
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      height: 48,
      paddingHorizontal: 20,
    },
    completeButtonText: {
      fontSize: 16,
      fontFamily: theme.fonts.bodySemiBold,
      color: theme.colors.textInverse,
      marginLeft: 8,
    },
    emptyState: {
      padding: 24,
      alignItems: 'center',
    },
    emptyTitle: {
      fontFamily: theme.fonts.displayBold,
      fontSize: 18,
      color: theme.colors.textPrimary,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontFamily: theme.fonts.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });
}

export function TaskDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const raw = useLocalSearchParams<{ id: string | string[] }>();
  const id = typeof raw.id === 'string' ? raw.id : raw.id?.[0] ?? '';
  const task = id ? getTaskDetail(id) : undefined;

  const theme = useTheme();
  const { isDark } = useColorScheme();
  const styles = React.useMemo(() => createDetailStyles(theme), [theme]);

  const [activeTab, setActiveTab] = React.useState<TabKey>('details');
  const [workNotes, setWorkNotes] = React.useState(
    'Filter replaced successfully. Found minor refrigerant leak near compressor - sealed and recharged system.',
  );
  const [syncCounter, setSyncCounter] = React.useState(30);
  const [saveText, setSaveText] = React.useState('Saved 2 minutes ago');

  React.useEffect(() => {
    const interval = setInterval(() => {
      setSyncCounter(prev => (prev >= 30 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (!workNotes)
      return;
    setSaveText('Saving...');
    const timeout = setTimeout(() => {
      setSaveText('Saved just now');
      setTimeout(() => setSaveText('Saved 1 minute ago'), 60000);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [workNotes]);

  const switchTab = (tab: TabKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const getSyncText = () => {
    if (syncCounter === 0)
      return 'Just updated';
    if (syncCounter < 30)
      return `Updated ${syncCounter} sec ago`;
    return 'Syncing...';
  };

  if (!task) {
    return (
      <View style={[styles.container, { justifyContent: 'center', paddingTop: insets.top }]}>
        <FocusAwareStatusBar />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Task not found</Text>
          <Text style={styles.emptySubtitle}>
            This task may have been removed or the link is invalid.
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { marginTop: 20, alignSelf: 'center' }]}
            onPress={() => router.back()}
          >
            <Text style={styles.infoValue}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FocusAwareStatusBar />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: 16 + insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke={theme.colors.textSecondary}
                strokeWidth="2.5"
                fill="none"
              />
            </Svg>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {task.title}
            </Text>
            <Text style={styles.headerSubtitle}>{task.id}</Text>
          </View>

          <TouchableOpacity style={styles.menuButton} activeOpacity={0.7}>
            <Image
              source={require('../../../assets/threedot.png')}
              style={styles.menuIcon}
              contentFit="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.syncIndicator}>
          <View
            style={[
              styles.syncDot,
              {
                backgroundColor:
                  syncCounter >= 30 ? theme.colors.primary500 : theme.colors.success,
              },
            ]}
          />
          <Text style={styles.syncText}>{getSyncText()}</Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        bottomOffset={20}
      >
        <View style={styles.statusSection}>
          <View style={styles.statusTopLine} />
          <View style={styles.statusContent}>
            <View style={styles.statusIcon}>
              <Svg width={26} height={26} viewBox="0 0 24 24">
                <Polygon
                  points="5 3 19 12 5 21 5 3"
                  stroke="white"
                  strokeWidth="2.5"
                  fill="none"
                />
              </Svg>
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusLabel}>CURRENT STATUS</Text>
              <View style={styles.statusRow}>
                <Text style={styles.statusTitle}>{task.status}</Text>
                {task.priority === 'high' && (
                  <View style={styles.priorityBadge}>
                    <Svg width={12} height={12} viewBox="0 0 24 24" style={{ marginRight: 4 }}>
                      <Polygon
                        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                        fill={theme.colors.critical}
                      />
                    </Svg>
                    <Text style={styles.priorityText}>HIGH</Text>
                  </View>
                )}
              </View>
              {task.startedAt && (
                <Text style={styles.statusTime}>
                  Started
                  {task.startedAt}
                </Text>
              )}
              {task.estimatedCompletion && (
                <Text style={styles.statusCompletion}>
                  Est. completion:
                  {task.estimatedCompletion}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.locationSection}>
          <View style={styles.sectionHeader}>
            <Svg width={18} height={18} viewBox="0 0 24 24" style={{ marginRight: 8 }}>
              <Path
                d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                stroke={theme.colors.primary500}
                strokeWidth="2"
                fill="none"
              />
              <Circle cx="12" cy="10" r="3" fill={theme.colors.primary500} />
            </Svg>
            <Text style={styles.sectionHeaderText}>LOCATION</Text>
          </View>
          <Text style={styles.locationText}>{task.location}</Text>
          {task.address && (
            <Text style={[styles.locationText, { marginTop: 8, color: theme.colors.textSecondary }]}>
              {task.address}
            </Text>
          )}
          <TouchableOpacity style={styles.mapPreview} activeOpacity={0.8}>
            <View style={styles.mapContent}>
              <Svg width={32} height={32} viewBox="0 0 24 24">
                <Path
                  d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                  fill={theme.colors.primary200}
                />
                <Circle cx="12" cy="10" r="3" fill={theme.colors.primary600} />
              </Svg>
              <View style={styles.mapButton}>
                <Text style={styles.mapButtonText}>Tap to open map</Text>
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path
                  d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                  stroke={theme.colors.textPrimary}
                  strokeWidth="2"
                  fill="none"
                />
                <Circle cx="12" cy="10" r="3" fill={theme.colors.textPrimary} />
              </Svg>
              <Text style={styles.actionButtonText}>Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path
                  d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                  stroke={theme.colors.textPrimary}
                  strokeWidth="2"
                  fill="none"
                />
              </Svg>
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.description}>
          <Text style={styles.descriptionText}>{task.description}</Text>
        </View>

        <View style={styles.tabsContainer}>
          <View style={styles.tabsRow}>
            {(['details', 'resources', 'history'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={styles.tab}
                onPress={() => switchTab(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab ? styles.tabTextActive : styles.tabTextInactive,
                  ]}
                >
                  {tab === 'details' ? 'Details' : tab === 'resources' ? 'Resources' : 'History'}
                </Text>
                {activeTab === tab
                  ? (
                    <>
                      <View style={styles.tabIndicator} />
                      <View style={styles.tabPill} />
                    </>
                    )
                  : (
                      <View style={styles.tabIndicatorInactive} />
                    )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'details' && (
            <>
              <View style={styles.customerSection}>
                <View style={styles.sectionTitleRow}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                    <Path
                      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                      stroke={theme.colors.textTertiary}
                      strokeWidth="2"
                      fill="none"
                    />
                    <Circle cx="12" cy="7" r="4" stroke={theme.colors.textTertiary} strokeWidth="2" fill="none" />
                  </Svg>
                  <Text style={styles.sectionTitle}>Customer</Text>
                </View>
                <View style={styles.customerCard}>
                  <View
                    style={[
                      styles.customerAvatar,
                      { backgroundColor: theme.colors.primary500 },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        fontFamily: theme.fonts.displayMedium,
                        color: theme.colors.textInverse,
                      }}
                    >
                      {task.customer.initials}
                    </Text>
                  </View>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName} numberOfLines={2}>
                      {task.customer.name}
                    </Text>
                    <Text style={styles.customerContact} numberOfLines={1}>
                      Contact:
                      {task.customer.contact}
                    </Text>
                  </View>
                  <View style={styles.customerActions}>
                    <TouchableOpacity style={[styles.customerActionButton, { marginRight: 8 }]} activeOpacity={0.7}>
                      <Svg width={18} height={18} viewBox="0 0 24 24">
                        <Path
                          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                          stroke={theme.colors.gray600}
                          strokeWidth="2"
                          fill="none"
                        />
                      </Svg>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.customerActionButton} activeOpacity={0.7}>
                      <Svg width={18} height={18} viewBox="0 0 24 24">
                        <Path
                          d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                          stroke={theme.colors.gray600}
                          strokeWidth="2"
                          fill="none"
                        />
                        <Polyline points="22,6 12,13 2,6" stroke={theme.colors.gray600} strokeWidth="2" fill="none" />
                      </Svg>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  {task.customer.phone && (
                    <View style={{ marginBottom: task.customer.email ? 16 : 0 }}>
                      <Text style={styles.infoLabel}>Phone</Text>
                      <Text style={styles.infoValue}>{task.customer.phone}</Text>
                    </View>
                  )}
                  {task.customer.email && (
                    <View>
                      <Text style={styles.infoLabel}>Email</Text>
                      <Text style={styles.infoValue}>{task.customer.email}</Text>
                    </View>
                  )}
                </View>
              </View>

              {task.assignment && (
                <View>
                  <View style={styles.sectionTitleRow}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                      <Path
                        d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                        stroke={theme.colors.textTertiary}
                        strokeWidth="2"
                        fill="none"
                      />
                      <Circle cx="8.5" cy="7" r="4" stroke={theme.colors.textTertiary} strokeWidth="2" fill="none" />
                      <Path d="M20 8v6M23 11h-6" stroke={theme.colors.textTertiary} strokeWidth="2" fill="none" />
                    </Svg>
                    <Text style={styles.sectionTitle}>Assignment</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <View style={{ marginBottom: 16 }}>
                      <Text style={styles.infoLabel}>Assigned To</Text>
                      <Text style={styles.infoValue}>{task.assignment.assignedTo}</Text>
                    </View>
                    <View style={{ marginBottom: 16 }}>
                      <Text style={styles.infoLabel}>Team</Text>
                      <Text style={styles.infoValue}>{task.assignment.team}</Text>
                    </View>
                    <View>
                      <Text style={styles.infoLabel}>Territory</Text>
                      <Text style={styles.infoValue}>{task.assignment.territory}</Text>
                    </View>
                  </View>
                </View>
              )}
            </>
          )}

          {activeTab === 'resources' && (
            <>
              {task.equipment && task.equipment.length > 0 && (
                <View style={styles.equipmentSection}>
                  <View style={styles.sectionTitleRow}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                      <Path
                        d="M20 7h-9M14 17H5M6 3v4M10 17v4M14 7v4"
                        stroke={theme.colors.textTertiary}
                        strokeWidth="2"
                        fill="none"
                      />
                    </Svg>
                    <Text style={styles.sectionTitle}>Equipment</Text>
                  </View>
                  <View style={styles.equipmentList}>
                    {task.equipment.map((item, index) => (
                      <View key={index} style={styles.equipmentItem}>
                        <View style={styles.equipmentIcon}>
                          {item.icon === 'briefcase'
                            ? (
                                <Svg width={20} height={20} viewBox="0 0 24 24">
                                  <Rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke={theme.colors.primary600} strokeWidth="2" fill="none" />
                                  <Path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke={theme.colors.primary600} strokeWidth="2" fill="none" />
                                </Svg>
                              )
                            : item.icon === 'clock'
                              ? (
                                  <Svg width={20} height={20} viewBox="0 0 24 24">
                                    <Circle cx="12" cy="12" r="10" stroke={theme.colors.primary600} strokeWidth="2" fill="none" />
                                    <Polyline points="12 6 12 12 16 14" stroke={theme.colors.primary600} strokeWidth="2" fill="none" />
                                  </Svg>
                                )
                              : (
                                  <Svg width={20} height={20} viewBox="0 0 24 24">
                                    <Path
                                      d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
                                      stroke={theme.colors.primary600}
                                      strokeWidth="2"
                                      fill="none"
                                    />
                                  </Svg>
                                )}
                        </View>
                        <Text style={styles.equipmentName}>{item.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              <View style={{ marginTop: -18 }}>
                <View style={styles.sectionTitleRow}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={theme.colors.textTertiary} strokeWidth="2" fill="none" />
                    <Line x1="16" y1="2" x2="16" y2="6" stroke={theme.colors.textTertiary} strokeWidth="2" />
                    <Line x1="8" y1="2" x2="8" y2="6" stroke={theme.colors.textTertiary} strokeWidth="2" />
                    <Line x1="3" y1="10" x2="21" y2="10" stroke={theme.colors.textTertiary} strokeWidth="2" />
                  </Svg>
                  <Text style={styles.sectionTitle}>Schedule</Text>
                </View>
                <View style={styles.scheduleGrid}>
                  {task.schedule.scheduledStart && (
                    <View style={styles.scheduleCard}>
                      <Text style={styles.scheduleLabel}>SCHEDULED START</Text>
                      <Text style={styles.scheduleValue}>{task.schedule.scheduledStart.time}</Text>
                      {task.schedule.scheduledStart.date && (
                        <Text style={styles.scheduleSubtext}>{task.schedule.scheduledStart.date}</Text>
                      )}
                    </View>
                  )}
                  {task.schedule.scheduledEnd && (
                    <View style={styles.scheduleCard}>
                      <Text style={styles.scheduleLabel}>SCHEDULED END</Text>
                      <Text style={styles.scheduleValue}>{task.schedule.scheduledEnd.time}</Text>
                      {task.schedule.scheduledEnd.duration && (
                        <Text style={styles.scheduleSubtext}>
                          {task.schedule.scheduledEnd.duration}
                          {' '}
                          duration
                        </Text>
                      )}
                    </View>
                  )}
                  {task.schedule.actualStart && (
                    <View style={styles.scheduleCard}>
                      <Text style={styles.scheduleLabel}>ACTUAL START</Text>
                      <Text style={styles.scheduleValue}>{task.schedule.actualStart.time}</Text>
                      {task.schedule.actualStart.note && (
                        <Text style={styles.scheduleSubtext}>{task.schedule.actualStart.note}</Text>
                      )}
                    </View>
                  )}
                  {task.schedule.earliestTime && (
                    <View style={styles.scheduleCard}>
                      <Text style={styles.scheduleLabel}>EARLIEST TIME</Text>
                      <Text style={styles.scheduleValue}>{task.schedule.earliestTime.time}</Text>
                      {task.schedule.earliestTime.note && (
                        <Text style={styles.scheduleSubtext}>{task.schedule.earliestTime.note}</Text>
                      )}
                    </View>
                  )}
                  {!task.schedule.scheduledStart && !task.schedule.scheduledEnd
                  && !task.schedule.actualStart
                  && !task.schedule.earliestTime && (
                    <View style={[styles.scheduleCard, { minWidth: '100%' }]}>
                      <Text style={styles.scheduleLabel}>WINDOW</Text>
                      <Text style={styles.scheduleValue}>{task.schedule.scheduled}</Text>
                      <Text style={styles.scheduleSubtext}>
                        Duration:
                        {task.schedule.duration}
                        {' · '}
                        Earliest:
                        {task.schedule.earliestStart}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}

          {activeTab === 'history' && (
            <View style={styles.historyList}>
              {task.activity.map((item, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyTimeline}>
                    <View style={styles.historyDot} />
                    {index < task.activity.length - 1 && <View style={styles.historyLine} />}
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyText}>{item.text}</Text>
                    <Text style={styles.historyTime}>{item.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.workNotesSection}>
          <View style={styles.workNotesHeader}>
            <Svg width={18} height={18} viewBox="0 0 24 24" style={{ marginRight: 8 }}>
              <Path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                stroke={theme.colors.textTertiary}
                strokeWidth="2"
                fill="none"
              />
              <Path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                stroke={theme.colors.textTertiary}
                strokeWidth="2"
                fill="none"
              />
            </Svg>
            <Text style={styles.workNotesTitle}>Work Notes</Text>
          </View>
          <TextInput
            style={{ ...styles.workNotesInput, textAlignVertical: 'top' }}
            placeholder="Add notes about the work performed..."
            placeholderTextColor={theme.colors.textTertiary}
            multiline
            value={workNotes}
            onChangeText={setWorkNotes}
          />
          <View style={styles.saveIndicator}>
            <View
              style={[
                styles.saveDot,
                {
                  backgroundColor: saveText.includes('Saving')
                    ? theme.colors.warning
                    : theme.colors.success,
                },
              ]}
            />
            <Text style={styles.saveText}>{saveText}</Text>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <View
        style={[
          styles.actionButtonsContainer,
          { paddingBottom: 20 + insets.bottom },
        ]}
      >
        <TouchableOpacity style={styles.pauseButton} activeOpacity={0.7}>
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Rect x="6" y="4" width="4" height="16" stroke={theme.colors.textSecondary} strokeWidth="2" fill="none" />
            <Rect x="14" y="4" width="4" height="16" stroke={theme.colors.textSecondary} strokeWidth="2" fill="none" />
          </Svg>
          <Text style={styles.pauseButtonText}>Pause</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.completeButton} activeOpacity={0.7}>
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Path
              d="M20 6L9 17l-5-5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
          <Text style={styles.completeButtonText}>Complete Task</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
