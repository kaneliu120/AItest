BEGIN;
CREATE TABLE IF NOT EXISTS mission_alert_state (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_alert_state_task_type ON mission_alert_state(task_id, alert_type);
COMMIT;
