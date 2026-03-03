/**
 * PostgreSQL 数据库存储模块
 * 替代原来的 SQLite 存储
 */

import { Pool, PoolConfig } from 'pg';
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

// 数据库连接池配置
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

class PostgresStore {
  private pool: Pool;

  constructor() {
    this.pool = new Pool(poolConfig);
    
    // 测试连接
    this.testConnection();
  }

  private async testConnection(): Promise<void> {
    try {
      const client = await this.pool.connect();
      logger.info('PostgreSQL 连接成功', { module: 'postgres-store' });
      client.release();
    } catch (error) {
      logger.error('PostgreSQL 连接失败', error, { module: 'postgres-store' });
      throw error;
    }
  }

  // 获取所有任务
  async getAllTasks(): Promise<Task[]> {
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
      const result = await this.pool.query(query);
      return result.rows.map(row => ({
        ...row,
        tags: row.tags || [],
        source: row.source || 'manual'
      }));
    } catch (error) {
      logger.error('获取任务列表失败', error, { module: 'postgres-store' });
      return [];
    }
  }

  // 获取任务统计
  async getTaskStats(): Promise<TaskStats> {
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
      const result = await this.pool.query(query);
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
      logger.error('获取任务统计失败', error, { module: 'postgres-store' });
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

  // 创建任务
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task | null> {
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
      const result = await this.pool.query(query, [
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

      return this.mapRowToTask(result.rows[0]);
    } catch (error) {
      logger.error('创建任务失败', error, { module: 'postgres-store' });
      return null;
    }
  }

  // 更新任务
  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    // 构建动态更新字段
    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex}`);
      values.push(updates.title);
      paramIndex++;
    }

    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex}`);
      values.push(updates.description);
      paramIndex++;
    }

    if (updates.priority !== undefined) {
      fields.push(`priority = $${paramIndex}`);
      values.push(updates.priority);
      paramIndex++;
    }

    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex}`);
      values.push(updates.status);
      paramIndex++;
    }

    if (updates.dueDate !== undefined) {
      fields.push(`due_date = $${paramIndex}`);
      values.push(updates.dueDate);
      paramIndex++;
    }

    if (updates.assignedTo !== undefined) {
      fields.push(`assigned_to = $${paramIndex}`);
      values.push(updates.assignedTo);
      paramIndex++;
    }

    if (updates.tags !== undefined) {
      fields.push(`tags = $${paramIndex}`);
      values.push(JSON.stringify(updates.tags));
      paramIndex++;
    }

    // 总是更新updated_at
    fields.push(`updated_at = $${paramIndex}`);
    values.push(new Date().toISOString());
    paramIndex++;

    if (fields.length === 0) {
      return null;
    }

    values.push(id);

    const query = `
      UPDATE tasks 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }
      return this.mapRowToTask(result.rows[0]);
    } catch (error) {
      logger.error('更新任务失败', error, { module: 'postgres-store' });
      return null;
    }
  }

  // 删除任务
  async deleteTask(id: string): Promise<boolean> {
    const query = 'DELETE FROM tasks WHERE id = $1';
    
    try {
      const result = await this.pool.query(query, [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      logger.error('删除任务失败', error, { module: 'postgres-store' });
      return false;
    }
  }

  // 映射数据库行到Task对象
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToTask(row: Record<string, any>): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      source: row.source || 'manual',
      type: 'general', // 默认类型，可根据需要扩展
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      dueDate: row.due_date,
      assignedTo: row.assigned_to,
      tags: row.tags || [],
      metadata: {}
    };
  }

  // 关闭连接池
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// 导出单例实例
export const postgresStore = new PostgresStore();
