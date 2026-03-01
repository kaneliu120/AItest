BEGIN;

CREATE TABLE IF NOT EXISTS mission_tasks (
  id TEXT PRIMARY KEY,
  parent_id TEXT NULL REFERENCES mission_tasks(id) ON DELETE CASCADE,
  level SMALLINT NOT NULL CHECK (level IN (1,2,3)),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in-progress','completed','cancelled')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  target_price NUMERIC(14,2) NULL,
  currency TEXT NOT NULL DEFAULT 'PHP',
  owner TEXT NULL,
  category TEXT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mission_tasks_parent ON mission_tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_mission_tasks_level ON mission_tasks(level);
CREATE INDEX IF NOT EXISTS idx_mission_tasks_status ON mission_tasks(status);

CREATE TABLE IF NOT EXISTS mission_task_resources (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES mission_tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'file',
  url TEXT NULL,
  file_path TEXT NULL,
  mime_type TEXT NULL,
  file_size BIGINT NULL,
  notes TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mission_resources_task ON mission_task_resources(task_id);

COMMIT;
