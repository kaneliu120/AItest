BEGIN;

-- Level 1 goals
INSERT INTO mission_tasks (id, parent_id, level, title, description, category)
VALUES
('goal-1', NULL, 1, 'AI智能体菲律宾市场的个人和企业安装和部署业务', '', 'business'),
('goal-2', NULL, 1, 'MySkillStore交易平台的开发与运营', '', 'product'),
('goal-3', NULL, 1, '寻找商业与机构投资', '', 'investment'),
('goal-4', NULL, 1, '求职', '', 'career'),
('goal-5', NULL, 1, 'AI系统和功能进化', '', 'system'),
('goal-6', NULL, 1, '外包平台接单任务', '', 'outsourcing')
ON CONFLICT (id) DO NOTHING;

-- Level 2 tasks
INSERT INTO mission_tasks (id, parent_id, level, title, description, category)
VALUES
('goal-1-1', 'goal-1', 2, '个人服务', '第三级任务为具体个人安装任务', 'business'),
('goal-1-2', 'goal-1', 2, '企业服务', '', 'business'),

('goal-2-1', 'goal-2', 2, '交易平台目前进度', '', 'product'),
('goal-2-2', 'goal-2', 2, '交易平台运营计划', '', 'product'),

('goal-3-1', 'goal-3', 2, '商业公司', '', 'investment'),
('goal-3-2', 'goal-3', 2, '风险投资和基金', '', 'investment'),
('goal-3-3', 'goal-3', 2, '政府/个人/NGO等非营利组织', '', 'investment'),

('goal-4-1', 'goal-4', 2, '产品岗位', '', 'career'),
('goal-4-2', 'goal-4', 2, '技术开发岗位', '', 'career'),
('goal-4-3', 'goal-4', 2, 'AI工作岗位', '', 'career'),

('goal-5-1', 'goal-5', 2, 'Mission Control 优化', '', 'system'),
('goal-5-2', 'goal-5', 2, '知识管理系统优化', '', 'system'),
('goal-5-3', 'goal-5', 2, 'MCP管理安装', '', 'system'),
('goal-5-4', 'goal-5', 2, '技能管理和安装', '', 'system'),

('goal-6-1', 'goal-6', 2, 'Reddit', '', 'outsourcing'),
('goal-6-2', 'goal-6', 2, 'Upwork', '', 'outsourcing'),
('goal-6-3', 'goal-6', 2, 'Arbeitnow', '', 'outsourcing'),
('goal-6-4', 'goal-6', 2, 'HackerNews', '', 'outsourcing'),
('goal-6-5', 'goal-6', 2, 'Himalayas', '', 'outsourcing'),
('goal-6-6', 'goal-6', 2, 'Jobicy', '', 'outsourcing'),
('goal-6-7', 'goal-6', 2, 'RemoteOK', '', 'outsourcing'),
('goal-6-8', 'goal-6', 2, 'Remotive', '', 'outsourcing'),
('goal-6-9', 'goal-6', 2, 'WeWorkRemotely', '', 'outsourcing'),
('goal-6-10', 'goal-6', 2, 'WorkingNomads', '', 'outsourcing')
ON CONFLICT (id) DO NOTHING;

COMMIT;
