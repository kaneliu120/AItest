/**
 * data库Module - PostgreSQL 兼容Version
 * 替代原来's better-sqlite3 Version
 */

export { 
  getDatabaseConnection, 
  backupDatabase, 
  getDatabaseStats,
  type DatabaseConnection 
} from './database-postgres';

// 兼容性Export
export const Database = {
  // null实现, 仅用于兼容
};
