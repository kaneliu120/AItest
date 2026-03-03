import { NextRequest, NextResponse } from 'next/server';
import pool from '@/shared/db/client';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rs = await pool.query(
      `SELECT id, task_id, from_stage, to_stage, event_type, actor, payload, created_at
       FROM mission_task_events
       WHERE task_id=$1
       ORDER BY created_at DESC`,
      [id]
    );
    return NextResponse.json({ success: true, data: rs.rows });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '未知错误' }, { status: 500 });
  }
}
