import { NextRequest, NextResponse } from 'next/server';
import pool from '@/shared/db/client';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rs = await pool.query(
      `SELECT id, tx_date, amount, category, description, tx_type, currency, status, task_id, created_at
       FROM finance_transactions
       WHERE task_id=$1 AND category='Task Payment'
       ORDER BY created_at DESC
       LIMIT 1`,
      [id]
    );
    return NextResponse.json({ success: true, data: rs.rows[0] || null });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
