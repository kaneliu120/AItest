import { NextRequest, NextResponse } from 'next/server';
import { moveStage } from '@/lib/workflow-stage';
import pool from '@/shared/db/client';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // 状态机门禁：仅允许 deployed -> invoiced
    const res = await moveStage(id, 'invoiced', 'invoice', body?.actor, body?.payload);

    // 自动创建财务草稿（避免重复）
    const exists = await pool.query(
      "SELECT 1 FROM finance_transactions WHERE task_id=$1 AND category='Task Payment' LIMIT 1",
      [id]
    );

    if ((exists.rowCount || 0) === 0) {
      const t = await pool.query('SELECT title, target_price, currency FROM mission_tasks WHERE id=$1 LIMIT 1', [id]);
      const title = t.rows[0]?.title || `Task ${id}`;
      const amount = Number(t.rows[0]?.target_price || 0);
      const currency = t.rows[0]?.currency || 'PHP';
      const txId = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      await pool.query(
        `INSERT INTO finance_transactions
          (id, tx_date, amount, category, description, tx_type, currency, status, tags, task_id, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          txId,
          new Date().toISOString().slice(0, 10),
          amount,
          'Task Payment',
          `Invoice Draft: ${title}`,
          'income',
          currency,
          'pending',
          JSON.stringify(['invoice', 'auto']),
          id,
          JSON.stringify({ source: 'workflow-invoice', eventId: res.eventId }),
        ]
      );
    }

    return NextResponse.json({ success: true, data: { ...res, financeDraftCreated: true } });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 400 });
  }
}
