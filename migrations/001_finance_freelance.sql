-- 001_finance_freelance.sql
-- Purpose: create PostgreSQL persistence tables for finance + freelance modules

BEGIN;

CREATE TABLE IF NOT EXISTS finance_transactions (
  id TEXT PRIMARY KEY,
  tx_date DATE NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT '其他',
  description TEXT NOT NULL,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('income','expense')),
  currency TEXT NOT NULL DEFAULT 'PHP',
  status TEXT NOT NULL DEFAULT 'completed',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  task_id TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_tx_date ON finance_transactions(tx_date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_task_id ON finance_transactions(task_id);

CREATE TABLE IF NOT EXISTS freelance_projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  source TEXT NOT NULL DEFAULT 'manual',
  business_source TEXT NOT NULL DEFAULT '',
  client_id TEXT NULL,
  client_name TEXT NULL,
  budget NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PHP',
  deadline DATE NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT '其他',
  automation_status TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_freelance_status ON freelance_projects(status);

CREATE TABLE IF NOT EXISTS freelance_clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
