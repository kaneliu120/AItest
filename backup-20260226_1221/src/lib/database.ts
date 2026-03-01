/**
 * 数据库持久化层
 * 使用SQLite进行数据存储
 */

import { Database } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 数据库接口
export interface DatabaseConfig {
  path: string;
  readonly?: boolean;
  memory?: boolean;
  verbose?: boolean;
}

// 表结构定义
export interface TableSchema {
  name: string;
  columns: Array<{
    name: string;
    type: 'TEXT' | 'INTEGER' | 'REAL' | 'BLOB' | 'BOOLEAN';
    primaryKey?: boolean;
    autoIncrement?: boolean;
    notNull?: boolean;
    unique?: boolean;
    defaultValue?: any;
  }>;
  indexes?: Array<{
    name: string;
    columns: string[];
    unique?: boolean;
  }>;
}

// 数据库管理器
export class DatabaseManager {
  private db: Database | null = null;
  private config: DatabaseConfig;
  private isInitialized = false;

  constructor(config?: Partial<DatabaseConfig>) {
    this.config = {
      path: config?.path || path.join(process.cwd(), 'data', 'mission-control.db'),
      readonly: config?.readonly || false,
      memory: config?.memory || false,
      verbose: config?.verbose || process.env.NODE_ENV === 'development',
    };

    // 确保数据目录存在
    const dataDir = path.dirname(this.config.path);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 动态导入better-sqlite3
      const { default: BetterSqlite3 } = await import('better-sqlite3');
      
      // 打开数据库连接
      this.db = new BetterSqlite3(
        this.config.memory ? ':memory:' : this.config.path,
        {
          readonly: this.config.readonly,
          verbose: this.config.verbose ? console.log : undefined,
        }
      );

      // 启用外键约束
      this.db.pragma('foreign_keys = ON');
      
      // 启用WAL模式提高并发性能
      this.db.pragma('journal_mode = WAL');
      
      // 设置缓存大小
      this.db.pragma('cache_size = -2000'); // 2MB缓存

      this.isInitialized = true;
      console.log(`数据库已初始化: ${this.config.path}`);
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建表
   */
  createTable(schema: TableSchema): void {
    if (!this.db) throw new Error('数据库未初始化');

    const columns = schema.columns.map(col => {
      let definition = `${col.name} ${col.type}`;
      
      if (col.primaryKey) definition += ' PRIMARY KEY';
      if (col.autoIncrement) definition += ' AUTOINCREMENT';
      if (col.notNull) definition += ' NOT NULL';
      if (col.unique) definition += ' UNIQUE';
      if (col.defaultValue !== undefined) {
        const defaultValue = typeof col.defaultValue === 'string' 
          ? `'${col.defaultValue}'`
          : col.defaultValue;
        definition += ` DEFAULT ${defaultValue}`;
      }
      
      return definition;
    }).join(', ');

    const sql = `CREATE TABLE IF NOT EXISTS ${schema.name} (${columns})`;
    this.db.exec(sql);

    // 创建索引
    if (schema.indexes) {
      schema.indexes.forEach(index => {
        const unique = index.unique ? 'UNIQUE' : '';
        const columns = index.columns.join(', ');
        const sql = `CREATE ${unique} INDEX IF NOT EXISTS ${index.name} ON ${schema.name} (${columns})`;
        this.db!.exec(sql);
      });
    }
  }

  /**
   * 插入数据
   */
  insert<T extends Record<string, any>>(table: string, data: T): number {
    if (!this.db) throw new Error('数据库未初始化');

    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);

    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    const stmt = this.db.prepare(sql);
    
    const result = stmt.run(...values);
    return result.lastInsertRowid as number;
  }

  /**
   * 批量插入
   */
  batchInsert<T extends Record<string, any>>(table: string, data: T[]): void {
    if (!this.db) throw new Error('数据库未初始化');
    if (data.length === 0) return;

    const columns = Object.keys(data[0]).join(', ');
    const placeholders = Object.keys(data[0]).map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    
    const stmt = this.db.prepare(sql);
    const transaction = this.db.transaction((items: T[]) => {
      for (const item of items) {
        stmt.run(...Object.values(item));
      }
    });

    transaction(data);
  }

  /**
   * 查询数据
   */
  query<T = any>(table: string, where?: Record<string, any>, options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
    select?: string[];
  }): T[] {
    if (!this.db) throw new Error('数据库未初始化');

    const select = options?.select?.join(', ') || '*';
    let sql = `SELECT ${select} FROM ${table}`;
    const values: any[] = [];

    if (where && Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map(key => {
        values.push(where[key]);
        return `${key} = ?`;
      }).join(' AND ');
      sql += ` WHERE ${conditions}`;
    }

    if (options?.orderBy) {
      const direction = options.orderDirection || 'ASC';
      sql += ` ORDER BY ${options.orderBy} ${direction}`;
    }

    if (options?.limit) {
      sql += ` LIMIT ${options.limit}`;
      if (options.offset) {
        sql += ` OFFSET ${options.offset}`;
      }
    }

    const stmt = this.db.prepare(sql);
    return stmt.all(...values) as T[];
  }

  /**
   * 更新数据
   */
  update(table: string, data: Record<string, any>, where: Record<string, any>): number {
    if (!this.db) throw new Error('数据库未初始化');

    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    
    const values = [...Object.values(data), ...Object.values(where)];
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...values);
    return result.changes;
  }

  /**
   * 删除数据
   */
  delete(table: string, where: Record<string, any>): number {
    if (!this.db) throw new Error('数据库未初始化');

    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    const values = Object.values(where);
    
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...values);
    return result.changes;
  }

  /**
   * 执行原始SQL
   */
  exec(sql: string): void {
    if (!this.db) throw new Error('数据库未初始化');
    this.db.exec(sql);
  }

  /**
   * 准备语句
   */
  prepare(sql: string): any {
    if (!this.db) throw new Error('数据库未初始化');
    return this.db.prepare(sql);
  }

  /**
   * 开始事务
   */
  transaction<T>(fn: () => T): T {
    if (!this.db) throw new Error('数据库未初始化');
    return this.db.transaction(fn)();
  }

  /**
   * 备份数据库
   */
  backup(backupPath: string): void {
    if (!this.db) throw new Error('数据库未初始化');
    
    const backupDb = new (require('better-sqlite3'))(backupPath);
    this.db.backup(backupDb);
    backupDb.close();
    
    console.log(`数据库已备份到: ${backupPath}`);
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log('数据库连接已关闭');
    }
  }

  /**
   * 获取数据库统计信息
   */
  getStats(): Record<string, any> {
    if (!this.db) throw new Error('数据库未初始化');

    const tables = this.query<{ name: string }>('sqlite_master', { type: 'table' })
      .map(row => row.name)
      .filter(name => !name.startsWith('sqlite_'));

    const stats: Record<string, any> = {
      path: this.config.path,
      tables: {},
      totalSize: 0,
    };

    tables.forEach(table => {
      const count = this.query(table, {}, { select: ['COUNT(*) as count'] })[0]?.count || 0;
      stats.tables[table] = { count };
    });

    // 获取数据库文件大小
    try {
      const fileStats = fs.statSync(this.config.path);
      stats.totalSize = fileStats.size;
      stats.lastModified = fileStats.mtime;
    } catch (error) {
      // 忽略文件大小获取错误
    }

    return stats;
  }
}

// 预定义的表结构
export const TABLE_SCHEMAS: Record<string, TableSchema> = {
  transactions: {
    name: 'transactions',
    columns: [
      { name: 'id', type: 'TEXT', primaryKey: true },
      { name: 'date', type: 'TEXT', notNull: true },
      { name: 'type', type: 'TEXT', notNull: true }, // 'income' or 'expense'
      { name: 'category', type: 'TEXT', notNull: true },
      { name: 'description', type: 'TEXT', notNull: true },
      { name: 'amount', type: 'REAL', notNull: true },
      { name: 'currency', type: 'TEXT', notNull: true, defaultValue: 'PHP' },
      { name: 'status', type: 'TEXT', defaultValue: 'completed' },
      { name: 'tags', type: 'TEXT', defaultValue: '[]' },
      { name: 'created_at', type: 'TEXT', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'TEXT', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
    ],
    indexes: [
      { name: 'idx_transactions_date', columns: ['date'] },
      { name: 'idx_transactions_type', columns: ['type'] },
      { name: 'idx_transactions_category', columns: ['category'] },
      { name: 'idx_transactions_status', columns: ['status'] },
    ],
  },
  
  budgets: {
    name: 'budgets',
    columns: [
      { name: 'id', type: 'TEXT', primaryKey: true },
      { name: 'name', type: 'TEXT', notNull: true },
      { name: 'category', type: 'TEXT', notNull: true },
      { name: 'allocated', type: 'REAL', notNull: true },
      { name: 'spent', type: 'REAL', defaultValue: 0 },
      { name: 'remaining', type: 'REAL', defaultValue: 0 },
      { name: 'period', type: 'TEXT', notNull: true }, // 'monthly', 'quarterly', 'yearly'
      { name: 'status', type: 'TEXT', defaultValue: 'on-track' },
      { name: 'created_at', type: 'TEXT', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'TEXT', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
    ],
    indexes: [
      { name: 'idx_budgets_category', columns: ['category'] },
      { name: 'idx_budgets_period', columns: ['period'] },
      { name: 'idx_budgets_status', columns: ['status'] },
    ],
  },
  
  users: {
    name: 'users',
    columns: [
      { name: 'id', type: 'TEXT', primaryKey: true },
      { name: 'username', type: 'TEXT', notNull: true, unique: true },
      { name: 'email', type: 'TEXT', notNull: true, unique: true },
      { name: 'password_hash', type: 'TEXT', notNull: true },
      { name: 'role', type: 'TEXT', defaultValue: 'user' },
      { name: 'status', type: 'TEXT', defaultValue: 'active' },
      { name: 'created_at', type: 'TEXT', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'TEXT', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
    ],
    indexes: [
      { name: 'idx_users_username', columns: ['username'] },
      { name: 'idx_users_email', columns: ['email'] },
      { name: 'idx_users_status', columns: ['status'] },
    ],
  },
  
  tasks: {
    name: 'tasks',
    columns: [
      { name: 'id', type: 'TEXT', primaryKey: true },
      { name: 'title', type: 'TEXT', notNull: true },
      { name: 'description', type: 'TEXT' },
      { name: 'status', type: 'TEXT', defaultValue: 'pending' },
      { name: 'priority', type: 'TEXT', defaultValue: 'medium' },
      { name: 'due_date', type: 'TEXT' },
      { name: 'assigned_to', type: 'TEXT' },
      { name: 'created_by', type: 'TEXT', notNull: true },
      { name: 'created_at', type: 'TEXT', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'TEXT', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
    ],
    indexes: [
      { name: 'idx_tasks_status', columns: ['status'] },
      { name: 'idx_tasks_priority', columns: ['priority'] },
      { name: 'idx_tasks_due_date', columns: ['due_date'] },
      { name: 'idx_tasks_assigned_to', columns: ['assigned_to'] },
    ],
  },
  
  system_logs: {
    name: 'system_logs',
    columns: [
      { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
      { name: 'level', type: 'TEXT', notNull: true }, // 'info', 'warning', 'error'
      { name: 'message', type: 'TEXT', notNull: true },
      { name: 'source', type: 'TEXT' },
      { name: 'metadata', type: 'TEXT', defaultValue: '{}' },
      { name: 'created_at', type: 'TEXT', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
    ],
    indexes: [
      { name: 'idx_system_logs_level', columns: ['level'] },
      { name: 'idx_system_logs_source', columns: ['source'] },
      { name: 'idx_system_logs_created_at', columns: ['created_at'] },
    ],
  },
};

// 全局数据库实例
let globalDb: DatabaseManager | null = null;

/**
 * 获取全局数据库实例
 */
export function getDatabase(): DatabaseManager {
  if (!globalDb) {
    globalDb = new DatabaseManager();
  }
  return globalDb;
}

/**
 * 初始化数据库
 */
export async function initializeDatabase(): Promise<void> {
  const db = getDatabase();
  await db.initialize();
  
  // 创建所有表
  Object.values(TABLE_SCHEMAS).forEach(schema => {
    db.createTable(schema);
  });
  
  console.log('数据库表结构已初始化');
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
  if (globalDb) {
    globalDb.close();
    globalDb = null;
  }
}

// 数据库工具函数
const databaseUtils = {
  /**
   * 安全JSON序列化
   */
  serializeJson(data: any): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('JSON序列化失败:', error);
      return '{}';
    }
  },
  
  /**
   * 安全JSON反序列化
   */
  parseJson<T = any>(json: string, defaultValue: T): T {
    try {
      return JSON.parse(json);
    } catch (error) {
      console.error('JSON反序列化失败:', error);
      return defaultValue;
    }
  },
  
  /**
   * 生成UUID
   */
  generateId(): string {
    return crypto.randomUUID();
  },
  
  /**
   * 获取当前时间戳
   */
  getTimestamp(): string {
    return new Date().toISOString();
  },
};

// 导出数据库工具
export const dbUtils = databaseUtils;
