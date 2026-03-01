import pool from '@/shared/db/client';
import { randomUUID } from 'crypto';

export type MissionTask = {
  id: string;
  parentId?: string | null;
  level: 1 | 2 | 3;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  workflowStage?: string;
  progress: number;
  targetPrice?: number | null;
  currency: string;
  owner?: string | null;
  category?: string | null;
  source: string;
  analysisDocUrl?: string | null;
  acceptedAt?: string | null;
  outsourcedAt?: string | null;
  testedAt?: string | null;
  deployedAt?: string | null;
  invoicedAt?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type MissionResource = {
  id: string;
  taskId: string;
  name: string;
  resourceType: string;
  url?: string | null;
  filePath?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};


const mapTask = (r: any): MissionTask => ({
  id: r.id,
  parentId: r.parent_id,
  level: r.level,
  title: r.title,
  description: r.description,
  status: r.status,
  workflowStage: r.workflow_stage || 'draft',
  progress: Number(r.progress || 0),
  targetPrice: r.target_price != null ? Number(r.target_price) : null,
  currency: r.currency,
  owner: r.owner,
  category: r.category,
  source: r.source,
  analysisDocUrl: r.analysis_doc_url || null,
  acceptedAt: r.accepted_at || null,
  outsourcedAt: r.outsourced_at || null,
  testedAt: r.tested_at || null,
  deployedAt: r.deployed_at || null,
  invoicedAt: r.invoiced_at || null,
  metadata: r.metadata || {},
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export async function listMissionTasks(): Promise<MissionTask[]> {
  const rs = await pool.query('SELECT * FROM mission_tasks ORDER BY level, created_at DESC');
  return rs.rows.map(mapTask);
}

export async function getMissionTask(id: string): Promise<MissionTask | null> {
  const rs = await pool.query('SELECT * FROM mission_tasks WHERE id=$1 LIMIT 1', [id]);
  return rs.rows[0] ? mapTask(rs.rows[0]) : null;
}

export async function createMissionTask(input: Omit<MissionTask, 'id'> & { id?: string }): Promise<MissionTask> {
  const id = input.id || `mt-${randomUUID()}`;
  const rs = await pool.query(
    `INSERT INTO mission_tasks
      (id,parent_id,level,title,description,status,progress,target_price,currency,owner,category,source,metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      id,
      input.parentId || null,
      input.level,
      input.title,
      input.description || '',
      input.status || 'pending',
      input.progress ?? 0,
      input.targetPrice ?? null,
      input.currency || 'PHP',
      input.owner || null,
      input.category || null,
      input.source || 'manual',
      JSON.stringify(input.metadata || {}),
    ]
  );
  return mapTask(rs.rows[0]);
}

export async function updateMissionTask(id: string, updates: Partial<MissionTask>): Promise<MissionTask | null> {
  const allowed: Record<string, string> = {
    parentId: 'parent_id',
    level: 'level',
    title: 'title',
    description: 'description',
    status: 'status',
    progress: 'progress',
    targetPrice: 'target_price',
    currency: 'currency',
    owner: 'owner',
    category: 'category',
    source: 'source',
  };
  const fields: string[] = [];
  const vals: unknown[] = [];
  for (const [k, col] of Object.entries(allowed)) {
    const v = (updates as any)[k];
    if (v !== undefined) {
      vals.push(v);
      fields.push(`${col}=$${vals.length}`);
    }
  }
  if (updates.metadata !== undefined) {
    vals.push(JSON.stringify(updates.metadata || {}));
    fields.push(`metadata=$${vals.length}`);
  }
  if (!fields.length) return null;
  vals.push(id);
  const rs = await pool.query(`UPDATE mission_tasks SET ${fields.join(', ')}, updated_at=now() WHERE id=$${vals.length} RETURNING *`, vals);
  return rs.rows[0] ? mapTask(rs.rows[0]) : null;
}

export async function deleteMissionTask(id: string): Promise<boolean> {
  const rs = await pool.query('DELETE FROM mission_tasks WHERE id=$1', [id]);
  return (rs.rowCount || 0) > 0;
}

export async function listResources(taskId: string): Promise<MissionResource[]> {
  const rs = await pool.query('SELECT * FROM mission_task_resources WHERE task_id=$1 ORDER BY created_at DESC', [taskId]);
  return rs.rows.map((r: any) => ({
    id: r.id,
    taskId: r.task_id,
    name: r.name,
    resourceType: r.resource_type,
    url: r.url,
    filePath: r.file_path,
    mimeType: r.mime_type,
    fileSize: r.file_size != null ? Number(r.file_size) : null,
    notes: r.notes,
    metadata: r.metadata || {},
    createdAt: r.created_at,
  }));
}

export async function addResource(taskId: string, input: Omit<MissionResource, 'id' | 'taskId'>): Promise<MissionResource> {
  const id = `mres-${randomUUID()}`;
  const rs = await pool.query(
    `INSERT INTO mission_task_resources
      (id,task_id,name,resource_type,url,file_path,mime_type,file_size,notes,metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      id,
      taskId,
      input.name,
      input.resourceType || 'file',
      input.url || null,
      input.filePath || null,
      input.mimeType || null,
      input.fileSize || null,
      input.notes || null,
      JSON.stringify(input.metadata || {}),
    ]
  );
  const r = rs.rows[0];
  return {
    id: r.id,
    taskId: r.task_id,
    name: r.name,
    resourceType: r.resource_type,
    url: r.url,
    filePath: r.file_path,
    mimeType: r.mime_type,
    fileSize: r.file_size != null ? Number(r.file_size) : null,
    notes: r.notes,
    metadata: r.metadata || {},
    createdAt: r.created_at,
  };
}

export function toTree(tasks: MissionTask[]) {
  const byId = new Map<string, any>();
  const roots: any[] = [];
  tasks.forEach(t => byId.set(t.id, { ...t, children: [] }));
  for (const t of byId.values()) {
    if (t.parentId && byId.has(t.parentId)) byId.get(t.parentId).children.push(t);
    else roots.push(t);
  }
  return roots;
}
