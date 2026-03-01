/**
 * Task Store — SQLite 持久化
 * 替代 task-service.ts 的内存存储
 * 数据文件: data/tasks.db (重启不丢失)
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'tasks.db');

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  source: 'manual' | 'ai' | 'module' | 'workflow' | 'booking'; // 任务来源
  type: 'general' | 'development' | 'booking' | 'service';     // 任务类型（development→流转自动化）
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  assignedTo?: string;
  tags: string[];
  metadata?: Record<string, unknown>; // 扩展信息（预约详情、联系人等）
}

export interface TaskStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  // Dashboard compat
  completed: number;
  total: number;
}

// ─── DB 单例 ──────────────────────────────────────────────────────────────────
let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');

  _db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'pending',
      source TEXT NOT NULL DEFAULT 'manual',
      type TEXT NOT NULL DEFAULT 'general',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      due_date TEXT,
      assigned_to TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      metadata TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_task_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_task_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_task_type ON tasks(type);
  `);
  // 迁移：旧表可能没有新列
  const migrations = [
    `ALTER TABLE tasks ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'`,
    `ALTER TABLE tasks ADD COLUMN type TEXT NOT NULL DEFAULT 'general'`,
    `ALTER TABLE tasks ADD COLUMN metadata TEXT`,
  ];
  
  for (const migration of migrations) {
    try {
      _db.exec(migration);
      console.log(`[task-store] 执行迁移: ${migration}`);
    } catch (e: any) {
      // 列已存在，忽略错误
      if (!e.message?.includes('duplicate column name')) {
        console.warn(`[task-store] 迁移失败: ${migration}`, e.message);
      }
    }
  }

  const count = (_db.prepare('SELECT COUNT(*) as n FROM tasks').get() as any).n;
  if (count === 0) importSeedTasks(_db);

  return _db;
}

function importSeedTasks(db: Database.Database) {
  const now = new Date().toISOString();
  
  // 种子数据接口 - tags 作为 JSON 字符串存储
  interface SeedTask {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
    createdAt: string;
    updatedAt: string;
    dueDate?: string;
    assignedTo?: string;
    tags: string; // JSON 字符串
  }
  
  const seeds: SeedTask[] = [
    {
      id: 'task-1', title: '修复生态系统UI界面',
      description: '全面检查并修复工具生态系统UI界面问题',
      priority: 'high', status: 'completed',
      createdAt: '2026-02-22T10:00:00Z', updatedAt: now,
      dueDate: '2026-02-23T18:00:00Z', assignedTo: '小A',
      tags: '["UI","修复","优先级"]',
    },
    {
      id: 'task-2', title: '优化API响应性能',
      description: '优化所有API端点的响应时间和错误处理',
      priority: 'medium', status: 'completed',
      createdAt: '2026-02-22T14:30:00Z', updatedAt: now,
      dueDate: '2026-02-24T12:00:00Z',
      tags: '["API","性能","优化"]',
    },
    {
      id: 'task-3', title: '部署知识管理系统',
      description: '完成知识管理系统的生产环境部署',
      priority: 'critical', status: 'completed',
      createdAt: '2026-02-21T09:00:00Z', updatedAt: now,
      dueDate: '2026-02-22T18:00:00Z', assignedTo: '小A',
      tags: '["部署","生产","完成"]',
    },
    {
      id: 'task-4', title: '编写项目文档',
      description: '编写完整的项目技术文档和使用指南',
      priority: 'low', status: 'pending',
      createdAt: '2026-02-23T08:00:00Z', updatedAt: now,
      dueDate: '2026-02-25T17:00:00Z',
      tags: '["文档","维护"]',
    },
    {
      id: 'task-5', title: '修复主页假数据',
      description: '将所有 dashboard 组件接入真实 API',
      priority: 'high', status: 'completed',
      createdAt: '2026-02-23T16:00:00Z', updatedAt: now,
      dueDate: '2026-02-23T20:00:00Z', assignedTo: '小A',
      tags: '["前端","数据","修复"]',
    },
  ];

  const insert = db.prepare(`
    INSERT INTO tasks (id, title, description, priority, status, created_at, updated_at, due_date, assigned_to, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAll = db.transaction((rows: typeof seeds) => {
    rows.forEach(r =>
      insert.run(r.id, r.title, r.description, r.priority, r.status,
                 r.createdAt, r.updatedAt, r.dueDate ?? null, r.assignedTo ?? null, r.tags)
    );
  });
  insertAll(seeds);
  console.log(`[task-store] 导入 ${seeds.length} 条种子任务`);
}

// ─── 公开 API ─────────────────────────────────────────────────────────────────

export function getAllTasks(): Task[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all() as any[];
  return rows.map(r => ({
    id:         r.id,
    title:      r.title,
    description:r.description,
    priority:   r.priority,
    status:     r.status,
    source:     r.source    ?? 'manual',
    type:       r.type      ?? 'general',
    createdAt:  r.created_at,
    updatedAt:  r.updated_at,
    dueDate:    r.due_date  ?? undefined,
    assignedTo: r.assigned_to ?? undefined,
    tags:       JSON.parse(r.tags || '[]'),
    metadata:   r.metadata  ? JSON.parse(r.metadata) : undefined,
  }));
}

export function getTaskStats(): TaskStats {
  const db = getDb();
  const now = new Date().toISOString();

  const total = (db.prepare('SELECT COUNT(*) as n FROM tasks').get() as any).n;
  const pending = (db.prepare("SELECT COUNT(*) as n FROM tasks WHERE status='pending'").get() as any).n;
  const inProgress = (db.prepare("SELECT COUNT(*) as n FROM tasks WHERE status='in-progress'").get() as any).n;
  const completed = (db.prepare("SELECT COUNT(*) as n FROM tasks WHERE status='completed'").get() as any).n;
  const overdue = (db.prepare(
    "SELECT COUNT(*) as n FROM tasks WHERE status NOT IN ('completed','cancelled') AND due_date < ?"
  ).get(now) as any).n;

  return {
    totalTasks: total,
    pendingTasks: pending,
    inProgressTasks: inProgress,
    completedTasks: completed,
    overdueTasks: overdue,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    // Dashboard compat
    completed,
    total,
  };
}

export function createTask(input: {
  title: string;
  description?: string;
  priority?: Task['priority'];
  source?: Task['source'];
  type?: Task['type'];
  dueDate?: string;
  assignedTo?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}): Task {
  const db = getDb();
  const id = `task-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
  const now = new Date().toISOString();
  const task: Task = {
    id, title: input.title,
    description: input.description || '',
    priority:    input.priority   || 'medium',
    status:      'pending',
    source:      input.source     || 'manual',
    type:        input.type       || 'general',
    createdAt: now, updatedAt: now,
    dueDate:    input.dueDate,
    assignedTo: input.assignedTo,
    tags:       input.tags     || [],
    metadata:   input.metadata,
  };

  db.prepare(`
    INSERT INTO tasks (id, title, description, priority, status, source, type, created_at, updated_at, due_date, assigned_to, tags, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, task.title, task.description, task.priority, task.status,
         task.source, task.type,
         task.createdAt, task.updatedAt,
         task.dueDate ?? null, task.assignedTo ?? null,
         JSON.stringify(task.tags),
         task.metadata ? JSON.stringify(task.metadata) : null);

  return task;
}

export function updateTaskStatus(id: string, status: Task['status']): boolean {
  const db = getDb();
  const result = db.prepare(
    "UPDATE tasks SET status=?, updated_at=? WHERE id=?"
  ).run(status, new Date().toISOString(), id);
  return result.changes > 0;
}

// 完整字段更新
export function updateTaskFull(id: string, updates: {
  title?: string;
  description?: string;
  priority?: Task['priority'];
  status?: Task['status'];
  type?: Task['type'];
  dueDate?: string | null;
  assignedTo?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
}): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  const fields: string[] = ['updated_at = ?'];
  const values: unknown[] = [now];

  if (updates.title       !== undefined) { fields.push('title = ?');       values.push(updates.title); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.priority    !== undefined) { fields.push('priority = ?');    values.push(updates.priority); }
  if (updates.status      !== undefined) { fields.push('status = ?');      values.push(updates.status); }
  if (updates.type        !== undefined) { fields.push('type = ?');        values.push(updates.type); }
  if (updates.dueDate     !== undefined) { fields.push('due_date = ?');    values.push(updates.dueDate); }
  if (updates.assignedTo  !== undefined) { fields.push('assigned_to = ?');values.push(updates.assignedTo); }
  if (updates.tags        !== undefined) { fields.push('tags = ?');        values.push(JSON.stringify(updates.tags)); }
  if (updates.metadata    !== undefined) { fields.push('metadata = ?');    values.push(JSON.stringify(updates.metadata)); }

  values.push(id);
  const result = db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id=?`).run(...(values as Parameters<typeof db.prepare>[0][]));
  return result.changes > 0;
}

// 兼容旧 taskService 接口
// 按类型查询
export function getTasksByType(type: Task['type']): Task[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM tasks WHERE type=? ORDER BY created_at DESC").all(type) as any[];
  return rows.map(r => ({
    id: r.id, title: r.title, description: r.description,
    priority: r.priority, status: r.status,
    source: r.source ?? 'manual', type: r.type ?? 'general',
    createdAt: r.created_at, updatedAt: r.updated_at,
    dueDate: r.due_date ?? undefined, assignedTo: r.assigned_to ?? undefined,
    tags: JSON.parse(r.tags || '[]'),
    metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
  }));
}

// 按来源查询
export function getTasksBySource(source: Task['source']): Task[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM tasks WHERE source=? ORDER BY created_at DESC").all(source) as any[];
  return rows.map(r => ({
    id: r.id, title: r.title, description: r.description,
    priority: r.priority, status: r.status,
    source: r.source ?? 'manual', type: r.type ?? 'general',
    createdAt: r.created_at, updatedAt: r.updated_at,
    dueDate: r.due_date ?? undefined, assignedTo: r.assigned_to ?? undefined,
    tags: JSON.parse(r.tags || '[]'),
    metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
  }));
}

// 检查预约是否已存在（通过 bookingId 去重）
export function bookingTaskExists(bookingId: string): boolean {
  const db = getDb();
  const row = db.prepare("SELECT id FROM tasks WHERE source='booking' AND metadata LIKE ?").get(`%"bookingId":"${bookingId}"%`);
  return !!row;
}

export const taskStore = {
  getTaskStats: () => Promise.resolve(getTaskStats()),
  getTasks: () => Promise.resolve(getAllTasks()),
  createTask: (input: Parameters<typeof createTask>[0]) => Promise.resolve(createTask(input)),
  updateTask: (id: string, updates: Parameters<typeof updateTaskFull>[1]) => {
    updateTaskFull(id, updates);
    return Promise.resolve(getAllTasks().find(t => t.id === id) || null);
  },
  updateTaskFull: (id: string, updates: Parameters<typeof updateTaskFull>[1]) =>
    Promise.resolve(updateTaskFull(id, updates)),
  deleteTask: (id: string) => {
    const db = getDb();
    const result = db.prepare('DELETE FROM tasks WHERE id=?').run(id);
    return Promise.resolve(result.changes > 0);
  },
};
