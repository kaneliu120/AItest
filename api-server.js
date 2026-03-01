const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const { randomUUID } = require('crypto');

const app = express();
const port = 3002;

// 中间件
app.use(cors());
app.use(express.json());

// PostgreSQL连接池
if (!process.env.DATABASE_URL) {
  console.error('❌ 缺少必要环境变量 DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mission Control API Server (PostgreSQL)',
    timestamp: new Date().toISOString(),
    database: 'postgresql'
  });
});

// 获取任务统计
app.get('/api/tasks', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'pending' AND due_date < NOW() THEN 1 END) as overdue_tasks
      FROM tasks
    `;

    const result = await pool.query(statsQuery);
    const row = result.rows[0];
    
    const total = parseInt(row.total_tasks) || 0;
    const completed = parseInt(row.completed_tasks) || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalTasks: total,
        pendingTasks: parseInt(row.pending_tasks) || 0,
        inProgressTasks: parseInt(row.in_progress_tasks) || 0,
        completedTasks: completed,
        overdueTasks: parseInt(row.overdue_tasks) || 0,
        completionRate,
        completed,
        total
      },
      database: 'postgresql',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取任务统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取任务数据失败',
      details: error.message
    });
  }
});

// 获取所有任务
app.get('/api/tasks/all', async (req, res) => {
  try {
    const query = `
      SELECT 
        id, title, description, priority, status, 
        created_at as "createdAt", updated_at as "updatedAt",
        due_date as "dueDate", assigned_to as "assignedTo",
        tags, source
      FROM tasks
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);
    const tasks = result.rows.map(row => ({
      ...row,
      tags: row.tags || [],
      source: row.source || 'manual'
    }));

    res.json({
      success: true,
      data: tasks,
      count: tasks.length,
      database: 'postgresql'
    });
  } catch (error) {
    console.error('获取任务列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取任务列表失败',
      details: error.message
    });
  }
});

// 创建任务
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, priority, status, tags } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: '任务标题不能为空'
      });
    }

    const query = `
      INSERT INTO tasks (
        id, title, description, priority, status, 
        created_at, updated_at, tags, source
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING *
    `;

    const id = `task-${randomUUID()}`;
    const now = new Date().toISOString();

    const result = await pool.query(query, [
      id,
      title,
      description || '',
      priority || 'medium',
      status || 'pending',
      now,
      now,
      JSON.stringify(tags || []),
      'manual'
    ]);

    const task = result.rows[0];

    res.json({
      success: true,
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        tags: task.tags || [],
        source: task.source || 'manual'
      },
      message: '任务创建成功'
    });
  } catch (error) {
    console.error('创建任务失败:', error);
    res.status(500).json({
      success: false,
      error: '创建任务失败',
      details: error.message
    });
  }
});

// 模拟财务数据
app.get('/api/finance', (req, res) => {
  res.json({
    success: true,
    data: {
      totalIncome: 75000,
      totalExpense: 15000,
      netIncome: 60000,
      balance: 60000,
      transactions: [
        {
          id: 'tx-1',
          date: '2026-02-25',
          amount: 75000,
          category: '外包收入',
          description: 'AI开发项目',
          type: 'income'
        },
        {
          id: 'tx-2',
          date: '2026-02-24',
          amount: 15000,
          category: '运营成本',
          description: '服务器费用',
          type: 'expense'
        }
      ]
    },
    source: 'simulated',
    database: 'postgresql'
  });
});

// 模拟外包项目数据
app.get('/api/freelance', (req, res) => {
  res.json({
    success: true,
    data: {
      totalProjects: 2,
      activeProjects: 1,
      completedProjects: 1,
      totalRevenue: 80000,
      projects: [
        {
          id: 'proj-1',
          title: 'AI聊天机器人开发',
          client: 'TechCorp Inc.',
          status: 'active',
          budget: 50000,
          deadline: '2026-03-15',
          description: '为企业客户开发定制AI聊天机器人'
        },
        {
          id: 'proj-2',
          title: '数据分析仪表板',
          client: 'DataAnalytics Co.',
          status: 'completed',
          budget: 30000,
          deadline: '2026-02-20',
          description: '创建实时数据分析仪表板'
        }
      ]
    },
    source: 'simulated',
    database: 'postgresql'
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`🚀 Mission Control API Server 运行在 http://localhost:${port}`);
  console.log(`📊 数据库: PostgreSQL (mission_control)`);
  console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到关闭信号，正在关闭连接池...');
  await pool.end();
  process.exit(0);
});
