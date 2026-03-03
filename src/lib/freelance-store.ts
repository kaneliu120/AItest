import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { logger } from '@/lib/logger';

export interface Project {
  id: string;
  title: string;
  clientName?: string;
  client?: string;
  clientId?: string;
  status: string;
  source?: string;
  businessSource?: string;
  budget: number;
  currency?: string;
  deadline?: string;
  progress?: number;
  category?: string;
  automationStatus?: string;
  notes?: string;
  description: string;
}

interface Client {
  id: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

let pool: Pool | null = null;
function db(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL!,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

function rowToProject(r: any): Project {
  return {
    id: r.id,
    title: r.title,
    description: r.description || '',
    status: r.status || 'active',
    source: r.source || 'manual',
    businessSource: r.business_source || '',
    clientId: r.client_id || undefined,
    clientName: r.client_name || undefined,
    budget: Number(r.budget || 0),
    currency: r.currency || 'PHP',
    deadline: r.deadline || undefined,
    progress: Number(r.progress || 0),
    category: r.category || 'Other',
    automationStatus: r.automation_status || '',
    notes: r.notes || '',
    client: r.client_name || undefined,
  };
}

function rowToClient(r: any): Client {
  return { id: r.id, name: r.name || '', company: r.company || '', email: r.email || '', phone: r.phone || '', notes: r.notes || '' };
}

export async function getAllProjects(): Promise<Project[]> {
  try {
    const rs = await db().query(`SELECT * FROM freelance_projects ORDER BY created_at DESC`);
    return rs.rows.map(rowToProject);
  } catch (e) {
    logger.error('Failed to fetch outsourcing projects', e, { module: 'freelance-store' });
    return [];
  }
}

export async function getProjectStats() {
  const projects = await getAllProjects();
  return {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    totalRevenue: projects.reduce((a, p) => a + (p.budget || 0), 0),
  };
}

export async function addProject(project: Omit<Project, 'id'>) {
  const item: Project = { ...project, id: `proj-${randomUUID()}` };
  await db().query(
    `INSERT INTO freelance_projects
      (id,title,description,status,source,business_source,client_id,client_name,budget,currency,deadline,progress,category,automation_status,notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [
      item.id, item.title, item.description || '', item.status || 'active', item.source || 'manual', item.businessSource || '',
      item.clientId || null, item.clientName || null, item.budget || 0, item.currency || 'PHP', item.deadline || null,
      item.progress || 0, item.category || 'Other', item.automationStatus || '', item.notes || ''
    ]
  );
  return item;
}

export interface FreelanceStore {
  getAllProjects(): Promise<Project[]>;
  getAllClients(): Promise<Client[]>;
  getProjectStats(): Promise<{ totalProjects: number; activeProjects: number; completedProjects: number; totalRevenue: number }>;
  createProject(input: Omit<Project, 'id'>): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<boolean>;
  deleteProject(id: string): Promise<boolean>;
  getProjectById(id: string): Promise<Project | null>;
  createClient(input: Omit<Client, 'id'>): Promise<Client>;
  updateClient(id: string, updates: Partial<Client>): Promise<boolean>;
  deleteClient(id: string): Promise<boolean>;
}

export const freelanceStore: FreelanceStore = {
  async getAllProjects() { return getAllProjects(); },
  async getAllClients() {
    const rs = await db().query(`SELECT * FROM freelance_clients ORDER BY created_at DESC`);
    return rs.rows.map(rowToClient);
  },
  async getProjectStats() { return getProjectStats(); },
  async createProject(input) { return addProject(input); },
  async updateProject(id, updates) {
    const allowed: Record<string, string> = {
      title: 'title', description: 'description', status: 'status', source: 'source', businessSource: 'business_source',
      clientId: 'client_id', clientName: 'client_name', budget: 'budget', currency: 'currency', deadline: 'deadline',
      progress: 'progress', category: 'category', automationStatus: 'automation_status', notes: 'notes'
    };
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [k, col] of Object.entries(allowed)) {
      const v = (updates as Record<string, unknown>)[k];
      if (v !== undefined) { values.push(v); fields.push(`${col}=$${values.length}`); }
    }
    if (!fields.length) return false;
    values.push(id);
    const rs = await db().query(`UPDATE freelance_projects SET ${fields.join(', ')} WHERE id=$${values.length}`, values);
    return (rs.rowCount ?? 0) > 0;
  },
  async deleteProject(id) {
    const rs = await db().query('DELETE FROM freelance_projects WHERE id=$1', [id]);
    return (rs.rowCount ?? 0) > 0;
  },
  async getProjectById(id) {
    const rs = await db().query('SELECT * FROM freelance_projects WHERE id=$1 LIMIT 1', [id]);
    return rs.rows[0] ? rowToProject(rs.rows[0]) : null;
  },
  async createClient(input) {
    const c: Client = { id: `client-${randomUUID()}`, ...input };
    await db().query('INSERT INTO freelance_clients (id,name,company,email,phone,notes) VALUES ($1,$2,$3,$4,$5,$6)',
      [c.id, c.name || '', c.company || '', c.email || '', c.phone || '', c.notes || '']);
    return c;
  },
  async updateClient(id, updates) {
    const allowed: Record<string, string> = { name: 'name', company: 'company', email: 'email', phone: 'phone', notes: 'notes' };
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [k, col] of Object.entries(allowed)) {
      const v = (updates as Record<string, unknown>)[k];
      if (v !== undefined) { values.push(v); fields.push(`${col}=$${values.length}`); }
    }
    if (!fields.length) return false;
    values.push(id);
    const rs = await db().query(`UPDATE freelance_clients SET ${fields.join(', ')} WHERE id=$${values.length}`, values);
    return (rs.rowCount ?? 0) > 0;
  },
  async deleteClient(id) {
    const rs = await db().query('DELETE FROM freelance_clients WHERE id=$1', [id]);
    return (rs.rowCount ?? 0) > 0;
  },
};
