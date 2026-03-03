/**
 * PostgreSQL data库兼容Module
 * temporary替代原来's SQLite data库Module
 */

import { Pool } from 'pg';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// PostgreSQL Connect池
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
        console.error('PostgreSQL查询error:', error);
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

// 兼容性function
export async function backupDatabase(sourcePath: string, backupPath: string): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn('⚠️  DATABASE_URL 未Settings, 跳过Backup');
    return;
  }

  // 确保Backup目录存in
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = backupPath.endsWith('.sql')
    ? backupPath
    : path.join(backupDir, `backup-${timestamp}.sql`);

  console.log(`📋 On始 pg_dump Backup -> ${outFile}`);
  execSync(`pg_dump "${dbUrl}" -f "${outFile}" --no-password`, {
    stdio: 'pipe',
    timeout: 60000,
  });
  console.log(`✅ BackupCompleted: ${outFile}`);
}

export function getDatabaseStats() {
  return {
    type: 'postgresql',
    connected: pool !== null,
    timestamp: new Date().toISOString()
  };
}
