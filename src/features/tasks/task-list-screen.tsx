import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { FocusAwareStatusBar, Text, View } from '@/components/ui';
import {
  createCardStyles,
  TaskListCard,
} from '@/features/tasks/components/task-list-card';
import { mockTaskGroups, mockTaskStats } from '@/features/tasks/data/mock-tasks';
import type { SummaryFilter, TaskListItem } from '@/features/tasks/types';
import { useColorScheme, useTheme } from '@/lib/theme';

type CardType = Exclude<SummaryFilter, null>;

function parseDurationHours(duration: string): number {
  const n = Number.parseFloat(duration.replace(/h$/i, ''));
  return Number.isFinite(n) ? n : 0;
}

function sumHours(tasks: TaskListItem[]): string {
  const total = tasks.reduce((acc, t) => acc + parseDurationHours(t.duration), 0);
  return total % 1 === 0 ? total.toFixed(0) : total.toFixed(1);
}

function filterTasks(tasks: TaskListItem[], q: string): TaskListItem[] {
  const s = q.trim().toLowerCase();
  if (!s)
    return tasks;
  return tasks.filter(
    t =>
      t.title.toLowerCase().includes(s)
      || t.id.toLowerCase().includes(s)
      || t.location.toLowerCase().includes(s),
  );
}

function createListStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bgPrimary,
      width: '100%',
    },
    header: {
      backgroundColor: theme.colors.bgPrimary,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderSubtle,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      height:52,
    },
    headerTitle: {
      fontFamily: theme.fonts.displayBold,
      fontSize: 26,
      color: theme.colors.textPrimary,
      letterSpacing: -0.03,
    },
    headerActions: {
      flexDirection: 'row',
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.colors.bgTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    headerDate: {
      fontSize: 15,
      fontFamily: theme.fonts.body,
      color: theme.colors.textSecondary,
      marginBottom: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.bgPrimary,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      borderWidth: 1,
      marginBottom: 10,
      borderColor: theme.colors.borderDefault,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      fontFamily: theme.fonts.body,
      color: theme.colors.textPrimary,
    },
    filterButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.colors.bgPrimary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.borderDefault,
      marginLeft: 12,
    },
    summaryCards: {
      flexDirection: 'row',
      marginBottom: 12,
      gap: 10,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: theme.colors.bgPrimary,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.borderDefault,
      minHeight: 70,
    },
    summaryCardActive: {
      borderColor: theme.colors.borderDefault,
      borderWidth: 1,
    },
    summaryNumber: {
      fontFamily: theme.fonts.displayBold,
      fontSize: 20,
      color: theme.colors.textPrimary,
      letterSpacing: -0.02,
      marginBottom: 2,
    },
    summaryLabel: {
      fontSize: 11,
      fontFamily: theme.fonts.bodyBold,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    progressText: {
      fontSize: 14,
      fontFamily: theme.fonts.bodyMedium,
      color: theme.colors.textTertiary,
      textAlign: 'center',
    },
    taskListContent: {
      paddingBottom: 40,
    },
    taskList: {
      flex: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 12,
    },
    sectionTitle: {
      fontFamily: theme.fonts.displayBold,
      fontSize: 15,
      letterSpacing: 0.08,
      color: theme.colors.textPrimary,
    },
    sectionMeta: {
      fontSize: 14,
      fontFamily: theme.fonts.bodySemiBold,
      color: theme.colors.textSecondary,
    },
  });
}

export function TaskListScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isDark, setColorScheme } = useColorScheme();
  const [expandedTasks, setExpandedTasks] = React.useState<Set<string>>(() => new Set());
  const [activeFilter, setActiveFilter] = React.useState<SummaryFilter>(null);
  const [cardOrder, setCardOrder] = React.useState<CardType[]>([
    'new',
    'inProgress',
    'done',
  ]);
  const [search, setSearch] = React.useState('');

  const listStyles = React.useMemo(() => createListStyles(theme), [theme]);
  const cardStyles = React.useMemo(() => createCardStyles(theme), [theme]);

  // Shared values for drag-and-drop animation (LuminX behavior)
  const draggedIndex = useSharedValue<number | null>(null);
  const cardPosition0 = useSharedValue(0);
  const cardPosition1 = useSharedValue(0);
  const cardPosition2 = useSharedValue(0);
  const cardPositions = React.useMemo(
    () => [cardPosition0, cardPosition1, cardPosition2],
    [cardPosition0, cardPosition1, cardPosition2],
  );

  const headerDate = React.useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).format(new Date()),
    [],
  );

  const toggleTask = React.useCallback((taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId))
        next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const openTask = React.useCallback(
    (id: string) => {
      router.push(`/task-list/${encodeURIComponent(id)}`);
    },
    [router],
  );

  const taskStats = mockTaskStats;
  const newTasks = React.useMemo(
    () => filterTasks(mockTaskGroups.new, search),
    [search],
  );
  const inProgressTasks = React.useMemo(
    () => filterTasks(mockTaskGroups.inProgress, search),
    [search],
  );
  const upcomingTasks = React.useMemo(
    () => filterTasks(mockTaskGroups.upcoming, search),
    [search],
  );
  const completedTasks = React.useMemo(
    () => filterTasks(mockTaskGroups.completed, search),
    [search],
  );

  const toggleAppearance = React.useCallback(() => {
    setColorScheme(isDark ? 'light' : 'dark');
  }, [isDark, setColorScheme]);

  const handleDragEnd = React.useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex)
      return;
    setCardOrder((prevOrder) => {
      const next = [...prevOrder];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  }, []);

  const handleSummaryCardPress = React.useCallback((cardType: CardType) => {
    setActiveFilter(prev => (prev === cardType ? null : cardType));
  }, []);

  const summaryCardCallbacks = React.useMemo(
    () => ({
      new: () => handleSummaryCardPress('new'),
      inProgress: () => handleSummaryCardPress('inProgress'),
      done: () => handleSummaryCardPress('done'),
    }),
    [handleSummaryCardPress],
  );

  const DraggableSummaryCard = React.useMemo(() => {
    type Props = {
      cardType: CardType;
      index: number;
      value: number;
      label: string;
      isActive: boolean;
      onPress: () => void;
      cardWidth: number;
      onDragEnd: (fromIndex: number, toIndex: number) => void;
      isLast: boolean;
      draggedIndexShared: SharedValue<number | null>;
      cardPositionShared: SharedValue<number>;
      allCardPositions: SharedValue<number>[];
    };

    return React.memo(function DraggableSummaryCardImpl({
      index,
      value,
      label,
      isActive,
      onPress,
      cardWidth,
      onDragEnd,
      isLast,
      draggedIndexShared,
      cardPositionShared,
      allCardPositions,
    }: Props) {
      const translateX = useSharedValue(0);
      const translateY = useSharedValue(0);
      const scale = useSharedValue(1);
      const zIndex = useSharedValue(1);
      const isDragging = useSharedValue(false);
      const opacity = useSharedValue(1);
      const rotation = useSharedValue(0);
      const activeTranslateY = useSharedValue(0);

      // Match LuminX: lift the active card slightly
      React.useEffect(() => {
        activeTranslateY.value = withSpring(isActive ? -8 : 0, {
          damping: 15,
          stiffness: 150,
        });
      }, [isActive, activeTranslateY]);

      const animatedStyle = useAnimatedStyle(() => {
        const isThisCardDragged = draggedIndexShared.value === index;
        const positionOffset = isThisCardDragged ? 0 : cardPositionShared.value;
        return {
          transform: [
            { translateX: translateX.value + positionOffset },
            { translateY: translateY.value + activeTranslateY.value },
            { scale: scale.value },
            { rotateZ: `${rotation.value}deg` },
          ],
          zIndex: zIndex.value,
          opacity: opacity.value,
        };
      });

      const pressScale = useSharedValue(1);
      const hasMoved = useSharedValue(false);

      const panGesture = Gesture.Pan()
        .minDistance(10)
        .onStart(() => {
          hasMoved.value = false;
          isDragging.value = true;
          draggedIndexShared.value = index;
          zIndex.value = 1000;
          scale.value = withSpring(1.1, { damping: 15, stiffness: 150 });
          opacity.value = withSpring(0.9, { damping: 15, stiffness: 150 });
        })
        .onUpdate((event) => {
          hasMoved.value = true;
          translateX.value = event.translationX;
          translateY.value = event.translationY;
          rotation.value = event.translationX * 0.05;

          const newIndex = Math.round(index + event.translationX / cardWidth);
          const clampedIndex = Math.max(0, Math.min(2, newIndex));
          const cardSpacing = cardWidth + 12; // card width + gap

          for (let i = 0; i < 3; i++) {
            if (i !== index && allCardPositions[i]) {
              let target = 0;
              if (i < index && i >= clampedIndex)
                target = cardSpacing;
              else if (i > index && i <= clampedIndex)
                target = -cardSpacing;

              allCardPositions[i].value = withSpring(target, {
                damping: 20,
                stiffness: 200,
              });
            }
          }
        })
        .onEnd((event) => {
          const newIndex = Math.round(index + event.translationX / cardWidth);
          const clampedIndex = Math.max(0, Math.min(2, newIndex));

          if (clampedIndex !== index)
            runOnJS(onDragEnd)(index, clampedIndex);

          for (let i = 0; i < 3; i++) {
            if (allCardPositions[i]) {
              allCardPositions[i].value = withSpring(0, {
                damping: 20,
                stiffness: 200,
              });
            }
          }

          translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
          translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
          scale.value = withSpring(1, { damping: 15, stiffness: 150 });
          opacity.value = withSpring(1, { damping: 15, stiffness: 150 });
          rotation.value = withSpring(0, { damping: 15, stiffness: 150 });
          zIndex.value = 1;
          isDragging.value = false;
          draggedIndexShared.value = null;
        });

      const tapGesture = Gesture.Tap()
        .maxDuration(300)
        .maxDistance(10)
        .onBegin(() => {
          hasMoved.value = false;
          pressScale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
        })
        .onEnd(() => {
          pressScale.value = withSpring(1, { damping: 15, stiffness: 150 });
          if (!hasMoved.value && !isDragging.value)
            runOnJS(onPress)();
        });

      const pressAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pressScale.value }],
      }));

      const composed = Gesture.Race(tapGesture, panGesture);

      return (
        <GestureDetector gesture={composed}>
          <Reanimated.View
            style={[
              listStyles.summaryCard,
              isLast && { marginRight: 0 },
              isActive && listStyles.summaryCardActive,
              animatedStyle,
            ]}
          >
            <Reanimated.View
              style={[
                { flex: 1, alignItems: 'center', justifyContent: 'center' },
                pressAnimatedStyle,
              ]}
            >
              <Text
                style={[
                  listStyles.summaryNumber,
                ]}
              >
                {value}
              </Text>
              <Text
                style={[
                  listStyles.summaryLabel,
                ]}
              >
                {label}
              </Text>
            </Reanimated.View>
          </Reanimated.View>
        </GestureDetector>
      );
    });
  }, [listStyles]);

  return (
    <SafeAreaView style={listStyles.container} edges={['top', 'bottom']}>
      <FocusAwareStatusBar />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={listStyles.header}>
        <View style={listStyles.headerTop}>
          <Text style={listStyles.headerTitle}>Today's Tasks</Text>
          <View style={listStyles.headerActions}>
            <TouchableOpacity style={listStyles.iconButton} activeOpacity={0.7}>
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path
                  d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"
                  stroke={theme.colors.textTertiary}
                  strokeWidth="2"
                  fill="none"
                />
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity
              style={listStyles.iconButton}
              activeOpacity={0.7}
              onPress={toggleAppearance}
            >
              {isDark
                ? (
                    <Svg width={20} height={20} viewBox="0 0 24 24">
                      <Circle
                        cx="12"
                        cy="12"
                        r="5"
                        stroke={theme.colors.textTertiary}
                        strokeWidth="2"
                        fill="none"
                      />
                      <Path
                        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                        stroke={theme.colors.textTertiary}
                        strokeWidth="2"
                        fill="none"
                      />
                    </Svg>
                  )
                : (
                    <Svg width={20} height={20} viewBox="0 0 24 24">
                      <Path
                        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                        stroke={theme.colors.textTertiary}
                        strokeWidth="2"
                        fill="none"
                      />
                    </Svg>
                  )}
            </TouchableOpacity>
          </View>
        </View>
        <Text style={listStyles.headerDate}>{headerDate}</Text>

        <View style={listStyles.searchContainer}>
          <View style={listStyles.searchBar}>
            <TextInput
              style={listStyles.searchInput}
              placeholder="Search tasks..."
              placeholderTextColor={theme.colors.textTertiary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity style={listStyles.filterButton} activeOpacity={0.7}>
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path
                d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
                stroke={theme.colors.textTertiary}
                strokeWidth="2"
                fill="none"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        <View style={listStyles.summaryCards}>
          {(() => {
            const screenWidth = Dimensions.get('window').width;
            const padding = 20 * 2;
            const gap = 10 * 2;
            const cardWidth = (screenWidth - padding - gap) / 3;

            const cardData: Record<CardType, { value: number; label: string }> = {
              new: { value: taskStats.new, label: 'New' },
              inProgress: { value: taskStats.inProgress, label: 'In Progress' },
              done: { value: taskStats.done, label: 'Done' },
            };

            return cardOrder.map((cardType, index) => (
              <DraggableSummaryCard
                // key is the card type to keep identity stable across reorder
                key={cardType}
                cardType={cardType}
                index={index}
                value={cardData[cardType].value}
                label={cardData[cardType].label}
                isActive={activeFilter === cardType}
                onPress={summaryCardCallbacks[cardType]}
                cardWidth={cardWidth}
                onDragEnd={handleDragEnd}
                isLast={index === cardOrder.length - 1}
                draggedIndexShared={draggedIndex}
                cardPositionShared={cardPositions[index]}
                allCardPositions={cardPositions}
              />
            ));
          })()}
        </View>
        <Text style={listStyles.progressText}>
          {taskStats.completed}
          {' '}
          of
          {taskStats.total}
          {' '}
          tasks completed (
          {taskStats.completedPercent}
          %)
        </Text>
      </View>

      <ScrollView
        style={listStyles.taskList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={listStyles.taskListContent}
      >
        {(activeFilter === null || activeFilter === 'new') && newTasks.length > 0 && (
          <>
            <View style={listStyles.sectionHeader}>
              <Text style={listStyles.sectionTitle}>New Assignments</Text>
              <Text style={listStyles.sectionMeta}>
                {newTasks.length}
                {' '}
                tasks •
                {sumHours(newTasks)}
                h
              </Text>
            </View>
            {newTasks.map(task => (
              <TaskListCard
                key={task.id}
                task={task}
                theme={theme}
                styles={cardStyles}
                isNew
                isExpanded={expandedTasks.has(task.id)}
                onToggleExpand={toggleTask}
                onOpenTask={openTask}
              />
            ))}
          </>
        )}

        {(activeFilter === null || activeFilter === 'inProgress')
 && inProgressTasks.length > 0 && (
          <>
            <View style={listStyles.sectionHeader}>
              <Text style={listStyles.sectionTitle}>In Progress</Text>
              <Text style={listStyles.sectionMeta}>
                {inProgressTasks.length}
                {' '}
                tasks •
                {sumHours(inProgressTasks)}
                h
              </Text>
            </View>
            {inProgressTasks.map(task => (
              <TaskListCard
                key={task.id}
                task={task}
                theme={theme}
                styles={cardStyles}
                isInProgress
                isExpanded={expandedTasks.has(task.id)}
                onToggleExpand={toggleTask}
                onOpenTask={openTask}
              />
            ))}
          </>
        )}

        {activeFilter === null && upcomingTasks.length > 0 && (
          <>
            <View style={listStyles.sectionHeader}>
              <Text style={listStyles.sectionTitle}>Upcoming</Text>
              <Text style={listStyles.sectionMeta}>
                {upcomingTasks.length}
                {' '}
                tasks •
                {sumHours(upcomingTasks)}
                h
              </Text>
            </View>
            {upcomingTasks.map(task => (
              <TaskListCard
                key={task.id}
                task={task}
                theme={theme}
                styles={cardStyles}
                isUpcoming
                isExpanded={expandedTasks.has(task.id)}
                onToggleExpand={toggleTask}
                onOpenTask={openTask}
              />
            ))}
          </>
        )}

        {(activeFilter === null || activeFilter === 'done')
        && completedTasks.length > 0 && (
          <>
            <View style={listStyles.sectionHeader}>
              <Text style={listStyles.sectionTitle}>Completed Today</Text>
              <Text style={listStyles.sectionMeta}>
                {completedTasks.length}
                {' '}
                tasks •
                {sumHours(completedTasks)}
                h
              </Text>
            </View>
            {completedTasks.map(task => (
              <TaskListCard
                key={task.id}
                task={task}
                theme={theme}
                styles={cardStyles}
                isCompleted
                isExpanded={expandedTasks.has(task.id)}
                onToggleExpand={toggleTask}
                onOpenTask={openTask}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
