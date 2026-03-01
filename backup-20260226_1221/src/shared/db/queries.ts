import pool from './client';

export async function getTools() {
  const query = `
    SELECT * FROM tools
    WHERE status = $1
    ORDER BY name ASC
    LIMIT $2 OFFSET $3
  `;
  const { rows } = await pool.query(query, ['active', 100, 0]);
  return rows;
}