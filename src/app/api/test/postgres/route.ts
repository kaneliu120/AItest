import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET(request: NextRequest) {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL!,
    });

    const result = await pool.query('SELECT COUNT(*) as task_count FROM tasks');
    const taskCount = result.rows[0].task_count;
    
    await pool.end();

    return NextResponse.json({
      success: true,
      message: 'PostgreSQL connection test successful',
      data: {
        taskCount: parseInt(taskCount),
        database: 'postgresql',
        connection: 'healthy',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'PostgreSQL connection failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
