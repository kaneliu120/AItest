BEGIN;

ALTER TABLE mission_tasks ADD COLUMN IF NOT EXISTS workflow_stage TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE mission_tasks ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ NULL;
ALTER TABLE mission_tasks ADD COLUMN IF NOT EXISTS outsourced_at TIMESTAMPTZ NULL;
ALTER TABLE mission_tasks ADD COLUMN IF NOT EXISTS analysis_doc_url TEXT NULL;
ALTER TABLE mission_tasks ADD COLUMN IF NOT EXISTS automated_at TIMESTAMPTZ NULL;
ALTER TABLE mission_tasks ADD COLUMN IF NOT EXISTS tested_at TIMESTAMPTZ NULL;
ALTER TABLE mission_tasks ADD COLUMN IF NOT EXISTS deployed_at TIMESTAMPTZ NULL;
ALTER TABLE mission_tasks ADD COLUMN IF NOT EXISTS invoiced_at TIMESTAMPTZ NULL;

CREATE TABLE IF NOT EXISTS mission_task_events (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES mission_tasks(id) ON DELETE CASCADE,
  from_stage TEXT NULL,
  to_stage TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor TEXT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mte_task ON mission_task_events(task_id, created_at DESC);

COMMIT;
