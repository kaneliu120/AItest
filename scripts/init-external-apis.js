#!/usr/bin/env node
/**
 * 初始化外部API数据库
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'external-apis.db');

// 确保 data/ 目录存在
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// 删除旧数据库
if (fs.existsSync(DB_PATH)) {
  console.log('删除旧数据库...');
  fs.unlinkSync(DB_PATH);
}

// 创建新数据库
console.log('创建新数据库...');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// 建表
console.log('创建表结构...');
db.exec(`
  CREATE TABLE external_apis (
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
  
  CREATE TABLE api_check_results (
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
  
  CREATE TABLE api_alerts (
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
  CREATE INDEX idx_apis_provider ON external_apis(provider);
  CREATE INDEX idx_apis_category ON external_apis(category);
  CREATE INDEX idx_apis_status ON external_apis(status);
  CREATE INDEX idx_check_results_api ON api_check_results(api_id);
  CREATE INDEX idx_check_results_time ON api_check_results(timestamp);
  CREATE INDEX idx_alerts_api ON api_alerts(api_id);
  CREATE INDEX idx_alerts_resolved ON api_alerts(resolved);
`);

// 插入种子数据
console.log('插入种子数据...');
const seeds = [
  // Google APIs
  {
    id: 'api-google-1',
    name: 'Google Analytics 4',
    provider: 'google',
    category: 'analytics',
    description: '网站和应用数据分析',
    auth_type: 'service_account',
    service_account: 'claw-analytics-sa@claw-analytics-153.iam.gserviceaccount.com',
    project_id: 'claw-analytics-153',
    status: 'active',
    tags: JSON.stringify(['google', 'analytics', 'ga4', 'data']),
  },
  {
    id: 'api-google-2',
    name: 'Google Ads',
    provider: 'google',
    category: 'ads',
    description: '广告数据管理和优化',
    auth_type: 'oauth',
    status: 'needs_setup',
    tags: JSON.stringify(['google', 'ads', 'marketing']),
  },
  {
    id: 'api-google-3',
    name: 'Google Cloud Platform',
    provider: 'google',
    category: 'cloud',
    description: '云基础设施和服务',
    auth_type: 'service_account',
    status: 'active',
    tags: JSON.stringify(['google', 'cloud', 'gcp', 'infrastructure']),
  },
  
  // AI APIs
  {
    id: 'api-openai-1',
    name: 'OpenAI API',
    provider: 'openai',
    category: 'ai',
    description: 'GPT、Whisper、DALL-E AI服务',
    auth_type: 'api_key',
    status: 'active',
    tags: JSON.stringify(['openai', 'ai', 'gpt', 'whisper', 'dalle']),
  },
  {
    id: 'api-anthropic-1',
    name: 'Anthropic Claude',
    provider: 'anthropic',
    category: 'ai',
    description: 'Claude AI模型服务',
    auth_type: 'api_key',
    status: 'active',
    tags: JSON.stringify(['anthropic', 'ai', 'claude', 'sonnet']),
  },
  {
    id: 'api-deepseek-1',
    name: 'DeepSeek API',
    provider: 'deepseek',
    category: 'ai',
    description: 'DeepSeek AI模型服务',
    auth_type: 'api_key',
    status: 'active',
    tags: JSON.stringify(['deepseek', 'ai', 'chat']),
  },
  
  // 开发工具
  {
    id: 'api-github-1',
    name: 'GitHub API',
    provider: 'github',
    category: 'development',
    description: '代码仓库管理和CI/CD',
    auth_type: 'token',
    status: 'active',
    tags: JSON.stringify(['github', 'git', 'ci-cd', 'development']),
  },
  {
    id: 'api-azure-1',
    name: 'Azure云服务',
    provider: 'azure',
    category: 'cloud',
    description: 'Azure App Service和SQL Database',
    auth_type: 'service_principal',
    status: 'active',
    tags: JSON.stringify(['azure', 'cloud', 'app-service', 'sql']),
  },
  
  // 社交媒体
  {
    id: 'api-linkedin-1',
    name: 'LinkedIn API',
    provider: 'linkedin',
    category: 'social',
    description: 'LinkedIn内容发布和管理',
    auth_type: 'api_key',
    status: 'active',
    tags: JSON.stringify(['linkedin', 'social', 'marketing']),
  },
  
  // 其他
  {
    id: 'api-brave-1',
    name: 'Brave Search API',
    provider: 'brave',
    category: 'search',
    description: '网页搜索服务',
    auth_type: 'api_key',
    status: 'active',
    tags: JSON.stringify(['brave', 'search', 'web']),
  },
  {
    id: 'api-transcript-1',
    name: '转录API',
    provider: 'transcript',
    category: 'audio',
    description: '音频转录服务',
    auth_type: 'api_key',
    status: 'active',
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
    quota_used, quota_limit, quota_reset_at, tags, metadata, created_at, updated_at
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
  )
`);

const insertMany = db.transaction((rows) => {
  rows.forEach((r) => {
    const now = new Date().toISOString();
    insert.run(
      r.id,
      r.name,
      r.provider,
      r.category,
      r.description,
      r.auth_type,
      null, // api_key
      null, // client_id
      null, // client_secret
      null, // refresh_token
      r.service_account || null,
      null, // endpoint
      r.project_id || null,
      null, // account_id
      null, // region
      r.status,
      now, // last_checked
      null, // last_response_time
      null, // last_status_code
      null, // last_error
      0, // total_calls
      0, // successful_calls
      0, // failed_calls
      0, // average_response_time
      null, // rate_limit
      null, // rate_limit_period
      null, // quota_used
      null, // quota_limit
      null, // quota_reset_at
      r.tags,
      null, // metadata
      now, // created_at
      now  // updated_at
    );
  });
});

insertMany(seeds);

// 验证数据
console.log('验证数据...');
const count = db.prepare('SELECT COUNT(*) as n FROM external_apis').get().n;
console.log(`✅ 成功插入 ${count} 个API配置`);

// 显示统计
const stats = db.prepare(`
  SELECT 
    provider,
    COUNT(*) as count,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN status = 'needs_setup' THEN 1 ELSE 0 END) as needs_setup
  FROM external_apis 
  GROUP BY provider
  ORDER BY count DESC
`).all();

console.log('\n提供商统计:');
stats.forEach(s => {
  console.log(`  ${s.provider}: ${s.count}个 (${s.active}活跃, ${s.needs_setup}待配置)`);
});

console.log('\n✅ 外部API数据库初始化完成!');
console.log(`数据库位置: ${DB_PATH}`);
console.log('\n访问地址:');
console.log('  • 外部API监控页面: http://localhost:3001/external-apis');
console.log('  • 外部API API: http://localhost:3001/api/external-apis');
console.log('  • 系统监控页面: http://localhost:3001/system-monitoring');

db.close();