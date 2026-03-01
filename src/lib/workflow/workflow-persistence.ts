import pool from '@/shared/db/client';

export async function persistExecutionStart(params: {
  id: string;
  workflowId: string;
  status: string;
  startedAt: string;
  createdBy?: string;
  metadata?: Record<string, unknown>;
}) {
  await pool.query(
    `INSERT INTO workflow_executions (id, workflow_id, status, started_at, created_by, metadata, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,now())
     ON CONFLICT (id) DO NOTHING`,
    [
      params.id,
      params.workflowId,
      params.status,
      params.startedAt,
      params.createdBy || 'system',
      JSON.stringify(params.metadata || {}),
    ]
  );
}

export async function persistExecutionStatus(params: { id: string; status: string; completedAt?: string }) {
  await pool.query(
    `UPDATE workflow_executions SET status=$1, completed_at=$2, updated_at=now() WHERE id=$3`,
    [params.status, params.completedAt || null, params.id]
  );
}

export async function persistStepEvent(params: {
  executionId: string;
  workflowId: string;
  stepId: string;
  module: string;
  action: string;
  status: 'started' | 'completed' | 'failed';
  durationMs?: number;
  errorMessage?: string;
  payload?: Record<string, unknown>;
  eventAt?: string;
}) {
  const id = `wse-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await pool.query(
    `INSERT INTO workflow_step_events
      (id, execution_id, workflow_id, step_id, module, action, status, duration_ms, error_message, payload, event_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      id,
      params.executionId,
      params.workflowId,
      params.stepId,
      params.module,
      params.action,
      params.status,
      params.durationMs || null,
      params.errorMessage || null,
      JSON.stringify(params.payload || {}),
      params.eventAt || new Date().toISOString(),
    ]
  );
}

export async function queryMetricsWindow(interval: string) {
  const [execRs, stepRs, moduleRs] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE status='running')::int AS running,
              COUNT(*) FILTER (WHERE status='completed')::int AS completed,
              COUNT(*) FILTER (WHERE status='failed')::int AS failed,
              COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000)
                FILTER (WHERE completed_at IS NOT NULL), 0)::float AS avg_ms
         FROM workflow_executions
        WHERE started_at >= now() - $1::interval`,
      [interval]
    ),
    pool.query(
      `SELECT step_id,
              COUNT(*) FILTER (WHERE status='completed')::int AS success,
              COUNT(*) FILTER (WHERE status='failed')::int AS failed
         FROM workflow_step_events
        WHERE event_at >= now() - $1::interval
        GROUP BY step_id`,
      [interval]
    ),
    pool.query(
      `SELECT module,
              COUNT(*) FILTER (WHERE status IN ('started','completed','failed'))::int AS runtime_count,
              COUNT(*) FILTER (WHERE status='failed')::int AS fail_count,
              COALESCE(AVG(duration_ms) FILTER (WHERE duration_ms IS NOT NULL), 0)::float AS avg_duration_ms
         FROM workflow_step_events
        WHERE event_at >= now() - $1::interval
        GROUP BY module`,
      [interval]
    ),
  ]);

  return { execRs, stepRs, moduleRs };
}

export async function queryMetricsTrend(hours = 24) {
  const rs = await pool.query(
    `SELECT date_trunc('hour', started_at) AS bucket,
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status='completed')::int AS completed,
            COUNT(*) FILTER (WHERE status='failed')::int AS failed,
            COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000)
              FILTER (WHERE completed_at IS NOT NULL), 0)::float AS avg_ms
       FROM workflow_executions
      WHERE started_at >= now() - ($1::text || ' hours')::interval
      GROUP BY 1
      ORDER BY 1 ASC`,
    [String(hours)]
  );
  return rs;
}
