import * as React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';

import { Text, View } from '@/components/ui';
import type { TaskListItem } from '@/features/tasks/types';
import type { Theme } from '@/lib/theme';

type Props = {
  task: TaskListItem;
  theme: Theme;
  styles: ReturnType<typeof createCardStyles>;
  isCompleted?: boolean;
  isNew?: boolean;
  isInProgress?: boolean;
  isUpcoming?: boolean;
  isExpanded: boolean;
  onToggleExpand: (taskId: string) => void;
  onOpenTask: (taskId: string) => void;
};

function createCardStyles(theme: Theme) {
  return StyleSheet.create({
    taskCard: {
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: theme.colors.bgElevated,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      borderRadius: 16,
      overflow: 'hidden',
    },
    taskCardCompleted: {
      opacity: 0.7,
      borderColor: theme.colors.borderStrong,
    },
    taskMain: {
      padding: 20,
      flexDirection: 'row',
    },
    timeCol: {
      minWidth: 64,
      marginRight: 16,
      position: 'absolute',
      padding: 22,
      alignItems: 'center',
    },
    timeDisplay: {
      fontFamily: theme.fonts.displayBold,
      fontSize: 24,
      color: theme.colors.textPrimary,
      letterSpacing: -0.03,
      lineHeight: 24,
      textAlign: 'center',
    },
    timePeriod: {
      fontSize: 12,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.05,
      marginTop: -4,
      textAlign: 'center',
    },
    durationPill: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.bgTertiary,
      borderRadius: 6,
      left: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginTop: 8,
    },
    durationPillText: {
      fontSize: 13,
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.textSecondary,
    },
    taskContent: {
      flex: 1,
      minWidth: 0,
      width: '100%',
      marginLeft: 0,
      paddingLeft: 0,
    },
    taskHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      flexWrap: 'wrap',
      marginLeft: 70,
      marginTop: -5,
    },
    taskId: {
      fontFamily: theme.fonts.displayBold,
      fontSize: 12,
      color: theme.colors.textTertiary,
      letterSpacing: 0.05,
      textTransform: 'uppercase',
    },
    priorityBadge: {
      backgroundColor: theme.colors.bgTertiary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      marginLeft: 8,
    },
    priorityBadgeText: {
      fontSize: 11,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.gray500,
      letterSpacing: 0.05,
      textTransform: 'uppercase',
    },
    chevronButton: {
      marginLeft: 'auto',
      padding: 4,
    },
    chevronIcon: {
      flexShrink: 0,
    },
    chevronIconExpanded: {
      transform: [{ rotate: '180deg' }],
    },
    taskTitle: {
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 17,
      color: theme.colors.textPrimary,
      letterSpacing: -0.01,
      lineHeight: 24,
      marginBottom: 10,
      marginLeft: 70,
    },
    taskTitleCompleted: {
      opacity: 1,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
      marginLeft: 70,
    },
    metaIcon: {
      flexShrink: 0,
      marginRight: 6,
    },
    metaText: {
      fontSize: 14,
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.textSecondary,
    },
    expandedDetails: {
      marginTop: 20,
      paddingTop: 20,
      paddingBottom: 20,
      paddingHorizontal: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderSubtle,
      backgroundColor: theme.colors.bgPrimary,
      width: '100%',
      marginLeft: 0,
      marginRight: 0,
    },
    detailSection: {
      marginBottom: 24,
      width: '100%',
      paddingHorizontal: 0,
    },
    detailSectionLast: {
      marginBottom: 0,
    },
    detailSectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      width: '100%',
    },
    sectionIcon: {
      marginRight: 8,
    },
    detailSectionTitle: {
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 13,
      color: theme.colors.gray500,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    detailSectionText: {
      fontSize: 15,
      fontFamily: theme.fonts.body,
      color: theme.colors.gray500,
      lineHeight: 23,
      textAlign: 'left',
      flex: 1,
      flexWrap: 'wrap',
    },
    detailLabelBold: {
      fontFamily: theme.fonts.displayBold,
      color: theme.colors.gray600,
    },
    detailListItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 10,
      width: '100%',
      flex: 1,
    },
    bulletPoint: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: theme.colors.primary500,
      marginRight: 10,
      marginTop: 8,
      flexShrink: 0,
    },
    actionBar: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: theme.colors.bgPrimary,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderSubtle,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      overflow: 'hidden',
    },
    actionBtnSecondary: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.colors.gray50,
      borderWidth: 1,
      borderColor: theme.colors.borderDefault,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    declineBtn: {
      width: 100,
      backgroundColor: theme.colors.bgTertiary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.borderDefault,
      justifyContent: 'center',
      alignItems: 'center',
      height: 44,
    },
    declineBtnText: {
      fontSize: 15,
      fontFamily: theme.fonts.bodySemiBold,
      color: theme.colors.textPrimary,
    },
    acceptBtn: {
      flex: 1,
      backgroundColor: theme.colors.primary500,
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      height: 44,
      marginLeft: 8,
    },
    acceptBtnText: {
      fontSize: 15,
      fontFamily: theme.fonts.bodySemiBold,
      color: 'white',
    },
    completeBtn: {
      flex: 1,
      backgroundColor: theme.colors.primary500,
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      height: 44,
    },
    completeBtnText: {
      fontSize: 15,
      fontFamily: theme.fonts.bodySemiBold,
      color: 'white',
    },
    startBtn: {
      flex: 1,
      backgroundColor: theme.colors.primary500,
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      height: 44,
    },
    startBtnText: {
      fontSize: 15,
      fontFamily: theme.fonts.bodySemiBold,
      color: 'white',
    },
  });
}

export { createCardStyles };

export function TaskListCard({
  task,
  theme,
  styles,
  isCompleted = false,
  isNew = false,
  isInProgress = false,
  isUpcoming = false,
  isExpanded,
  onToggleExpand,
  onOpenTask,
}: Props) {
  const canExpand = !isCompleted;

  return (
    <TouchableOpacity
      style={[styles.taskCard, isCompleted && styles.taskCardCompleted] as StyleProp<ViewStyle>}
      onPress={() => {
        if (!isCompleted)
          onOpenTask(task.id);
      }}
      activeOpacity={0.7}
      disabled={isCompleted}
    >
      <View style={styles.taskMain}>
        <View style={styles.timeCol}>
          <Text style={styles.timeDisplay}>{task.time}</Text>
          <Text style={styles.timePeriod}>{task.period}</Text>
          <View style={styles.durationPill}>
            <Text style={styles.durationPillText}>{task.duration}</Text>
          </View>
        </View>

        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <Text style={styles.taskId}>{task.id}</Text>
            {task.priority === 'high' && (
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityBadgeText}>HIGH PRIORITY</Text>
              </View>
            )}
            {canExpand && (
              <TouchableOpacity
                onPress={() => onToggleExpand(task.id)}
                style={styles.chevronButton}
                activeOpacity={0.7}
              >
                <Svg
                  width={24}
                  height={28}
                  viewBox="0 0 24 24"
                  style={[
                    styles.chevronIcon,
                    isExpanded && styles.chevronIconExpanded,
                  ]}
                >
                  <Path
                    d="M6 9l6 6 6-6"
                    stroke={theme.colors.textTertiary}
                    strokeWidth="2"
                    fill="none"
                  />
                </Svg>
              </TouchableOpacity>
            )}
          </View>

          <Text
            style={[
              styles.taskTitle,
              isCompleted && styles.taskTitleCompleted,
            ]}
          >
            {task.title}
          </Text>

          <View>
            <View style={styles.metaRow}>
              <Svg width={16} height={16} viewBox="0 0 24 24" style={styles.metaIcon}>
                <Path
                  d="M3 21h18M9 8h1m-1 4h1m-1 4h1M15 8h1m-1 4h1m-1 4h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"
                  stroke={theme.colors.textTertiary}
                  strokeWidth="2"
                  fill="none"
                />
              </Svg>
              <Text style={styles.metaText}>{task.location}</Text>
            </View>
            {task.address && (
              <View style={styles.metaRow}>
                <Svg width={16} height={16} viewBox="0 0 24 24" style={styles.metaIcon}>
                  <Path
                    d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                    stroke={theme.colors.textTertiary}
                    strokeWidth="2"
                    fill="none"
                  />
                  <Circle cx="12" cy="10" r="3" fill={theme.colors.textTertiary} />
                </Svg>
                <Text style={styles.metaText}>{task.address}</Text>
              </View>
            )}
            {task.timeContext && (
              <View style={styles.metaRow}>
                <Svg width={16} height={16} viewBox="0 0 24 24" style={styles.metaIcon}>
                  <Circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke={theme.colors.textTertiary}
                    strokeWidth="2"
                    fill="none"
                  />
                  <Path
                    d="M12 6v6l4 2"
                    stroke={theme.colors.textTertiary}
                    strokeWidth="2"
                    fill="none"
                  />
                </Svg>
                <Text style={styles.metaText}>{task.timeContext}</Text>
              </View>
            )}
            {task.completedAt && (
              <View style={styles.metaRow}>
                <Svg width={16} height={16} viewBox="0 0 24 24" style={styles.metaIcon}>
                  <Path
                    d="M20 6L9 17l-5-5"
                    stroke={theme.colors.primary500}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
                <Text style={[styles.metaText, { color: theme.colors.gray500 }]}>
                  {task.completedAt}
                </Text>
              </View>
            )}
          </View>

          {isExpanded && (
            <View style={styles.expandedDetails}>
              {task.description && (
                <View style={styles.detailSection}>
                  <View style={styles.detailSectionTitleRow}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" style={styles.sectionIcon}>
                      <Path
                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                        stroke={theme.colors.textTertiary}
                        strokeWidth="2"
                        fill="none"
                      />
                      <Polygon
                        points="14 2 14 8 20 8"
                        stroke={theme.colors.textTertiary}
                        strokeWidth="2"
                        fill="none"
                      />
                    </Svg>
                    <Text style={styles.detailSectionTitle}>DESCRIPTION</Text>
                  </View>
                  <Text style={styles.detailSectionText}>{task.description}</Text>
                </View>
              )}
              {task.schedule && (
                <View style={styles.detailSection}>
                  <View style={styles.detailSectionTitleRow}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" style={styles.sectionIcon}>
                      <Rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                        stroke={theme.colors.textTertiary}
                        strokeWidth="2"
                        fill="none"
                      />
                      <Path
                        d="M16 2v4M8 2v4M3 10h18"
                        stroke={theme.colors.textTertiary}
                        strokeWidth="2"
                        fill="none"
                      />
                    </Svg>
                    <Text style={styles.detailSectionTitle}>SCHEDULE</Text>
                  </View>
                  <View style={styles.detailListItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.detailSectionText}>
                      <Text style={styles.detailLabelBold}>Scheduled:</Text>
                      {' '}
                      {task.schedule.scheduled}
                    </Text>
                  </View>
                  <View style={styles.detailListItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.detailSectionText}>
                      <Text style={styles.detailLabelBold}>Duration:</Text>
                      {' '}
                      {task.schedule.duration}
                    </Text>
                  </View>
                  <View style={styles.detailListItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.detailSectionText}>
                      <Text style={styles.detailLabelBold}>Earliest Start:</Text>
                      {' '}
                      {task.schedule.earliestStart}
                    </Text>
                  </View>
                </View>
              )}
              {task.customer && (
                <View style={[styles.detailSection, styles.detailSectionLast]}>
                  <View style={styles.detailSectionTitleRow}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" style={styles.sectionIcon}>
                      <Path
                        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                        stroke={theme.colors.textTertiary}
                        strokeWidth="2"
                        fill="none"
                      />
                      <Circle
                        cx="12"
                        cy="7"
                        r="4"
                        stroke={theme.colors.textTertiary}
                        strokeWidth="2"
                        fill="none"
                      />
                    </Svg>
                    <Text style={styles.detailSectionTitle}>CUSTOMER</Text>
                  </View>
                  <View style={styles.detailListItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.detailSectionText}>
                      <Text style={styles.detailLabelBold}>{task.customer.name}</Text>
                    </Text>
                  </View>
                  <View style={styles.detailListItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.detailSectionText}>
                      <Text style={styles.detailLabelBold}>Contact:</Text>
                      {' '}
                      {task.customer.contact}
                    </Text>
                  </View>
                  <View style={styles.detailListItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.detailSectionText}>
                      <Text style={styles.detailLabelBold}>Phone:</Text>
                      {' '}
                      {task.customer.phone}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {!isCompleted && (
        <View style={styles.actionBar}>
          {isNew && (
            <>
              <TouchableOpacity style={styles.declineBtn}>
                <Text style={styles.declineBtnText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn}>
                <Svg width={55} height={44} viewBox="0 0 24 24">
                  <Path
                    d="M9 12l2 2 4-4"
                    stroke="white"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
                <Text style={[styles.acceptBtnText, { marginLeft: -12 }]}>Accept Task</Text>
              </TouchableOpacity>
            </>
          )}
          {isInProgress && (
            <>
              <TouchableOpacity style={styles.actionBtnSecondary}>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                    stroke={theme.colors.textSecondary}
                    strokeWidth="2"
                    fill="none"
                  />
                </Svg>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnSecondary}>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path
                    d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                    stroke={theme.colors.textSecondary}
                    strokeWidth="2"
                    fill="none"
                  />
                  <Circle cx="12" cy="10" r="3" fill={theme.colors.textSecondary} />
                </Svg>
              </TouchableOpacity>
              <TouchableOpacity style={styles.completeBtn}>
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
                <Text style={[styles.completeBtnText, { marginLeft: 6 }]}>Complete</Text>
              </TouchableOpacity>
            </>
          )}
          {isUpcoming && (
            <>
              <TouchableOpacity style={styles.actionBtnSecondary}>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                    stroke={theme.colors.textSecondary}
                    strokeWidth="2"
                    fill="none"
                  />
                </Svg>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnSecondary}>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path
                    d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                    stroke={theme.colors.textSecondary}
                    strokeWidth="2"
                    fill="none"
                  />
                  <Circle cx="12" cy="10" r="3" fill={theme.colors.textSecondary} />
                </Svg>
              </TouchableOpacity>
              <TouchableOpacity style={styles.startBtn}>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Polygon
                    points="5 3 19 12 5 21 5 3"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                  />
                </Svg>
                <Text style={[styles.startBtnText, { marginLeft: 6 }]}>Start Task</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
