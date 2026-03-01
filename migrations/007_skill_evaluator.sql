BEGIN;

CREATE TABLE IF NOT EXISTS skill_evaluation_runs (
  id              VARCHAR(64) PRIMARY KEY,
  skill_name      VARCHAR(255) NOT NULL,
  skill_path      TEXT NOT NULL,
  status          VARCHAR(32) NOT NULL DEFAULT 'pending',
  error_message   TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_evaluations (
  id              VARCHAR(64) PRIMARY KEY,
  run_id          VARCHAR(64) REFERENCES skill_evaluation_runs(id) ON DELETE SET NULL,
  skill_name      VARCHAR(255) NOT NULL,
  skill_path      TEXT NOT NULL,
  overall_score   INTEGER NOT NULL,
  grade           VARCHAR(8) NOT NULL,
  evaluation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  issues          JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_evaluation_items (
  id              VARCHAR(64) PRIMARY KEY,
  evaluation_id   VARCHAR(64) NOT NULL REFERENCES skill_evaluations(id) ON DELETE CASCADE,
  category_name   VARCHAR(128) NOT NULL,
  score           INTEGER NOT NULL,
  weight          INTEGER NOT NULL,
  details         JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_eval_runs_status ON skill_evaluation_runs(status);
CREATE INDEX IF NOT EXISTS idx_skill_eval_runs_created_at ON skill_evaluation_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_evaluations_skill_name ON skill_evaluations(skill_name);
CREATE INDEX IF NOT EXISTS idx_skill_evaluations_eval_date ON skill_evaluations(evaluation_date DESC);
CREATE INDEX IF NOT EXISTS idx_skill_eval_items_eval_id ON skill_evaluation_items(evaluation_id);

COMMIT;
