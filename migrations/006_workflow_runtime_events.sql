-- 006_workflow_runtime_events.sql
-- 工作流运行时执行与步骤事件持久化表

BEGIN;

CREATE TABLE IF NOT EXISTS workflow_executions (
  id               VARCHAR(64) PRIMARY KEY,
  workflow_id      VARCHAR(128) NOT NULL,
  status           VARCHAR(32) NOT NULL DEFAULT 'running',
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,
  created_by       VARCHAR(128),
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_step_events (
  id               VARCHAR(64) PRIMARY KEY,
  execution_id     VARCHAR(64) NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  workflow_id      VARCHAR(128) NOT NULL,
  step_id          VARCHAR(128) NOT NULL,
  module           VARCHAR(64) NOT NULL,
  action           VARCHAR(128) NOT NULL,
  status           VARCHAR(32) NOT NULL, -- started|completed|failed
  duration_ms      INTEGER,
  error_message    TEXT,
  payload          JSONB NOT NULL DEFAULT '{}'::jsonb,
  event_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_step_events_execution_id ON workflow_step_events(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_events_workflow_id ON workflow_step_events(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_events_module ON workflow_step_events(module);
CREATE INDEX IF NOT EXISTS idx_workflow_step_events_status ON workflow_step_events(status);
CREATE INDEX IF NOT EXISTS idx_workflow_step_events_event_at ON workflow_step_events(event_at DESC);

COMMIT;
