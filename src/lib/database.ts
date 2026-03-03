/**
 * 数据库模块 - PostgreSQL 兼容版本
 * 替代原来的 better-sqlite3 版本
 */

export { 
  getDatabaseConnection, 
  backupDatabase, 
  getDatabaseStats,
  type DatabaseConnection 
} from './database-postgres';

// 兼容性导出
export const Database = {
  // 空实现，仅用于兼容
};
