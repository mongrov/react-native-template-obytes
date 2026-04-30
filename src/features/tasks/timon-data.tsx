import { useRouter } from 'expo-router';
import * as React from 'react';
import { ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { FocusAwareStatusBar, Text, View } from '@/components/ui';
import { Modal, useModal } from '@/components/ui/modal';
import { TimonDataStore } from '@/features/tasks/data/timon-data-store';
import type { TimonTaskRow } from '@/features/tasks/data/timon-data-store';
import { mockTaskGroups } from '@/features/tasks/data/mock-tasks';
import type { TaskListItem } from '@/features/tasks/types';
import { useColorScheme, useTheme } from '@/lib/theme';

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bgPrimary,
    },
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
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
      minWidth: 0,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.colors.bgTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontFamily: theme.fonts.displayBold,
      fontSize: 18,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontFamily: theme.fonts.body,
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    headerRight: {
      flexDirection: 'row',
      gap: 10,
    },
    button: {
      height: 36,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.borderDefault,
      backgroundColor: theme.colors.bgPrimary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      fontFamily: theme.fonts.bodyBold,
      fontSize: 12,
      color: theme.colors.textPrimary,
    },
    list: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 10,
    },
    row: {
      borderWidth: 1,
      borderColor: theme.colors.borderDefault,
      borderRadius: 12,
      padding: 12,
      backgroundColor: theme.colors.bgPrimary,
    },
    rowInner: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowContent: {
      flex: 1,
      minWidth: 0,
    },
    rowActions: {
      flexDirection: 'row',
      gap: 8,
      marginLeft: 12,
    },
    rowActionButton: {
      width: 34,
      height: 34,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.borderDefault,
      backgroundColor: theme.colors.bgPrimary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rowTitle: {
      fontFamily: theme.fonts.bodyBold,
      fontSize: 14,
      color: theme.colors.textPrimary,
    },
    rowMeta: {
      marginTop: 4,
      fontFamily: theme.fonts.body,
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    empty: {
      paddingHorizontal: 20,
      paddingVertical: 40,
      alignItems: 'center',
    },
    modalContent: {
      paddingHorizontal: 16,
      paddingBottom: 20,
      gap: 12,
    },
    input: {
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.borderDefault,
      backgroundColor: theme.colors.bgPrimary,
      paddingHorizontal: 12,
      color: theme.colors.textPrimary,
      fontFamily: theme.fonts.body,
      fontSize: 14,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    modalActionButton: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.borderDefault,
      backgroundColor: theme.colors.bgPrimary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalActionText: {
      fontFamily: theme.fonts.bodyBold,
      fontSize: 13,
      color: theme.colors.textPrimary,
    },
  });
}
export function TimonDataScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isDark } = useColorScheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const editModal = useModal();

  const store = React.useMemo(() => new TimonDataStore(), []);
  const [rows, setRows] = React.useState<TimonTaskRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [nextAddIndex, setNextAddIndex] = React.useState(0);
  const [editingRow, setEditingRow] = React.useState<TimonTaskRow | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editStatus, setEditStatus] = React.useState('');
  const allMockTasks = React.useMemo<TaskListItem[]>(
    () => [
      ...mockTaskGroups.new,
      ...mockTaskGroups.inProgress,
      ...mockTaskGroups.upcoming,
      ...mockTaskGroups.completed,
    ],
    [],
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await store.listTasks(200);
      setRows(r);
    }
    finally {
      setLoading(false);
    }
  }, [store]);

  const recomputeNextAddIndex = React.useCallback((currentRows: TimonTaskRow[]) => {
    const existing = new Set(currentRows.map(r => r.id));
    const idx = allMockTasks.findIndex(t => !existing.has(t.id));
    setNextAddIndex(idx === -1 ? allMockTasks.length : idx);
  }, [allMockTasks]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const add = React.useCallback(async () => {
    const task = allMockTasks[nextAddIndex];
    if (!task) return;
    setLoading(true);
    try {
      await store.addTasks([task]);
      const r = await store.listTasks(200);
      setRows(r);
      recomputeNextAddIndex(r);
    }
    finally {
      setLoading(false);
    }
  }, [allMockTasks, nextAddIndex, recomputeNextAddIndex, store]);

  const deleteOne = React.useCallback(async () => {
    const row = rows[0];
    if (!row) return;
    setLoading(true);
    try {
      await store.deleteTask(row.id);
      const r = await store.listTasks(200);
      setRows(r);
      recomputeNextAddIndex(r);
    }
    finally {
      setLoading(false);
    }
  }, [recomputeNextAddIndex, rows, store]);

  const openEdit = React.useCallback((row: TimonTaskRow) => {
    setEditingRow(row);
    setEditTitle(row.title ?? '');
    setEditStatus(row.status ?? '');
    editModal.present(row);
  }, [editModal]);

  const saveEdit = React.useCallback(async () => {
    if (!editingRow) return;
    setLoading(true);
    try {
      await store.updateTask(editingRow.id, {
        title: editTitle.trim(),
        status: editStatus.trim(),
      });
      const r = await store.listTasks(200);
      setRows(r);
      recomputeNextAddIndex(r);
      editModal.dismiss();
      setEditingRow(null);
    }
    finally {
      setLoading(false);
    }
  }, [editModal, editStatus, editTitle, editingRow, recomputeNextAddIndex, store]);

  React.useEffect(() => {
    recomputeNextAddIndex(rows);
  }, [recomputeNextAddIndex, rows]);

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
                d="M15 18l-6-6 6-6"
                stroke={theme.colors.textTertiary}
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.title} numberOfLines={1}>Timon data</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {loading
                ? 'Loading…'
                : `${rows.length} rows • ${Math.min(nextAddIndex + 1, allMockTasks.length)}/${allMockTasks.length} next`}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.7}
            onPress={add}
            disabled={loading || nextAddIndex >= allMockTasks.length}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path
                d="M12 5v14M5 12h14"
                stroke={theme.colors.textPrimary}
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.7}
            onPress={deleteOne}
            disabled={loading || rows.length === 0}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path
                d="M3 6h18M8 6V4h8v2M7 6l1 16h8l1-16"
                stroke={theme.colors.textPrimary}
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {rows.length === 0
          ? (
              <View style={styles.empty}>
                <Text style={styles.rowTitle}>No data</Text>
                <Text style={styles.rowMeta}>Add tasks, then refresh.</Text>
              </View>
            )
          : (
              rows.map(r => (
                <View key={r.id} style={styles.row}>
                  <View style={styles.rowInner}>
                    <View style={styles.rowContent}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{r.title || r.id}</Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        {r.id}
                        {' · '}
                        {r.status}
                        {' · '}
                        {new Date(r.updatedAt).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.rowActions}>
                      <TouchableOpacity
                        style={styles.rowActionButton}
                        activeOpacity={0.7}
                        onPress={() => openEdit(r)}
                        disabled={loading}
                      >
                        <Svg width={18} height={18} viewBox="0 0 24 24">
                          <Path
                            d="M12 20h9"
                            stroke={theme.colors.textPrimary}
                            strokeWidth="2.5"
                            fill="none"
                            strokeLinecap="round"
                          />
                          <Path
                            d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
                            stroke={theme.colors.textPrimary}
                            strokeWidth="2.5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
      </ScrollView>

      <Modal
        ref={editModal.ref}
        title="Edit task"
        snapPoints={['45%']}
        onDismiss={() => setEditingRow(null)}
      >
        <View style={styles.modalContent}>
          <View>
            <Text style={styles.rowMeta}>Title</Text>
            <TextInput
              style={styles.input}
              value={editTitle}
              onChangeText={setEditTitle}
              editable={!loading}
              placeholder="Title"
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>
          <View>
            <Text style={styles.rowMeta}>Status</Text>
            <TextInput
              style={styles.input}
              value={editStatus}
              onChangeText={setEditStatus}
              editable={!loading}
              placeholder="Status"
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalActionButton}
              activeOpacity={0.7}
              onPress={() => editModal.dismiss()}
              disabled={loading}
            >
              <Text style={styles.modalActionText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalActionButton}
              activeOpacity={0.7}
              onPress={saveEdit}
              disabled={loading || !editingRow}
            >
              <Text style={styles.modalActionText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
