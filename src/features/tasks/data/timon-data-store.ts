import type { TaskListItem } from '@/features/tasks/types';
import {
  DB_NAME,
  DEFAULT_BUCKET_INTERVAL,
  DEFAULT_TIMON_USER,
  ROOT_DIRECTORY_PATH,
  createDatabase,
  createTable,
  initTimon,
  insert,
  listDatabases,
  listTables,
  query,
} from '@/lib/timon';

const TASKS_TABLE = 'tasks';
const FALLBACK_DB = 'tasks_fallback.db';

const TasksSchema = {
  id: { type: 'string', required: true, unique: true },
  title: { type: 'string' },
  status: { type: 'string' },
  updatedAt: { type: 'int', datetime: true },
} as const;

export type TimonTaskRow = {
  id: string;
  title: string;
  status: string;
  updatedAt: number;
};

function escapeSqlString(value: string) {
  return value.replace(/'/g, '\'\'');
}

export class TimonDataStore {
  private initialized = false;
  private fallbackInitialized = false;

  private getQuickSQLiteOpen(): any {
    try {
      return require('react-native-quick-sqlite').open;
    }
    catch {
      return null;
    }
  }

  private async ensureFallbackReady(): Promise<void> {
    if (this.fallbackInitialized) return;
    const open = this.getQuickSQLiteOpen();
    if (!open) {
      throw new Error(
        '[TimonDataStore] Neither Timon nor quick-sqlite is available. Rebuild the app/dev-client with native modules.',
      );
    }

    const db = open({ name: FALLBACK_DB });
    db.execute(
      `CREATE TABLE IF NOT EXISTS ${TASKS_TABLE} (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT,
        status TEXT,
        updatedAt INTEGER
      );`,
    );
    this.fallbackInitialized = true;
  }

  private async ensureTimonReady(): Promise<void> {
    if (this.initialized) return;

    await initTimon(
      ROOT_DIRECTORY_PATH,
      DEFAULT_BUCKET_INTERVAL,
      DEFAULT_TIMON_USER,
    );

    const dbs = (await listDatabases()) ?? [];
    if (!dbs.includes(DB_NAME)) await createDatabase(DB_NAME);

    const tables = (await listTables(DB_NAME)) ?? [];
    if (!tables.includes(TASKS_TABLE)) {
      await createTable(DB_NAME, TASKS_TABLE, JSON.stringify(TasksSchema));
    }

    this.initialized = true;
  }

  async addTasks(tasks: TaskListItem[]): Promise<void> {
    const rows: TimonTaskRow[] = tasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status ?? (t.completedAt ? 'Done' : 'Open'),
      updatedAt: Date.now(),
    }));

    try {
      await this.ensureTimonReady();
      await insert(DB_NAME, TASKS_TABLE, rows);
      return;
    }
    catch (e: any) {
      const msg = String(e?.message ?? e);
      if (!msg.includes('NativeModules.TimonModule is null')) throw e;
    }

    await this.ensureFallbackReady();
    const open = this.getQuickSQLiteOpen();
    const db = open({ name: FALLBACK_DB });
    for (const r of rows) {
      db.execute(
        `INSERT OR REPLACE INTO ${TASKS_TABLE} (id, title, status, updatedAt) VALUES (?, ?, ?, ?);`,
        [r.id, r.title, r.status, r.updatedAt],
      );
    }
  }

  async listTasks(limit: number = 50): Promise<TimonTaskRow[]> {
    const n = Math.max(1, Math.floor(limit));

    try {
      await this.ensureTimonReady();
      const res: any = await query(
        DB_NAME,
        `SELECT id, title, status, updatedAt FROM ${TASKS_TABLE} ORDER BY updatedAt DESC LIMIT ${n}`,
      );
      return Array.isArray(res) ? (res as TimonTaskRow[]) : [];
    }
    catch (e: any) {
      const msg = String(e?.message ?? e);
      if (!msg.includes('NativeModules.TimonModule is null')) throw e;
    }

    await this.ensureFallbackReady();
    const open = this.getQuickSQLiteOpen();
    const db = open({ name: FALLBACK_DB });
    const res: any = db.execute(
      `SELECT id, title, status, updatedAt FROM ${TASKS_TABLE} ORDER BY updatedAt DESC LIMIT ${n};`,
    );
    const rows = res?.rows;
    if (Array.isArray(rows)) return rows as TimonTaskRow[];
    if (Array.isArray(rows?._array)) return rows._array as TimonTaskRow[];
    return [];
  }

  async deleteTask(id: string): Promise<void> {
    const safeId = escapeSqlString(id);

    try {
      await this.ensureTimonReady();
      await query(DB_NAME, `DELETE FROM ${TASKS_TABLE} WHERE id='${safeId}'`);
      return;
    }
    catch (e: any) {
      const msg = String(e?.message ?? e);
      if (!msg.includes('NativeModules.TimonModule is null')) throw e;
    }

    await this.ensureFallbackReady();
    const open = this.getQuickSQLiteOpen();
    const db = open({ name: FALLBACK_DB });
    db.execute(`DELETE FROM ${TASKS_TABLE} WHERE id=?;`, [id]);
  }

  async deleteAll(): Promise<void> {
    try {
      await this.ensureTimonReady();
      await query(DB_NAME, `DELETE FROM ${TASKS_TABLE}`);
      return;
    }
    catch (e: any) {
      const msg = String(e?.message ?? e);
      if (!msg.includes('NativeModules.TimonModule is null')) throw e;
    }

    await this.ensureFallbackReady();
    const open = this.getQuickSQLiteOpen();
    const db = open({ name: FALLBACK_DB });
    db.execute(`DELETE FROM ${TASKS_TABLE};`);
  }

  async updateTask(id: string, patch: Partial<Pick<TimonTaskRow, 'title' | 'status'>>): Promise<void> {
    const safeId = escapeSqlString(id);
    const title = patch.title ?? null;
    const status = patch.status ?? null;
    const updatedAt = Date.now();

    // If nothing to update, still bump updatedAt (useful for ordering)
    const safeTitle = title === null ? null : escapeSqlString(title);
    const safeStatus = status === null ? null : escapeSqlString(status);

    try {
      await this.ensureTimonReady();

      const setParts: string[] = [];
      if (safeTitle !== null) setParts.push(`title='${safeTitle}'`);
      if (safeStatus !== null) setParts.push(`status='${safeStatus}'`);
      setParts.push(`updatedAt=${updatedAt}`);

      await query(
        DB_NAME,
        `UPDATE ${TASKS_TABLE} SET ${setParts.join(', ')} WHERE id='${safeId}'`,
      );
      return;
    }
    catch (e: any) {
      const msg = String(e?.message ?? e);
      if (!msg.includes('NativeModules.TimonModule is null')) throw e;
    }

    await this.ensureFallbackReady();
    const open = this.getQuickSQLiteOpen();
    const db = open({ name: FALLBACK_DB });

    // Build a parameterized query for SQLite
    const cols: string[] = [];
    const args: any[] = [];
    if (title !== null) {
      cols.push('title=?');
      args.push(title);
    }
    if (status !== null) {
      cols.push('status=?');
      args.push(status);
    }
    cols.push('updatedAt=?');
    args.push(updatedAt);
    args.push(id);

    db.execute(
      `UPDATE ${TASKS_TABLE} SET ${cols.join(', ')} WHERE id=?;`,
      args,
    );
  }
}
