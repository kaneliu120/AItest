import { randomUUID } from 'crypto';
/**
 * External API Store (compat layer)
 */

export interface ExternalApi {
  id: string;
  name: string;
  provider: 'google' | 'openai' | 'anthropic' | 'github' | 'azure' | 'other';
  category?: string;
  status: 'active' | 'inactive';
  url?: string;
}

export interface ApiCheckResult {
  id: string;
  apiId: string;
  timestamp: string;
  responseTime: number;
  statusCode: number;
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

interface ApiAlert {
  id: string;
  apiId: string;
  type: 'error' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: Record<string, unknown>;
  resolved: boolean;
  createdAt: string;
}

const apis: ExternalApi[] = [
  { id: 'ga4', name: 'Google Analytics', provider: 'google', status: 'active' },
  { id: 'openai', name: 'OpenAI API', provider: 'openai', status: 'active' },
];

const checks: ApiCheckResult[] = [];
const alerts: ApiAlert[] = [];

export function getAllApis(filters?: Partial<Pick<ExternalApi, 'provider' | 'category' | 'status'>> & { limit?: number }) {
  let out = [...apis];
  if (filters?.provider) out = out.filter(a => a.provider === filters.provider);
  if (filters?.category) out = out.filter(a => a.category === filters.category);
  if (filters?.status) out = out.filter(a => a.status === filters.status);
  if (filters?.limit) out = out.slice(0, filters.limit);
  return out;
}

export function getApiById(id: string) {
  return apis.find(a => a.id === id) || null;
}

export function addApi(api: Omit<ExternalApi, 'id'> & { id?: string }) {
  const item: ExternalApi = { ...api, id: api.id || `api-${randomUUID()}` };
  apis.unshift(item);
  return item;
}

export function updateApi(id: string, updates: Partial<ExternalApi>) {
  const i = apis.findIndex(a => a.id === id);
  if (i < 0) return null;
  apis[i] = { ...apis[i], ...updates };
  return apis[i];
}

export function deleteApi(id: string) {
  const i = apis.findIndex(a => a.id === id);
  if (i < 0) return false;
  apis.splice(i, 1);
  return true;
}

export function recordApiCheck(result: Omit<ApiCheckResult, 'id'>) {
  const item: ApiCheckResult = { ...result, id: `check-${randomUUID()}` };
  checks.unshift(item);
  return item;
}

export function getApiCheckResults(filters?: { apiId?: string; success?: boolean; limit?: number }) {
  let out = [...checks];
  if (filters?.apiId) out = out.filter(c => c.apiId === filters.apiId);
  if (typeof filters?.success === 'boolean') out = out.filter(c => c.success === filters.success);
  if (filters?.limit) out = out.slice(0, filters.limit);
  return out;
}

export function getApiStats() {
  const total = apis.length;
  const active = apis.filter(a => a.status === 'active').length;
  const totalChecks = checks.length;
  const successChecks = checks.filter(c => c.success).length;
  return { total, active, inactive: total - active, totalChecks, successRate: totalChecks ? Math.round((successChecks / totalChecks) * 100) : 0 };
}

export function createAlert(alert: Omit<ApiAlert, 'id' | 'createdAt'>) {
  const item: ApiAlert = { ...alert, id: `alert-${randomUUID()}`, createdAt: new Date().toISOString() };
  alerts.unshift(item);
  return item;
}

export function getAlerts(filters?: { apiId?: string; resolved?: boolean; severity?: ApiAlert['severity']; limit?: number }) {
  let out = [...alerts];
  if (filters?.apiId) out = out.filter(a => a.apiId === filters.apiId);
  if (typeof filters?.resolved === 'boolean') out = out.filter(a => a.resolved === filters.resolved);
  if (filters?.severity) out = out.filter(a => a.severity === filters.severity);
  if (filters?.limit) out = out.slice(0, filters.limit);
  return out;
}

export function resolveAlert(id: string) {
  const i = alerts.findIndex(a => a.id === id);
  if (i < 0) return false;
  alerts[i].resolved = true;
  return true;
}

// backward compatible async exports
export type ExternalAPI = ExternalApi;
export async function getAllExternalAPIs() { return getAllApis(); }
export async function checkAPIStatus(apiId: string) {
  const ok = !!getApiById(apiId);
  return { status: ok ? 'active' : 'inactive', responseTime: 100 };
}
