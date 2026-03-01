/**
 * Finance Store — SQLite 持久化
 * 替代 finance-service.ts 的内存存储
 * 数据文件: data/finance.db (重启不丢失)
 * CSV 备份: ~/Finance/income.csv + ~/Finance/expenses.csv
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

const DB_PATH = path.join(process.cwd(), 'data', 'finance.db');
const FINANCE_DIR = path.join(os.homedir(), 'Finance');
const INCOME_CSV = path.join(FINANCE_DIR, 'income.csv');
const EXPENSE_CSV = path.join(FINANCE_DIR, 'expenses.csv');

// ─── 类型 ─────────────────────────────────────────────────────────────────────
export interface FinanceTransaction {
  id: string;
  date: string;          // YYYY-MM-DD
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;        // PHP
  currency: string;
  status: 'completed' | 'pending' | 'cancelled';
  tags: string[];
  // 集成字段
  taskId?: string;       // 关联的任务ID (来自任务管理系统)
  projectId?: string;    // 关联的外包项目ID
  knowledgeRef?: string; // 知识管理系统引用ID
  metadata?: Record<string, unknown>; // 扩展元数据
}

// ─── DB 单例 ──────────────────────────────────────────────────────────────────
let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  // 确保 data/ 目录存在
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');

  // 建表
  _db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      category TEXT NOT NULL DEFAULT '其他',
      description TEXT NOT NULL DEFAULT '',
      amount REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'PHP',
      status TEXT NOT NULL DEFAULT 'completed',
      tags TEXT NOT NULL DEFAULT '[]',
      task_id TEXT,
      project_id TEXT,
      knowledge_ref TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_tx_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_tx_task ON transactions(task_id);
    CREATE INDEX IF NOT EXISTS idx_tx_project ON transactions(project_id);
  `);

  // 如果空表，导入种子数据
  const count = (_db.prepare('SELECT COUNT(*) as n FROM transactions').get() as any).n;
  if (count === 0) {
    importSeedData(_db);
  }

  // 迁移：添加新列（如果不存在）
  const migrations = [
    'ALTER TABLE transactions ADD COLUMN task_id TEXT',
    'ALTER TABLE transactions ADD COLUMN project_id TEXT',
    'ALTER TABLE transactions ADD COLUMN knowledge_ref TEXT',
    'ALTER TABLE transactions ADD COLUMN metadata TEXT',
  ];
  
  for (const migration of migrations) {
    try {
      _db.exec(migration);
    } catch (e) {
      // 列已存在，忽略错误
      if (!(e as any).message?.includes('duplicate column name')) {
        console.warn('财务表迁移失败:', migration, e);
      }
    }
  }

  return _db;
}

// ─── 种子数据（来自原 finance-service.ts 的测试数据）────────────────────────
function importSeedData(db: Database.Database) {
  const seeds: Omit<FinanceTransaction, 'id'>[] = [
    {
      date: '2026-02-21', type: 'income', category: 'AI外包项目',
      description: '客户A - AI集成项目', amount: 50000,
      currency: 'PHP', status: 'completed', tags: ['外包', 'AI'],
    },
    {
      date: '2026-02-15', type: 'income', category: '技能销售',
      description: 'My Skill Shop 平台销售', amount: 25000,
      currency: 'PHP', status: 'completed', tags: ['平台', '销售'],
    },
    {
      date: '2026-02-19', type: 'expense', category: '云服务器',
      description: 'Azure 云服务器月费', amount: 2500,
      currency: 'PHP', status: 'completed', tags: ['云', '基础设施'],
    },
    {
      date: '2026-02-18', type: 'expense', category: '营销推广',
      description: 'Google Ads 广告费', amount: 1500,
      currency: 'PHP', status: 'completed', tags: ['营销', '广告'],
    },
    {
      date: '2026-02-10', type: 'expense', category: '软件工具',
      description: '开发工具订阅', amount: 500,
      currency: 'PHP', status: 'completed', tags: ['工具', '订阅'],
    },
  ];

  const insert = db.prepare(`
    INSERT INTO transactions (id, date, type, category, description, amount, currency, status, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((rows: typeof seeds) => {
    rows.forEach((r, i) =>
      insert.run(
        `txn-seed-${i + 1}`, r.date, r.type, r.category,
        r.description, r.amount, r.currency, r.status,
        JSON.stringify(r.tags)
      )
    );
  });
  insertMany(seeds);
  console.log(`[finance-store] 导入 ${seeds.length} 条种子数据`);

  // 同步写入 CSV 文件供手动编辑
  syncToCsv(db);
}

// ─── CSV 同步（单向写出，供凯哥手动编辑）────────────────────────────────────
function syncToCsv(db: Database.Database) {
  try {
    if (!fs.existsSync(FINANCE_DIR)) fs.mkdirSync(FINANCE_DIR, { recursive: true });

    const rows = db.prepare('SELECT * FROM transactions ORDER BY date DESC').all() as any[];
    const incomes = rows.filter(r => r.type === 'income');
    const expenses = rows.filter(r => r.type === 'expense');

    const incomeLines = ['Date,Source,Amount(PHP),Description,Category,Status',
      ...incomes.map(r => `${r.date},${r.category},${r.amount},${r.description},${r.category},${r.status}`)
    ].join('\n');

    const expenseLines = ['Date,Item,Amount(PHP),Category,Description,Status',
      ...expenses.map(r => `${r.date},${r.description},${r.amount},${r.category},${r.description},${r.status}`)
    ].join('\n');

    fs.writeFileSync(INCOME_CSV, incomeLines, 'utf-8');
    fs.writeFileSync(EXPENSE_CSV, expenseLines, 'utf-8');
    console.log(`[finance-store] CSV 已同步: ${INCOME_CSV}`);
  } catch (e) {
    console.warn('[finance-store] CSV 同步失败（不影响DB）:', e);
  }
}

// ─── 公开 API ─────────────────────────────────────────────────────────────────

export function addTransaction(data: Omit<FinanceTransaction, 'id'>): FinanceTransaction {
  const db = getDb();
  const id = `txn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  db.prepare(`
    INSERT INTO transactions (id, date, type, category, description, amount, currency, status, tags, task_id, project_id, knowledge_ref, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, 
    data.date, 
    data.type, 
    data.category, 
    data.description,
    data.amount, 
    data.currency || 'PHP', 
    data.status || 'completed', 
    JSON.stringify(data.tags || []),
    data.taskId || null,
    data.projectId || null,
    data.knowledgeRef || null,
    data.metadata ? JSON.stringify(data.metadata) : null
  );

  // 异步 CSV 同步
  setImmediate(() => syncToCsv(db));
  return { id, ...data };
}

export function getTransactions(filters?: {
  type?: 'income' | 'expense';
  limit?: number;
  month?: string; // YYYY-MM
}): FinanceTransaction[] {
  const db = getDb();
  let sql = 'SELECT * FROM transactions WHERE 1=1';
  const params: any[] = [];

  if (filters?.type) { sql += ' AND type = ?'; params.push(filters.type); }
  if (filters?.month) { sql += ' AND date LIKE ?'; params.push(`${filters.month}%`); }
  sql += ' ORDER BY date DESC';
  if (filters?.limit) { sql += ' LIMIT ?'; params.push(filters.limit); }

  const rows = db.prepare(sql).all(...params) as any[];
  return rows.map(r => ({
    id: r.id,
    date: r.date,
    type: r.type,
    category: r.category,
    description: r.description,
    amount: r.amount,
    currency: r.currency,
    status: r.status,
    tags: JSON.parse(r.tags || '[]'),
    taskId: r.task_id,
    projectId: r.project_id,
    knowledgeRef: r.knowledge_ref,
    metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
  }));
}

export function getStats() {
  const db = getDb();
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const all = getTransactions();
  const thisMonthTxns = getTransactions({ month: thisMonth });

  const totalIncome = all.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = all.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const currentIncome = thisMonthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const currentExpenses = thisMonthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // 月度趋势（最近 6 个月）
  const monthMap: Record<string, { income: number; expenses: number }> = {};
  all.forEach(t => {
    const m = t.date.substring(0, 7);
    if (!monthMap[m]) monthMap[m] = { income: 0, expenses: 0 };
    if (t.type === 'income') monthMap[m].income += t.amount;
    else monthMap[m].expenses += t.amount;
  });

  const monthlyTrend = Object.entries(monthMap)
    .map(([month, d]) => ({ month, income: d.income, expenses: d.expenses, profit: d.income - d.expenses }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 6);

  return {
    totalIncome, totalExpenses,
    netProfit: totalIncome - totalExpenses,
    profitMargin: totalIncome > 0 ? Math.round((totalIncome - totalExpenses) / totalIncome * 100 * 100) / 100 : 0,
    totalTransactions: all.length,
    currentMonth: { income: currentIncome, expenses: currentExpenses, profit: currentIncome - currentExpenses },
    monthlyTrend,
    currency: 'PHP',
    lastUpdated: new Date().toISOString(),
    available: true,
  };
}

// 兼容旧 financeService 接口
export const financeStore = {
  getFinancialStats: () => Promise.resolve(getStats()),
  getRecentTransactions: () => Promise.resolve(getTransactions({ limit: 20 })),
  addTransaction: (data: Omit<FinanceTransaction, 'id'>) => Promise.resolve(addTransaction(data)),
};
