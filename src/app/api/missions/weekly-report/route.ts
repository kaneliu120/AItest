import { NextRequest, NextResponse } from 'next/server';
import pool from '@/shared/db/client';

export async function GET(request: NextRequest) {
  try {
    const days = Number(request.nextUrl.searchParams.get('days') || 7);
    const rsTasks = await pool.query(`SELECT id,title,workflow_stage,created_at FROM mission_tasks WHERE created_at >= now() - ($1 || ' days')::interval ORDER BY created_at DESC`, [String(days)]);
    const rsEvents = await pool.query(`SELECT event_type, count(*)::int as c FROM mission_task_events WHERE created_at >= now() - ($1 || ' days')::interval GROUP BY event_type ORDER BY c DESC`, [String(days)]);
    const rsFin = await pool.query(`SELECT COALESCE(sum(amount),0)::numeric as amt FROM finance_transactions WHERE tx_type='income' AND created_at >= now() - ($1 || ' days')::interval`, [String(days)]);

    const lines = [
      `# Mission Control Weekly Report (${days} days)`,
      ``,
      `- New tasks: ${rsTasks.rowCount || 0}`,
      `- Total income: ₱${Number(rsFin.rows[0]?.amt || 0).toLocaleString()}`,
      ``,
      `## Event Statistics`,
      ...((rsEvents.rows as any[]).map(e => `- ${e.event_type}: ${e.c}`)),
      ``,
      `## Recent Tasks`,
      ...((rsTasks.rows as any[]).slice(0, 10).map(t => `- [${t.workflow_stage}] ${t.title} (${new Date(t.created_at).toLocaleString('zh-CN')})`)),
      ``,
    ];

    return NextResponse.json({ success: true, data: { markdown: lines.join('\n') } });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
