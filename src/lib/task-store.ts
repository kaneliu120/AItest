/**
 * Task Store — PostgreSQL 持久化
 * 替代原来的 SQLite 存储
 * Database: mission_control (PostgreSQL)
 */

import { Pool } from 'pg';
import { logger } from '@/lib/logger';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  source: 'manual' | 'ai' | 'module' | 'workflow' | 'booking';
  type: 'general' | 'development' | 'booking' | 'service';
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  assignedTo?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
}

export interface TaskStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  completed: number;
  total: number;
}

// PostgreSQL 连接池
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL!;
    
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // 测试连接
    pool.query('SELECT 1')
      .then(() => logger.info('PostgreSQL connected', { module: 'task-store' }))
      .catch(err => logger.error('PostgreSQL connection failed', err, { module: 'task-store' }));
  }
  return pool;
}

// Get all tasks
export async function getAllTasks(): Promise<Task[]> {
  const query = `
    SELECT 
      id, title, description, priority, status, 
      created_at as "createdAt", updated_at as "updatedAt",
      due_date as "dueDate", assigned_to as "assignedTo",
      tags, source
    FROM tasks
    ORDER BY created_at DESC
  `;

  try {
    const result = await getPool().query(query);
    return result.rows.map(row => ({
      ...row,
      tags: row.tags || [],
      source: row.source || 'manual',
      type: 'general' // default type
    }));
  } catch (error) {
    logger.error('Failed to fetch task list', error, { module: 'task-store' });
    return [];
  }
}

// Get task statistics
export async function getTaskStats(): Promise<TaskStats> {
  const query = `
    SELECT 
      COUNT(*) as total_tasks,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
      COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress_tasks,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
      COUNT(CASE WHEN status = 'pending' AND due_date < NOW() THEN 1 END) as overdue_tasks
    FROM tasks
  `;

  try {
    const result = await getPool().query(query);
    const row = result.rows[0];
    
    const total = parseInt(row.total_tasks) || 0;
    const completed = parseInt(row.completed_tasks) || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      totalTasks: total,
      pendingTasks: parseInt(row.pending_tasks) || 0,
      inProgressTasks: parseInt(row.in_progress_tasks) || 0,
      completedTasks: completed,
      overdueTasks: parseInt(row.overdue_tasks) || 0,
      completionRate,
      completed,
      total
    };
  } catch (error) {
    logger.error('Failed to fetch task stats', error, { module: 'task-store' });
    return {
      totalTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      completionRate: 0,
      completed: 0,
      total: 0
    };
  }
}

// Create task
export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task | null> {
  const query = `
    INSERT INTO tasks (
      id, title, description, priority, status, 
      created_at, updated_at, due_date, assigned_to, tags, source
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
    ) RETURNING *
  `;

  const id = `task-${Date.now()}`;
  const now = new Date().toISOString();

  try {
    const result = await getPool().query(query, [
      id,
      task.title,
      task.description || '',
      task.priority || 'medium',
      task.status || 'pending',
      now,
      now,
      task.dueDate,
      task.assignedTo,
      JSON.stringify(task.tags || []),
      task.source || 'manual'
    ]);

    return mapRowToTask(result.rows[0]);
  } catch (error) {
    logger.error('Task creation failed', error, { module: 'task-store' });
    return null;
  }
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<boolean> {
  const allowed: Record<string, string> = {
    title: 'title',
    description: 'description',
    priority: 'priority',
    status: 'status',
    dueDate: 'due_date',
    assignedTo: 'assigned_to',
  };

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [k, col] of Object.entries(allowed)) {
    const v = (updates as Record<string, unknown>)[k];
    if (v !== undefined) {
      values.push(v);
      fields.push(`${col} = $${values.length}`);
    }
  }

  if (updates.tags !== undefined) {
    values.push(JSON.stringify(updates.tags || []));
    fields.push(`tags = $${values.length}`);
  }

  if (fields.length === 0) return false;
  values.push(new Date().toISOString());
  fields.push(`updated_at = $${values.length}`);
  values.push(id);

  const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${values.length}`;
  try {
    const result = await getPool().query(query, values);
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    logger.error('Task update failed', error, { module: 'task-store' });
    return false;
  }
}

export async function deleteTask(id: string): Promise<boolean> {
  try {
    const result = await getPool().query('DELETE FROM tasks WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    logger.error('Task deletion failed', error, { module: 'task-store' });
    return false;
  }
}

// 映射数据库行到Task对象
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToTask(row: Record<string, any>): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    source: row.source || 'manual',
    type: 'general',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    dueDate: row.due_date,
    assignedTo: row.assigned_to,
    tags: row.tags || [],
    metadata: {}
  };
}

// 关闭连接池
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// ---- Compatibility layer for legacy callers ----
const bookingIds = new Set<string>();

export function bookingTaskExists(bookingId: string): boolean {
  return bookingIds.has(bookingId);
}

export const taskStore = {
  async getAllTasks() {
    return getAllTasks();
  },
  async getTaskStats() {
    return getTaskStats();
  },
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
    const created = await createTask(task);
    const id = (task as any)?.metadata?.bookingId;
    if (id) bookingIds.add(id);
    return created;
  },
  async updateTask(id: string, updates: Partial<Task>) {
    return updateTask(id, updates);
  },
  async deleteTask(id: string) {
    return deleteTask(id);
  },
};
