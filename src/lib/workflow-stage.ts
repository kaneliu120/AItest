import pool from '@/shared/db/client';
import { logger } from '@/lib/logger';

import type { WorkflowStage as Stage } from '@/lib/workflow-constants';

const transitions: Record<Stage, Stage[]> = {
  draft: ['accepted'],
  accepted: ['outsource_confirmed'],
  outsource_confirmed: ['analysis_done'],
  analysis_done: ['automation_done'],
  automation_done: ['test_passed', 'test_failed'],
  test_failed: ['troubleshooting'],
  troubleshooting: ['test_passed', 'test_failed'],
  test_passed: ['deploy_ready'],
  deploy_ready: ['deployed'],
  deployed: ['invoiced'],
  invoiced: ['closed'],
  closed: [],
};

export async function getStage(taskId: string): Promise<Stage | null> {
  const rs = await pool.query('SELECT workflow_stage FROM mission_tasks WHERE id=$1 LIMIT 1', [taskId]);
  return (rs.rows[0]?.workflow_stage as Stage) || null;
}

export function canMove(from: Stage, to: Stage): boolean {
  return (transitions[from] || []).includes(to);
}

/**
 * Saga 补偿Interface: 每 副作用须提供 compensate(), 
 * in事务Rollback后撤销不可Rollback'sExternal操作(如发邮件, 调External APIs). 
 * 纯data库副作用None需Register补偿(already由事务自动Rollback). 
 */
interface SideEffect {
  description: string;
  compensate: () => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runPostStageActions(client: any, taskId: string, to: Stage): Promise<SideEffect[]> {
  const sideEffects: SideEffect[] = [];

  // analysis_done 自动Trigger"Test计划Draft"(纯 DB, 事务自动Rollback, None需补偿)
  if (to === 'analysis_done') {
    const t = await client.query('SELECT id, level, title FROM mission_tasks WHERE id=$1 LIMIT 1', [taskId]);
    const row = t.rows[0];
    if (!row) return sideEffects;
    const nextLevel = Math.min(3, Number(row.level || 1) + 1);
    const autoTitle = `Test计划Draft - ${row.title}`;

    const exists = await client.query(
      `SELECT 1 FROM mission_tasks
       WHERE parent_id=$1 AND title=$2 AND source='auto-trigger'
       LIMIT 1`,
      [taskId, autoTitle]
    );

    if ((exists.rowCount || 0) === 0) {
      const nid = `mt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await client.query(
        `INSERT INTO mission_tasks
          (id, parent_id, level, title, description, status, progress, currency, source, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          nid,
          taskId,
          nextLevel,
          autoTitle,
          '由ProcessTrigger器自动Generate, 请补充Test范围, 用例, acceptancestandard. ',
          'pending',
          0,
          'PHP',
          'auto-trigger',
          JSON.stringify({ trigger: 'analysis_done' }),
        ]
      );
    }
  }

  // 未来extend: in此 push External副作用, and提供for应 compensate()
  // e.g.: sideEffects.push({ description: 'SendNotification邮件', compensate: () => cancelEmail(emailId) });

  return sideEffects;
}

export async function moveStage(taskId: string, to: Stage, eventType: string, actor?: string, payload?: Record<string, unknown>) {
  const client = await pool.connect();
  const committedSideEffects: SideEffect[] = [];
  try {
    await client.query('BEGIN');
    const rs = await client.query('SELECT workflow_stage FROM mission_tasks WHERE id=$1 LIMIT 1 FOR UPDATE', [taskId]);
    if (!rs.rows[0]) throw new Error('Taskdoes not exist');
    const from = rs.rows[0].workflow_stage as Stage;
    if (!canMove(from, to)) throw new Error(`非法Statusmigration: ${from} -> ${to}`);

    const tsCols: Record<Stage, string | null> = {
      draft: null,
      accepted: 'accepted_at',
      outsource_confirmed: 'outsourced_at',
      analysis_done: null,
      automation_done: 'automated_at',
      test_passed: 'tested_at',
      test_failed: 'tested_at',
      troubleshooting: null,
      deploy_ready: null,
      deployed: 'deployed_at',
      invoiced: 'invoiced_at',
      closed: null,
    };

    const col = tsCols[to];
    if (col) {
      await client.query(`UPDATE mission_tasks SET workflow_stage=$1, ${col}=now(), updated_at=now() WHERE id=$2`, [to, taskId]);
    } else {
      await client.query('UPDATE mission_tasks SET workflow_stage=$1, updated_at=now() WHERE id=$2', [to, taskId]);
    }

    const eid = `mte-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    await client.query(
      `INSERT INTO mission_task_events (id,task_id,from_stage,to_stage,event_type,actor,payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [eid, taskId, from, to, eventType, actor || null, JSON.stringify(payload || {})]
    );

    const effects = await runPostStageActions(client, taskId, to);
    committedSideEffects.push(...effects);

    await client.query('COMMIT');
    return { from, to, eventId: eid };
  } catch (e) {
    await client.query('ROLLBACK');

    // Saga 补偿: 撤销already发生's不可逆External副作用
    for (const effect of committedSideEffects) {
      try {
        await effect.compensate();
      } catch (compErr) {
        logger.error(`[workflow-stage] 补偿failed: ${effect.description}`, compErr, { taskId, to });
      }
    }

    throw e;
  } finally {
    client.release();
  }
}

export async function setAnalysisDoc(taskId: string, url: string) {
  await pool.query('UPDATE mission_tasks SET analysis_doc_url=$1, updated_at=now() WHERE id=$2', [url, taskId]);
}
