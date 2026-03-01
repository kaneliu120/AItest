-- PostgreSQL表结构 (从SQLite转换)
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(255) PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_to VARCHAR(255),
  tags JSONB DEFAULT '[]'::jsonb,
  source VARCHAR(50) NOT NULL DEFAULT 'manual'
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_task_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_task_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_task_due_date ON tasks(due_date);

-- 添加注释
COMMENT ON TABLE tasks IS '任务管理表';
COMMENT ON COLUMN tasks.id IS '任务ID';
COMMENT ON COLUMN tasks.title IS '任务标题';
COMMENT ON COLUMN tasks.description IS '任务描述';
COMMENT ON COLUMN tasks.priority IS '优先级: low, medium, high, critical';
COMMENT ON COLUMN tasks.status IS '状态: pending, in-progress, completed, cancelled';
COMMENT ON COLUMN tasks.created_at IS '创建时间';
COMMENT ON COLUMN tasks.updated_at IS '更新时间';
COMMENT ON COLUMN tasks.due_date IS '截止日期';
COMMENT ON COLUMN tasks.assigned_to IS '分配给';
COMMENT ON COLUMN tasks.tags IS '标签数组';
COMMENT ON COLUMN tasks.source IS '任务来源: manual, ai, module, workflow, booking';
