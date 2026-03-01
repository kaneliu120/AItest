import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 监听连接池错误，防止未处理的 rejection 崩溃进程
pool.on('error', (err) => {
  console.error('[db/client] 连接池空闲客户端发生错误:', err.message);
});

// 连接建立时记录（仅开发环境）
if (process.env.NODE_ENV !== 'production') {
  pool.on('connect', () => {
    console.log('[db/client] 新数据库连接已建立');
  });
}

export default pool;
