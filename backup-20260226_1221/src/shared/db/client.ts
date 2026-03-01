import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // 优化连接池大小
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;