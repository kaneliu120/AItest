/**
 * Freelance Store — SQLite 持久化
 * 数据文件: data/freelance.db
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'freelance.db');

// ─── 类型定义 ─────────────────────────────────────────────────────────────────
export type ProjectStatus =
  | '创建' | '分析' | '接单' | '自动化' | '发布' | '待付款' | '已付款' | '已完成' | '已取消';

export type ProjectSource = 'knowledge_base' | 'manual' | 'ai';

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  source: ProjectSource;          // 数据来源
  businessSource: string;         // 业务渠道（Upwork/Fiverr/推荐/直接联系等）
  clientId: string;
  clientName: string;
  budget: number;
  currency: string;
  deadline: string;
  progress: number;               // 0–100
  category: string;
  automationStatus: string;       // 自动化流程状态
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  totalSpent: number;
  projectsCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── DB 单例 ──────────────────────────────────────────────────────────────────
let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');

  _db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id              TEXT PRIMARY KEY,
      title           TEXT NOT NULL,
      description     TEXT NOT NULL DEFAULT '',
      status          TEXT NOT NULL DEFAULT '创建',
      source          TEXT NOT NULL DEFAULT 'manual',
      business_source TEXT NOT NULL DEFAULT '直接联系',
      client_id       TEXT NOT NULL DEFAULT '',
      client_name     TEXT NOT NULL DEFAULT '',
      budget          REAL NOT NULL DEFAULT 0,
      currency        TEXT NOT NULL DEFAULT 'PHP',
      deadline        TEXT NOT NULL DEFAULT '',
      progress        INTEGER NOT NULL DEFAULT 0,
      category        TEXT NOT NULL DEFAULT '其他',
      automation_status TEXT NOT NULL DEFAULT '',
      notes           TEXT NOT NULL DEFAULT '',
      created_at      TEXT NOT NULL,
      updated_at      TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_proj_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_proj_source ON projects(source);

    CREATE TABLE IF NOT EXISTS clients (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      company         TEXT NOT NULL DEFAULT '',
      email           TEXT NOT NULL DEFAULT '',
      phone           TEXT NOT NULL DEFAULT '',
      notes           TEXT NOT NULL DEFAULT '',
      total_spent     REAL NOT NULL DEFAULT 0,
      projects_count  INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL,
      updated_at      TEXT NOT NULL
    );
  `);

  const pc = (_db.prepare('SELECT COUNT(*) as n FROM projects').get() as any).n;
  const cc = (_db.prepare('SELECT COUNT(*) as n FROM clients').get() as any).n;
  if (pc === 0 && cc === 0) seedData(_db);

  return _db;
}

// ─── 种子数据 ─────────────────────────────────────────────────────────────────
function seedData(db: Database.Database) {
  const now = new Date().toISOString();

  // 种子客户
  const insertClient = db.prepare(`
    INSERT INTO clients (id, name, company, email, phone, notes, total_spent, projects_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const seedClients = [
    { id: 'c-001', name: '张伟',   company: '科技初创公司',  email: 'zhang@tech.com',    phone: '+63 912 001',  spent: 50000, cnt: 1 },
    { id: 'c-002', name: '李敏',   company: '教育机构',      email: 'li@edu.org',        phone: '+63 912 002',  spent: 35000, cnt: 1 },
    { id: 'c-003', name: 'David',  company: 'Upwork Client', email: 'david@gmail.com',   phone: '+1 234 5678',  spent: 0,     cnt: 0 },
  ];
  const insertAllClients = db.transaction((rows: typeof seedClients) => {
    rows.forEach(r => insertClient.run(r.id, r.name, r.company, r.email, r.phone, '', r.spent, r.cnt, now, now));
  });
  insertAllClients(seedClients);

  // 种子项目
  const insertProject = db.prepare(`
    INSERT INTO projects
      (id, title, description, status, source, business_source, client_id, client_name,
       budget, currency, deadline, progress, category, automation_status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const seedProjects = [
    {
      id: 'p-001', title: 'AI技能平台开发',
      desc: '为 My Skill Shop 开发新功能模块，包含技能推荐和支付集成',
      status: '已付款', source: 'manual', biz: '直接联系',
      cid: 'c-001', cname: '张伟', budget: 50000, dl: '2026-03-15', prog: 75, cat: 'AI开发',
      auto: '已完成', notes: '客户满意，准备验收',
    },
    {
      id: 'p-002', title: '财务系统优化',
      desc: '优化 Mission Control 财务模块，提升报表性能',
      status: '自动化', source: 'manual', biz: '内部项目',
      cid: 'c-002', cname: '李敏', budget: 25000, dl: '2026-03-10', prog: 60, cat: '系统开发',
      auto: '运行中', notes: '',
    },
    {
      id: 'p-003', title: 'AI聊天机器人',
      desc: '基于 GPT-4 的客服聊天机器人，支持多语言',
      status: '接单', source: 'knowledge_base', biz: 'Upwork',
      cid: 'c-003', cname: 'David', budget: 45000, dl: '2026-04-01', prog: 10, cat: 'AI开发',
      auto: '', notes: '来自知识库市场分析，高需求方向',
    },
    {
      id: 'p-004', title: '数据分析仪表板',
      desc: '为电商客户开发销售数据可视化仪表板',
      status: '已完成', source: 'ai', biz: 'Fiverr',
      cid: 'c-001', cname: '张伟', budget: 40000, dl: '2026-02-15', prog: 100, cat: '数据分析',
      auto: '已完成', notes: '项目已验收，好评 5 星',
    },
  ];
  const insertAllProj = db.transaction((rows: typeof seedProjects) => {
    rows.forEach(r =>
      insertProject.run(
        r.id, r.title, r.desc, r.status, r.source, r.biz,
        r.cid, r.cname, r.budget, 'PHP', r.dl, r.prog, r.cat,
        r.auto, r.notes, now, now
      )
    );
  });
  insertAllProj(seedProjects);
  console.log('[freelance-store] 种子数据已导入');
}

// ─── Project CRUD ─────────────────────────────────────────────────────────────
function rowToProject(r: any): Project {
  return {
    id: r.id, title: r.title, description: r.description,
    status: r.status, source: r.source, businessSource: r.business_source,
    clientId: r.client_id, clientName: r.client_name,
    budget: r.budget, currency: r.currency, deadline: r.deadline,
    progress: r.progress, category: r.category,
    automationStatus: r.automation_status, notes: r.notes,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

export function getAllProjects(): Project[] {
  return (getDb().prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as any[]).map(rowToProject);
}

export function getProjectById(id: string): Project | null {
  const r = getDb().prepare('SELECT * FROM projects WHERE id=?').get(id) as any;
  return r ? rowToProject(r) : null;
}

export function createProject(input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
  const now = new Date().toISOString();
  const id  = `p-${Date.now()}`;
  getDb().prepare(`
    INSERT INTO projects
      (id, title, description, status, source, business_source, client_id, client_name,
       budget, currency, deadline, progress, category, automation_status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, input.title, input.description, input.status ?? '创建',
    input.source ?? 'manual', input.businessSource ?? '直接联系',
    input.clientId ?? '', input.clientName ?? '',
    input.budget ?? 0, input.currency ?? 'PHP',
    input.deadline ?? '', input.progress ?? 0, input.category ?? '其他',
    input.automationStatus ?? '', input.notes ?? '', now, now);
  return getProjectById(id)!;
}

export function updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): boolean {
  const now = new Date().toISOString();
  const map: Record<string, string> = {
    title: 'title', description: 'description', status: 'status',
    source: 'source', businessSource: 'business_source',
    clientId: 'client_id', clientName: 'client_name',
    budget: 'budget', currency: 'currency', deadline: 'deadline',
    progress: 'progress', category: 'category',
    automationStatus: 'automation_status', notes: 'notes',
  };
  const fields: string[] = ['updated_at = ?'];
  const values: any[] = [now];
  Object.entries(updates).forEach(([k, v]) => {
    if (map[k] && v !== undefined) { fields.push(`${map[k]} = ?`); values.push(v); }
  });
  values.push(id);
  return (getDb().prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id=?`).run(...values) as any).changes > 0;
}

export function deleteProject(id: string): boolean {
  return (getDb().prepare('DELETE FROM projects WHERE id=?').run(id) as any).changes > 0;
}

export function getProjectStats() {
  const db = getDb();
  const total       = (db.prepare('SELECT COUNT(*) as n FROM projects').get() as any).n;
  const byStatus    = db.prepare(`SELECT status, COUNT(*) as n FROM projects GROUP BY status`).all() as any[];
  const bySource    = db.prepare(`SELECT source, COUNT(*) as n FROM projects GROUP BY source`).all() as any[];
  const totalBudget = (db.prepare(`SELECT COALESCE(SUM(budget),0) as s FROM projects WHERE status NOT IN ('已取消')`).get() as any).s;
  const earned      = (db.prepare(`SELECT COALESCE(SUM(budget),0) as s FROM projects WHERE status IN ('已付款','已完成')`).get() as any).s;

  const statusMap: Record<string, number> = {};
  byStatus.forEach((r: any) => { statusMap[r.status] = r.n; });

  const sourceMap: Record<string, number> = {};
  bySource.forEach((r: any) => { sourceMap[r.source] = r.n; });

  return { total, totalBudget, earned, statusMap, sourceMap,
    active: (statusMap['接单'] || 0) + (statusMap['自动化'] || 0) + (statusMap['发布'] || 0) + (statusMap['待付款'] || 0),
  };
}

// ─── Client CRUD ──────────────────────────────────────────────────────────────
function rowToClient(r: any): Client {
  return {
    id: r.id, name: r.name, company: r.company,
    email: r.email, phone: r.phone, notes: r.notes,
    totalSpent: r.total_spent, projectsCount: r.projects_count,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

export function getAllClients(): Client[] {
  return (getDb().prepare('SELECT * FROM clients ORDER BY created_at DESC').all() as any[]).map(rowToClient);
}

export function createClient(input: Omit<Client, 'id' | 'totalSpent' | 'projectsCount' | 'createdAt' | 'updatedAt'>): Client {
  const now = new Date().toISOString();
  const id  = `c-${Date.now()}`;
  getDb().prepare(`
    INSERT INTO clients (id, name, company, email, phone, notes, total_spent, projects_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
  `).run(id, input.name, input.company ?? '', input.email ?? '', input.phone ?? '', input.notes ?? '', now, now);
  return getAllClients().find(c => c.id === id)!;
}

export function updateClient(id: string, updates: Partial<Omit<Client, 'id' | 'createdAt'>>): boolean {
  const now = new Date().toISOString();
  const map: Record<string, string> = {
    name: 'name', company: 'company', email: 'email', phone: 'phone', notes: 'notes',
    totalSpent: 'total_spent', projectsCount: 'projects_count',
  };
  const fields: string[] = ['updated_at = ?'];
  const values: any[] = [now];
  Object.entries(updates).forEach(([k, v]) => {
    if (map[k] && v !== undefined) { fields.push(`${map[k]} = ?`); values.push(v); }
  });
  values.push(id);
  return (getDb().prepare(`UPDATE clients SET ${fields.join(', ')} WHERE id=?`).run(...values) as any).changes > 0;
}

export function deleteClient(id: string): boolean {
  return (getDb().prepare('DELETE FROM clients WHERE id=?').run(id) as any).changes > 0;
}

// 导出 store 对象（兼容接口）
export const freelanceStore = {
  getAllProjects, getProjectById, createProject, updateProject, deleteProject, getProjectStats,
  getAllClients, createClient, updateClient, deleteClient,
};
