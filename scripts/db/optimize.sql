-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_name ON tools(name);

-- 分析表
ANALYZE tools;

-- 清理无用数据
DELETE FROM tools WHERE status = 'deprecated';