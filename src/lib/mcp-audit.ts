import { promises as fs } from 'fs';
import path from 'path';

export interface McpAuditLog {
  id: string;
  action: string;
  slug?: string;
  success: boolean;
  detail?: string;
  at: string;
}

const AUDIT_PATH = path.join(process.cwd(), 'data', 'mcp', 'audit-log.json');

async function ensureAuditFile() {
  await fs.mkdir(path.dirname(AUDIT_PATH), { recursive: true });
  try {
    await fs.access(AUDIT_PATH);
  } catch {
    await fs.writeFile(AUDIT_PATH, '[]', 'utf-8');
  }
}

export async function listMcpAuditLogs(limit = 100): Promise<McpAuditLog[]> {
  await ensureAuditFile();
  const raw = await fs.readFile(AUDIT_PATH, 'utf-8');
  const logs = (JSON.parse(raw) as McpAuditLog[]) || [];
  return logs.slice(-limit).reverse();
}

export async function appendMcpAuditLog(log: Omit<McpAuditLog, 'id' | 'at'>) {
  await ensureAuditFile();
  const raw = await fs.readFile(AUDIT_PATH, 'utf-8');
  const logs = (JSON.parse(raw) as McpAuditLog[]) || [];
  logs.push({
    id: `mcp-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    ...log,
  });
  await fs.writeFile(AUDIT_PATH, JSON.stringify(logs, null, 2), 'utf-8');
}
