/**
 * 外部API存储管理
 * 功能: 存储和管理所有外部API的配置、状态和监控数据
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'external-apis.db');

// ─── 类型定义 ─────────────────────────────────────────────────────────────────────
export interface ExternalApi {
  id: string;
  name: string;
  provider: string;           // google, openai, azure, github, etc.
  category: string;           // ai, cloud, analytics, social, etc.
  description: string;
  
  // 认证信息
  authType: 'api_key' | 'oauth' | 'service_account' | 'token' | 'none';
  apiKey?: string;           // 加密存储
  clientId?: string;
  clientSecret?: string;     // 加密存储
  refreshToken?: string;     // 加密存储
  serviceAccount?: string;
  
  // 配置信息
  endpoint?: string;
  projectId?: string;
  accountId?: string;
  region?: string;
  
  // 状态信息
  status: 'active' | 'inactive' | 'needs_setup' | 'error';
  lastChecked: string;
  lastResponseTime?: number;  // ms
  lastStatusCode?: number;
  lastError?: string;
  
  // 使用统计
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  
  // 配额信息
  rateLimit?: number;
  rateLimitPeriod?: string;  // per_minute, per_hour, per_day
  quotaUsed?: number;
  quotaLimit?: number;
  quotaResetAt?: string;
  
  // 元数据
  tags: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
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

export interface ApiAlert {
  id: string;
  apiId: string;
  type: 'error' | 'warning' | 'quota' | 'rate_limit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: Record<string, unknown>;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

// ─── 数据库单例 ──────────────────────────────────────────────────────────────────
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
    CREATE TABLE IF NOT EXISTS external_apis (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      
      -- 认证信息
      auth_type TEXT NOT NULL DEFAULT 'api_key',
      api_key TEXT,
      client_id TEXT,
      client_secret TEXT,
      refresh_token TEXT,
      service_account TEXT,
      
      -- 配置信息
      endpoint TEXT,
      project_id TEXT,
      account_id TEXT,
      region TEXT,
      
      -- 状态信息
      status TEXT NOT NULL DEFAULT 'needs_setup',
      last_checked TEXT NOT NULL DEFAULT (datetime('now')),
      last_response_time INTEGER,
      last_status_code INTEGER,
      last_error TEXT,
      
      -- 使用统计
      total_calls INTEGER NOT NULL DEFAULT 0,
      successful_calls INTEGER NOT NULL DEFAULT 0,
      failed_calls INTEGER NOT NULL DEFAULT 0,
      average_response_time REAL NOT NULL DEFAULT 0,
      
      -- 配额信息
      rate_limit INTEGER,
      rate_limit_period TEXT,
      quota_used REAL,
      quota_limit REAL,
      quota_reset_at TEXT,
      
      -- 元数据
      tags TEXT NOT NULL DEFAULT '[]',
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    
    CREATE TABLE IF NOT EXISTS api_check_results (
      id TEXT PRIMARY KEY,
      api_id TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      response_time INTEGER NOT NULL,
      status_code INTEGER,
      success BOOLEAN NOT NULL,
      error TEXT,
      data TEXT,
      FOREIGN KEY (api_id) REFERENCES external_apis(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS api_alerts (
      id TEXT PRIMARY KEY,
      api_id TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      details TEXT,
      resolved BOOLEAN NOT NULL DEFAULT FALSE,
      resolved_at TEXT,
      resolved_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (api_id) REFERENCES external_apis(id) ON DELETE CASCADE
    );
    
    -- 索引
    CREATE INDEX IF NOT EXISTS idx_apis_provider ON external_apis(provider);
    CREATE INDEX IF NOT EXISTS idx_apis_category ON external_apis(category);
    CREATE INDEX IF NOT EXISTS idx_apis_status ON external_apis(status);
    CREATE INDEX IF NOT EXISTS idx_check_results_api ON api_check_results(api_id);
    CREATE INDEX IF NOT EXISTS idx_check_results_time ON api_check_results(timestamp);
    CREATE INDEX IF NOT EXISTS idx_alerts_api ON api_alerts(api_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON api_alerts(resolved);
  `);

  // 导入已知的API配置
  const count = (_db.prepare('SELECT COUNT(*) as n FROM external_apis').get() as any).n;
  if (count === 0) {
    importSeedData(_db);
  }

  return _db;
}

// ─── 种子数据 ───────────────────────────────────────────────────────────────────
function importSeedData(db: Database.Database) {
  const seeds: Omit<ExternalApi, 'id' | 'createdAt' | 'updatedAt'>[] = [
    // Google APIs
    {
      name: 'Google Analytics 4',
      provider: 'google',
      category: 'analytics',
      description: '网站和应用数据分析',
      authType: 'service_account',
      serviceAccount: 'claw-analytics-sa@claw-analytics-153.iam.gserviceaccount.com',
      projectId: 'claw-analytics-153',
      status: 'active',
      lastChecked: new Date().toISOString(),
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageResponseTime: 0,
      tags: JSON.stringify(['google', 'analytics', 'ga4', 'data']),
    },
    {
      name: 'Google Ads',
      provider: 'google',
      category: 'ads',
      description: '广告数据管理和优化',
      authType: 'oauth',
      clientId: '待配置',
      status: 'needs_setup',
      lastChecked: new Date().toISOString(),
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageResponseTime: 0,
      tags: JSON.stringify(['google', 'ads', 'marketing']),
    },
    {
      name: 'Google Cloud Platform',
      provider: 'google',
      category: 'cloud',
      description: '云基础设施和服务',
      authType: 'service_account',
      status: 'active',
      lastChecked: new Date().toISOString(),
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageResponseTime: 0,
      tags: JSON.stringify(['google', 'cloud', 'gcp', 'infrastructure']),
    },
    
    // AI APIs
    {
      name: 'OpenAI API',
      provider: 'openai',
      category: 'ai',
      description: 'GPT、Whisper、DALL-E AI服务',
      authType: 'api_key',
      status: 'active',
      lastChecked: new Date().toISOString(),
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageResponseTime: 0,
      tags: JSON.stringify(['openai', 'ai', 'gpt', 'whisper', 'dalle']),
    },
    {
      name: 'Anthropic Claude',
      provider: 'anthropic',
      category: 'ai',
      description: 'Claude AI模型服务',
      authType: 'api_key',
      status: 'active',
      lastChecked: new Date().toISOString(),
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageResponseTime: 0,
      tags: JSON.stringify(['anthropic', 'ai', 'claude', 'sonnet']),
    },
    {
      name: 'DeepSeek API',
      provider: 'deepseek',
      category: 'ai',
      description: 'DeepSeek AI模型服务',
      authType: 'api_key',
      status: 'active',
      lastChecked: new Date().toISOString(),
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageResponseTime: 0,
      tags: JSON.stringify(['deepseek', 'ai', 'chat']),
    },
    
    // 开发工具
    {
      name: 'GitHub API',
      provider: 'github',
      category: 'development',
      description: '代码仓库管理和CI/CD',
      authType: 'token',
      status: 'active',
      lastChecked: new Date().toISOString(),
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageResponseTime: 0,
      tags: JSON.stringify(['github', 'git', 'ci-cd', 'development']),
    },
    {
      name: 'Azure云服务',
      provider: 'azure',
      category: 'cloud',
      description: 'Azure App Service和SQL Database',
      authType: 'service_principal',
      status: 'active',
      lastChecked: new Date().toISOString(),
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageResponseTime: 0,
      tags: JSON.stringify(['azure', 'cloud', 'app-service', 'sql']),
    },
    
    // 社交媒体
    {
      name: 'LinkedIn API',
      provider: 'linkedin',
      category: 'social',
      description: 'LinkedIn内容发布和管理',
      authType: 'api_key',
      status: 'active',
      lastChecked: new Date().toISOString(),
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageResponseTime: 0,
      tags: JSON.stringify(['linkedin', 'social', 'marketing']),
    },
    
    // 其他
    {
      name: 'Brave Search API',
      provider: 'brave',
      category: 'search',
      description: '网页搜索服务',
      authType: 'api_key',
      status: 'active',
      lastChecked: new Date().toISOString(),
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageResponseTime: 0,
      tags: JSON.stringify(['brave', 'search', 'web']),
    },
    {
      name: '转录API',
      provider: 'transcript',
      category: 'audio',
      description: '音频转录服务',
      authType: 'api_key',
      status: 'active',
      lastChecked: new Date().toISOString(),
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageResponseTime: 0,
      tags: JSON.stringify(['transcript', 'audio', 'speech']),
    },
  ];

  const insert = db.prepare(`
    INSERT INTO external_apis (
      id, name, provider, category, description, auth_type, api_key, client_id,
      client_secret, refresh_token, service_account, endpoint, project_id,
      account_id, region, status, last_checked, last_response_time,
      last_status_code, last_error, total_calls, successful_calls,
      failed_calls, average_response_time, rate_limit, rate_limit_period,
      quota_used, quota_limit, quota_reset_at, tags, metadata
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const insertMany = db.transaction((rows: typeof seeds) => {
    rows.forEach((r, i) => {
      const id = `api-${r.provider}-${i + 1}`;
      insert.run(
        id,
        r.name,
        r.provider,
        r.category,
        r.description,
        r.authType,
        r.apiKey || null,
        r.clientId || null,
        r.clientSecret || null,
        r.refreshToken || null,
        r.serviceAccount || null,
        r.endpoint || null,
        r.projectId || null,
        r.accountId || null,
        r.region || null,
        r.status,
        r.lastChecked,
        r.lastResponseTime || null,
        r.lastStatusCode || null,
        r.lastError || null,
        r.totalCalls,
        r.successfulCalls,
        r.failedCalls,
        r.averageResponseTime,
        r.rateLimit || null,
        r.rateLimitPeriod || null,
        r.quotaUsed || null,
        r.quotaLimit || null,
        r.quotaResetAt || null,
        r.tags,
        r.metadata ? JSON.stringify(r.metadata) : null
      );
    });
  });

  insertMany(seeds);
  console.log(`[external-api-store] 导入 ${seeds.length} 个外部API配置`);
}

// ─── 加密辅助函数 ───────────────────────────────────────────────────────────────
function encrypt(text: string): string {
  // 简单base64编码，生产环境应使用真正的加密
  return Buffer.from(text).toString('base64');
}

function decrypt(encrypted: string): string {
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}

// ─── 公开API ───────────────────────────────────────────────────────────────────

export function getAllApis(filters?: {
  provider?: string;
  category?: string;
  status?: string;
  limit?: number;
}): ExternalApi[] {
  const db = getDb();
  let sql = 'SELECT * FROM external_apis WHERE 1=1';
  const params: any[] = [];

  if (filters?.provider) { sql += ' AND provider = ?'; params.push(filters.provider); }
  if (filters?.category) { sql += ' AND category = ?'; params.push(filters.category); }
  if (filters?.status) { sql += ' AND status = ?'; params.push(filters.status); }
  
  sql += ' ORDER BY provider, name';
  if (filters?.limit) { sql += ' LIMIT ?'; params.push(filters.limit); }

  const rows = db.prepare(sql).all(...params) as any[];
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    provider: r.provider,
    category: r.category,
    description: r.description,
    authType: r.auth_type as any,
    apiKey: r.api_key ? decrypt(r.api_key) : undefined,
    clientId: r.client_id,
    clientSecret: r.client_secret ? decrypt(r.client_secret) : undefined,
    refreshToken: r.refresh_token ? decrypt(r.refresh_token) : undefined,
    serviceAccount: r.service_account,
    endpoint: r.endpoint,
    projectId: r.project_id,
    accountId: r.account_id,
    region: r.region,
    status: r.status as any,
    lastChecked: r.last_checked,
    lastResponseTime: r.last_response_time,
    lastStatusCode: r.last_status_code,
    lastError: r.last_error,
    totalCalls: r.total_calls,
    successfulCalls: r.successful_calls,
    failedCalls: r.failed_calls,
    averageResponseTime: r.average_response_time,
    rateLimit: r.rate_limit,
    rateLimitPeriod: r.rate_limit_period,
    quotaUsed: r.quota_used,
    quotaLimit: r.quota_limit,
    quotaResetAt: r.quota_reset_at,
    tags: JSON.parse(r.tags || '[]'),
    metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function getApiById(id: string): ExternalApi | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM external_apis WHERE id = ?').get(id) as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    category: row.category,
    description: row.description,
    authType: row.auth_type as any,
    apiKey: row.api_key ? decrypt(row.api_key) : undefined,
    clientId: row.client_id,
    clientSecret: row.client_secret ? decrypt(row.client_secret) : undefined,
    refreshToken: row.refresh_token ? decrypt(row.refresh_token) : undefined,
    serviceAccount: row.service_account,
    endpoint: row.endpoint,
    projectId: row.project_id,
    accountId: row.account_id,
    region: row.region,
    status: row.status as any,
    lastChecked: row.last_checked,
    lastResponseTime: row.last_response_time,
    lastStatusCode: row.last_status_code,
    lastError: row.last_error,
    totalCalls: row.total_calls,
    successfulCalls: row.successful_calls,
    failedCalls: row.failed_calls,
    averageResponseTime: row.average_response_time,
    rateLimit: row.rate_limit,
    rateLimitPeriod: row.rate_limit_period,
    quotaUsed: row.quota_used,
    quotaLimit: row.quota_limit,
    quotaResetAt: row.quota_reset_at,
    tags: JSON.parse(row.tags || '[]'),
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function addApi(data: Omit<ExternalApi, 'id' | 'createdAt' | 'updatedAt'>): ExternalApi {
  const db = getDb();
  const id = `api-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO external_apis (
      id, name, provider, category, description, auth_type, api_key, client_id,
      client_secret, refresh_token, service_account, endpoint, project_id,
      account_id, region, status, last_checked, last_response_time,
      last_status_code, last_error, total_calls, successful_calls,
      failed_calls, average_response_time, rate_limit, rate_limit_period,
      quota_used, quota_limit, quota_reset_at, tags, metadata, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `).run(
    id,
    data.name,
    data.provider,
    data.category,
    data.description,
    data.authType,
    data.apiKey ? encrypt(data.apiKey) : null,
    data.clientId || null,
    data.clientSecret ? encrypt(data.clientSecret) : null,
    data.refreshToken ? encrypt(data.refreshToken) : null,
    data.serviceAccount || null,
    data.endpoint || null,
    data.projectId || null,
    data.accountId || null,
    data.region || null,
    data.status,
    data.lastChecked,
    data.lastResponseTime || null,
    data.lastStatusCode || null,
    data.lastError || null,
    data.totalCalls,
    data.successfulCalls,
    data.failedCalls,
    data.averageResponseTime,
    data.rateLimit || null,
    data.rateLimitPeriod || null,
    data.quotaUsed || null,
    data.quotaLimit || null,
    data.quotaResetAt || null,
    JSON.stringify(data.tags || []),
    data.metadata ? JSON.stringify(data.metadata) : null,
    now,
    now
  );
  
  return { id, ...data, createdAt: now, updatedAt: now };
}

export function updateApi(id: string, updates: Partial<ExternalApi>): boolean {
  const db = getDb();
  const existing = getApiById(id);
  if (!existing) return false;
  
  const fields: string[] = [];
  const values: any[] = [];
  
  // 构建更新字段
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
  if (updates.apiKey !== undefined) { fields.push('api_key = ?'); values.push(updates.apiKey ? encrypt(updates.apiKey) : null); }
  if (updates.clientId !== undefined) { fields.push('client_id = ?'); values.push(updates.clientId); }
  if (updates.clientSecret !== undefined) { fields.push('client_secret = ?'); values.push(updates.clientSecret ? encrypt(updates.clientSecret) : null); }
  if (updates.refreshToken !== undefined) { fields.push('refresh_token = ?'); values.push(updates.refreshToken ? encrypt(updates.refreshToken) : null); }
  if (updates.lastResponseTime !== undefined) { fields.push('last_response_time = ?'); values.push(updates.lastResponseTime); }
  if (updates.lastStatusCode !== undefined) { fields.push('last_status_code = ?'); values.push(updates.lastStatusCode); }
  if (updates.lastError !== undefined) { fields.push('last_error = ?'); values.push(updates.lastError); }
  if (updates.totalCalls !== undefined) { fields.push('total_calls = ?'); values.push(updates.totalCalls); }
  if (updates.successfulCalls !== undefined) { fields.push('successful_calls = ?'); values.push(updates.successfulCalls); }
  if (updates.failedCalls !== undefined) { fields.push('failed_calls = ?'); values.push(updates.failedCalls); }
  if (updates.averageResponseTime !== undefined) { fields.push('average_response_time = ?'); values.push(updates.averageResponseTime); }
  if (updates.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(updates.tags)); }
  
  // 总是更新最后检查时间和更新时间
  fields.push('last_checked = ?');
  values.push(new Date().toISOString());
  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  
  if (fields.length === 0) return true; // 没有更新
  
  const sql = `UPDATE external_apis SET ${fields.join(', ')} WHERE id = ?`;
  values.push(id);
  
  try {
    db.prepare(sql).run(...values);
    return true;
  } catch (error) {
    console.error('更新API失败:', error);
    return false;
  }
}

export function deleteApi(id: string): boolean {
  const db = getDb();
  try {
    db.prepare('DELETE FROM external_apis WHERE id = ?').run(id);
    return true;
  } catch (error) {
    console.error('删除API失败:', error);
    return false;
  }
}

export function recordApiCheck(result: Omit<ApiCheckResult, 'id'>): ApiCheckResult {
  const db = getDb();
  const id = `check-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  
  db.prepare(`
    INSERT INTO api_check_results (id, api_id, timestamp, response_time, status_code, success, error, data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    result.apiId,
    result.timestamp,
    result.responseTime,
    result.statusCode || null,
    result.success ? 1 : 0,
    result.error || null,
    result.data ? JSON.stringify(result.data) : null
  );
  
  // 更新API统计信息
  const api = getApiById(result.apiId);
  if (api) {
    const totalCalls = api.totalCalls + 1;
    const successfulCalls = api.successfulCalls + (result.success ? 1 : 0);
    const failedCalls = api.failedCalls + (result.success ? 0 : 1);
    
    // 计算平均响应时间
    const newAvg = (api.averageResponseTime * api.totalCalls + result.responseTime) / totalCalls;
    
    updateApi(result.apiId, {
      lastChecked: result.timestamp,
      lastResponseTime: result.responseTime,
      lastStatusCode: result.statusCode,
      lastError: result.error,
      totalCalls,
      successfulCalls,
      failedCalls,
      averageResponseTime: newAvg,
      status: result.success ? 'active' : 'error',
    });
  }
  
  return { id, ...result };
}

export function getApiCheckResults(filters?: {
  apiId?: string;
  limit?: number;
  success?: boolean;
}): ApiCheckResult[] {
  const db = getDb();
  let sql = 'SELECT * FROM api_check_results WHERE 1=1';
  const params: any[] = [];
  
  if (filters?.apiId) { sql += ' AND api_id = ?'; params.push(filters.apiId); }
  if (filters?.success !== undefined) { sql += ' AND success = ?'; params.push(filters.success ? 1 : 0); }
  
  sql += ' ORDER BY timestamp DESC';
  if (filters?.limit) { sql += ' LIMIT ?'; params.push(filters.limit); }
  
  const rows = db.prepare(sql).all(...params) as any[];
  return rows.map(r => ({
    id: r.id,
    apiId: r.api_id,
    timestamp: r.timestamp,
    responseTime: r.response_time,
    statusCode: r.status_code,
    success: r.success === 1,
    error: r.error,
    data: r.data ? JSON.parse(r.data) : undefined,
  }));
}

export function getApiStats() {
  const db = getDb();
  const apis = getAllApis();
  
  const stats = {
    totalApis: apis.length,
    activeApis: apis.filter(a => a.status === 'active').length,
    inactiveApis: apis.filter(a => a.status === 'inactive').length,
    needsSetupApis: apis.filter(a => a.status === 'needs_setup').length,
    errorApis: apis.filter(a => a.status === 'error').length,
    
    byProvider: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    
    totalCalls: apis.reduce((sum, a) => sum + a.totalCalls, 0),
    successfulCalls: apis.reduce((sum, a) => sum + a.successfulCalls, 0),
    failedCalls: apis.reduce((sum, a) => sum + a.failedCalls, 0),
    
    averageResponseTime: apis.length > 0 
      ? apis.reduce((sum, a) => sum + a.averageResponseTime, 0) / apis.length 
      : 0,
    
    recentChecks: getApiCheckResults({ limit: 10 }),
  };
  
  // 按提供商统计
  apis.forEach(api => {
    stats.byProvider[api.provider] = (stats.byProvider[api.provider] || 0) + 1;
    stats.byCategory[api.category] = (stats.byCategory[api.category] || 0) + 1;
  });
  
  return stats;
}

export function createAlert(alert: Omit<ApiAlert, 'id' | 'createdAt'>): ApiAlert {
  const db = getDb();
  const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO api_alerts (id, api_id, type, severity, message, details, resolved, resolved_at, resolved_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    alert.apiId,
    alert.type,
    alert.severity,
    alert.message,
    alert.details ? JSON.stringify(alert.details) : null,
    alert.resolved ? 1 : 0,
    alert.resolvedAt || null,
    alert.resolvedBy || null,
    now
  );
  
  return { id, ...alert, createdAt: now };
}

export function getAlerts(filters?: {
  apiId?: string;
  resolved?: boolean;
  severity?: string;
  limit?: number;
}): ApiAlert[] {
  const db = getDb();
  let sql = 'SELECT * FROM api_alerts WHERE 1=1';
  const params: any[] = [];
  
  if (filters?.apiId) { sql += ' AND api_id = ?'; params.push(filters.apiId); }
  if (filters?.resolved !== undefined) { sql += ' AND resolved = ?'; params.push(filters.resolved ? 1 : 0); }
  if (filters?.severity) { sql += ' AND severity = ?'; params.push(filters.severity); }
  
  sql += ' ORDER BY created_at DESC';
  if (filters?.limit) { sql += ' LIMIT ?'; params.push(filters.limit); }
  
  const rows = db.prepare(sql).all(...params) as any[];
  return rows.map(r => ({
    id: r.id,
    apiId: r.api_id,
    type: r.type as any,
    severity: r.severity as any,
    message: r.message,
    details: r.details ? JSON.parse(r.details) : undefined,
    resolved: r.resolved === 1,
    resolvedAt: r.resolved_at,
    resolvedBy: r.resolved_by,
    createdAt: r.created_at,
  }));
}

export function resolveAlert(id: string, resolvedBy: string): boolean {
  const db = getDb();
  try {
    db.prepare(`
      UPDATE api_alerts 
      SET resolved = 1, resolved_at = ?, resolved_by = ?
      WHERE id = ?
    `).run(new Date().toISOString(), resolvedBy, id);
    return true;
  } catch (error) {
    console.error('解决告警失败:', error);
    return false;
  }
}

// 兼容接口
export const externalApiStore = {
  getAllApis,
  getApiById,
  addApi,
  updateApi,
  deleteApi,
  recordApiCheck,
  getApiCheckResults,
  getApiStats,
  createAlert,
  getAlerts,
  resolveAlert,
};