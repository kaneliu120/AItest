import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 监听Connect池error, 防止未Process's rejection 崩溃进程
pool.on('error', (err) => {
  console.error('[db/client] Connect池null闲client端发生error:', err.message);
});

// Connect建立时Log(仅dev environment)
if (process.env.NODE_ENV !== 'production') {
  pool.on('connect', () => {
    console.log('[db/client] Newdata库Connectalready建立');
  });
}

export default pool;
