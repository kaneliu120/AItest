import { NextRequest, NextResponse } from 'next/server';
import pool from '@/shared/db/client';
import type { WorkflowStage } from '@/lib/workflow-constants';


export async function GET(request: NextRequest) {
  try {
    const thresholdHours = Number(request.nextUrl.searchParams.get('hours') || 24);

    const rs = await pool.query(
      `SELECT id, title, workflow_stage, updated_at, tested_at, deployed_at, invoiced_at
       FROM mission_tasks`
    );

    const now = Date.now();
    const alerts: Array<{ level: 'warning'|'critical'; type: string; taskId: string; title: string; message: string }> = [];

    for (const t of rs.rows as any[]) {
      const stage = ((t.workflow_stage || 'draft') as WorkflowStage);
      const updatedAt = new Date(t.updated_at || 0).getTime();
      const idleHours = updatedAt ? (now - updatedAt) / 36e5 : 0;

      const stalledStages: WorkflowStage[] = ['accepted','outsource_confirmed','analysis_done','automation_done','troubleshooting','deploy_ready'];
      if (stalledStages.includes(stage) && idleHours >= thresholdHours) {
        alerts.push({
          level: 'warning',
          type: 'stalled',
          taskId: t.id,
          title: t.title,
          message: `Stage ${stage} has been stalled for ${Math.floor(idleHours)}h`,
        });
      }

      if (stage === 'test_failed') {
        alerts.push({
          level: 'critical',
          type: 'test_failed',
          taskId: t.id,
          title: t.title,
          message: 'Test failed, enter troubleshooting process immediately',
        });
      }

      if (stage === 'deployed' && !t.invoiced_at) {
        alerts.push({
          level: 'warning',
          type: 'pending_invoice',
          taskId: t.id,
          title: t.title,
          message: 'Published but not invoiced — please run the finance process',
        });
      }
    }

    const summary = {
      total: alerts.length,
      critical: alerts.filter(a => a.level === 'critical').length,
      warning: alerts.filter(a => a.level === 'warning').length,
    };

    return NextResponse.json({ success: true, data: { summary, alerts } });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
