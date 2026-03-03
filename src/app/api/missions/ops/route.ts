import { NextResponse } from 'next/server';
import pool from '@/shared/db/client';
import type { WorkflowStage } from '@/lib/workflow-constants';


export async function GET() {
  try {
    const tasks = await pool.query(`SELECT id,parent_id,level,title,workflow_stage,target_price FROM mission_tasks ORDER BY created_at DESC`);
    const tx = await pool.query(`SELECT task_id, amount, status, category FROM finance_transactions WHERE category='Task Payment'`);

    const rows = tasks.rows as Array<any>;
    const goals = rows.filter(r => r.level === 1);
    const byParent = new Map<string, any[]>();
    rows.forEach(r => {
      const p = r.parent_id || '__root__';
      byParent.set(p, [...(byParent.get(p) || []), r]);
    });

    const collectDesc = (id: string): any[] => {
      const c = byParent.get(id) || [];
      return c.flatMap((n: any) => [n, ...collectDesc(n.id)]);
    };

    const txByTask = new Map<string, any[]>();
    (tx.rows as any[]).forEach(t => txByTask.set(t.task_id, [...(txByTask.get(t.task_id) || []), t]));

    const goalMetrics = goals.map(g => {
      const desc = collectDesc(g.id);
      const all = [g, ...desc];
      const budget = all.reduce((s, x) => s + Number(x.target_price || 0), 0);
      const relatedTx = all.flatMap(x => txByTask.get(x.id) || []);
      const invoiced = relatedTx.filter(t => t.status !== 'pending').reduce((s, t) => s + Number(t.amount || 0), 0);
      const pending = relatedTx.filter(t => t.status === 'pending').reduce((s, t) => s + Number(t.amount || 0), 0);
      const roi = budget > 0 ? Math.round((invoiced / budget) * 100) : 0;
      const stageDist: Partial<Record<WorkflowStage, number>> = {};
      all.forEach(x => {
        const s = (x.workflow_stage || 'draft') as WorkflowStage;
        stageDist[s] = (stageDist[s] || 0) + 1;
      });
      return { id: g.id, title: g.title, budget, invoiced, pending, roi, stageDist };
    });

    const totals = goalMetrics.reduce((acc, g) => ({
      budget: acc.budget + g.budget,
      invoiced: acc.invoiced + g.invoiced,
      pending: acc.pending + g.pending,
    }), { budget: 0, invoiced: 0, pending: 0 });

    return NextResponse.json({ success: true, data: { totals, goalMetrics } });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
