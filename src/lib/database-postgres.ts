/**
 * PostgreSQL 数据库兼容模块
 * 临时替代原来的 SQLite 数据库模块
 */

import { Pool } from 'pg';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// PostgreSQL 连接池
let pool: Pool | null = null;

export interface DatabaseConnection {
  query: (sql: string, params?: any[]) => Promise<any>;
  close: () => Promise<void>;
}

export async function getDatabaseConnection(dbPath?: string): Promise<DatabaseConnection> {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL!;
    
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }

  return {
    query: async (sql: string, params?: any[]) => {
      try {
        const result = await pool!.query(sql, params);
        return { rows: result.rows, changes: result.rowCount };
      } catch (error) {
        console.error('PostgreSQL查询错误:', error);
        throw error;
      }
    },
    close: async () => {
      if (pool) {
        await pool.end();
        pool = null;
      }
    }
  };
}

// 兼容性函数
export async function backupDatabase(sourcePath: string, backupPath: string): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn('⚠️  DATABASE_URL 未设置，跳过备份');
    return;
  }

  // 确保备份目录存在
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = backupPath.endsWith('.sql')
    ? backupPath
    : path.join(backupDir, `backup-${timestamp}.sql`);

  console.log(`📋 开始 pg_dump 备份 -> ${outFile}`);
  execSync(`pg_dump "${dbUrl}" -f "${outFile}" --no-password`, {
    stdio: 'pipe',
    timeout: 60000,
  });
  console.log(`✅ 备份完成: ${outFile}`);
}

export function getDatabaseStats() {
  return {
    type: 'postgresql',
    connected: pool !== null,
    timestamp: new Date().toISOString()
  };
}
