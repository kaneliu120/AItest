#!/usr/bin/env node

/**
 * 生产环境配置和密钥管理
 * 基于WORKFLOW_AUTO.md晚间主动推进授权
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('='.repeat(80));
console.log('🔐 生产环境配置和密钥管理');
console.log('='.repeat(80));
console.log('时间: ' + new Date().toLocaleString('zh-CN'));
console.log('授权: ✅ 基于WORKFLOW_AUTO.md晚间主动推进授权');
console.log('目标: 设置环境变量、密钥管理、安全配置');
console.log('='.repeat(80));

// 生成安全的随机密钥
function generateSecureKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// 创建Mission Control生产环境配置
function setupMissionControlConfig() {
  console.log('\n📊 配置Mission Control生产环境...');
  
  const configDir = '/Users/kane/mission-control/config';
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // 1. 主环境变量文件
  const envContent = `# Mission Control 生产环境配置
# ============================================
# 重要: 将此文件复制为 .env.production 并填写实际值
# 不要将此文件提交到版本控制
# ============================================

# 应用配置
NODE_ENV=production
APP_NAME=Mission Control
APP_VERSION=1.0.0
APP_PORT=3001
APP_URL=http://localhost:3001
API_URL=http://localhost:3001/api

# 安全配置 - 必须更改这些值!
JWT_SECRET=${generateSecureKey(64)}
ENCRYPTION_KEY=${generateSecureKey(32)}
SESSION_SECRET=${generateSecureKey(32)}
CSRF_SECRET=${generateSecureKey(32)}

# 数据库配置
DATABASE_URL=postgresql://postgres:${generateSecureKey(16)}@localhost:5432/mission_control_prod
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_SSL=false

# Redis配置
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=${generateSecureKey(16)}
REDIS_TTL=3600

# 监控配置
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
LOKI_ENABLED=true
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true

# 日志配置
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=/var/log/mission-control/app.log
LOG_ROTATION_SIZE=100MB
LOG_RETENTION_DAYS=30

# 性能配置
CACHE_ENABLED=true
CACHE_TTL=3600
COMPRESSION_ENABLED=true
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# 业务系统集成
FINANCE_API_URL=http://localhost:3001/api/finance
FREELANCE_API_URL=http://localhost:3001/api/freelance
TASKS_API_URL=http://localhost:3001/api/tasks
KNOWLEDGE_API_URL=http://localhost:8000/api/v1
MYSKILLSHOP_API_URL=https://skills-store-api-bjbddhaeathndkap.southeastasia-01.azurewebsites.net

# 阶段系统配置
UNIFIED_GATEWAY_URL=http://localhost:3001/api/v1/unified
TASK_DISPATCHER_URL=http://localhost:3001/api/v2/dispatcher
KNOWLEDGE_DEV_URL=http://localhost:3001/api/v4/knowledge-dev
AUTOMATION_URL=http://localhost:3001/api/v5/automation
MONITORING_URL=http://localhost:3001/api/v6/monitoring
INTEGRATION_URL=http://localhost:3001/api/integration

# 外部服务配置 (需要填写实际值)
# OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# GROK_API_KEY=grok-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# GOOGLE_CLOUD_PROJECT=your-project-id
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
# AZURE_STORAGE_CONNECTION_STRING=your-connection-string

# SMTP邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@mission-control.local

# Discord Webhook (用于告警)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-id/your-webhook-token

# Telegram Bot (用于告警)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# 备份配置
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"  # 每天凌晨2点
BACKUP_RETENTION_DAYS=30
BACKUP_PATH=/var/backups/mission-control

# 安全配置
CORS_ORIGINS=["http://localhost:3000","http://localhost:3001"]
CORS_CREDENTIALS=true
HELMET_ENABLED=true
CONTENT_SECURITY_POLICY_ENABLED=true
HSTS_ENABLED=true
XSS_PROTECTION_ENABLED=true
NO_SNIFF_ENABLED=true
FRAMEGUARD_ENABLED=true

# 调试配置 (生产环境应设为false)
DEBUG=false
VERBOSE_LOGGING=false
SHOW_ERROR_DETAILS=false`;

  const envPath = path.join(configDir, '.env.production.template');
  fs.writeFileSync(envPath, envContent);
  console.log(`   ✅ 环境变量模板: ${envPath}`);
  
  // 2. 密钥管理配置
  const keyManagementConfig = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    keyRotation: {
      jwtSecret: '90 days',
      encryptionKey: '180 days',
      databasePassword: '365 days',
      apiKeys: '30 days'
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      keyDerivation: 'pbkdf2',
      iterations: 100000
    },
    storage: {
      type: 'environment-variables',
      backup: 'encrypted-file',
      location: '/Users/kane/mission-control/config/keys.enc'
    },
    accessControl: {
      read: ['system', 'admin'],
      write: ['admin'],
      rotate: ['admin']
    }
  };
  
  const keyConfigPath = path.join(configDir, 'key-management.json');
  fs.writeFileSync(keyConfigPath, JSON.stringify(keyManagementConfig, null, 2));
  console.log(`   ✅ 密钥管理配置: ${keyConfigPath}`);
  
  // 3. 安全策略配置
  const securityPolicy = `# Mission Control 安全策略
# ============================================

## 1. 认证和授权
- 所有API端点必须经过JWT认证
- 使用RBAC (基于角色的访问控制)
- 会话超时: 30分钟
- 密码策略: 最小长度12字符，包含大小写字母、数字、特殊字符
- 多因素认证: 可选，推荐用于管理员账户

## 2. 数据保护
- 所有敏感数据必须加密存储
- 数据库连接使用SSL/TLS
- 传输中的数据使用HTTPS
- 定期备份和加密备份数据
- 数据保留策略: 用户数据保留2年，日志保留30天

## 3. API安全
- 速率限制: 100请求/15分钟
- 输入验证: 所有输入必须验证和清理
- SQL注入防护: 使用参数化查询
- XSS防护: 内容安全策略启用
- CSRF防护: 所有状态更改操作需要CSRF令牌

## 4. 监控和审计
- 记录所有认证尝试
- 记录所有敏感操作
- 实时监控异常活动
- 定期安全审计
- 漏洞扫描: 每周一次

## 5. 应急响应
- 安全事件必须在1小时内报告
- 数据泄露必须在24小时内通知受影响用户
- 备份恢复测试: 每月一次
- 安全补丁: 在发布后7天内应用

## 6. 合规性
- 遵循GDPR数据保护原则
- 遵循PCI DSS支付卡标准
- 遵循ISO 27001信息安全标准
- 定期合规性检查: 每季度一次

## 7. 密钥管理
- 密钥必须定期轮换
- 密钥必须加密存储
- 访问密钥需要多重认证
- 密钥使用必须记录和审计

## 8. 第三方集成
- 所有第三方API必须经过安全评估
- 使用最小权限原则
- 定期审查第三方访问权限
- 监控第三方API使用情况`;

  const securityPolicyPath = path.join(configDir, 'security-policy.md');
  fs.writeFileSync(securityPolicyPath, securityPolicy);
  console.log(`   ✅ 安全策略: ${securityPolicyPath}`);
  
  return {
    envTemplate: envPath,
    keyManagement: keyConfigPath,
    securityPolicy: securityPolicyPath
  };
}

// 创建知识管理系统生产环境配置
function setupKnowledgeSystemConfig() {
  console.log('\n📚 配置知识管理系统生产环境...');
  
  const configDir = '/Users/kane/knowledge-management-system/config';
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // 1. 后端环境变量
  const backendEnv = `# 知识管理系统后端 生产环境配置
# ============================================

# 应用配置
FASTAPI_ENV=production
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8000
FASTAPI_RELOAD=false
FASTAPI_DEBUG=false

# 数据库配置
DATABASE_URL=sqlite:///./data/knowledge_prod.db
# 或使用PostgreSQL
# DATABASE_URL=postgresql://postgres:${generateSecureKey(16)}@localhost:5432/knowledge_db_prod

# 向量数据库配置
CHROMA_PERSIST_DIRECTORY=./data/chroma_prod
CHROMA_EMBEDDING_MODEL=BAAI/bge-m3
CHROMA_CACHE_SIZE=1000

# Grok AI配置
GROK_API_KEY=your-grok-api-key-here  # 必须填写实际值
GROK_MODEL=grok-4-fast-reasoning
GROK_TEMPERATURE=0.7
GROK_MAX_TOKENS=2000
GROK_TIMEOUT=30

# 安全配置
SECRET_KEY=${generateSecureKey(64)}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
PASSWORD_HASH_ALGORITHM=bcrypt
PASSWORD_HASH_ROUNDS=12

# CORS配置
CORS_ORIGINS=["http://localhost:3000","http://localhost:3001","http://localhost:8080"]
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=["GET","POST","PUT","DELETE","OPTIONS"]
CORS_ALLOW_HEADERS=["*"]

# 监控配置
PROMETHEUS_METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true
METRICS_PORT=9091

# 性能配置
CACHE_ENABLED=true
CACHE_TTL=1800
CACHE_MAX_SIZE=1000
MAX_FILE_SIZE_MB=50
MAX_DOCUMENTS_PER_BATCH=100
WORKER_POOL_SIZE=4

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/backend_prod.log
LOG_FORMAT=json
LOG_ROTATION=100MB
LOG_RETENTION=30

# 数据保留策略
DOCUMENT_RETENTION_DAYS=365
VECTOR_RETENTION_DAYS=180
LOG_RETENTION_DAYS=30
BACKUP_RETENTION_DAYS=90

# 备份配置
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 3 * * *"  # 每天凌晨3点
BACKUP_PATH=./backups
BACKUP_ENCRYPTION=true

# 外部集成
OPENCLAW_API_URL=http://localhost:3001/api
MISSION_CONTROL_API_URL=http://localhost:3001/api/v1/unified
EXTERNAL_KNOWLEDGE_SOURCES=["arxiv","wikipedia","github"]`;

  const backendEnvPath = path.join(configDir, '.env.backend.production.template');
  fs.writeFileSync(backendEnvPath, backendEnv);
  console.log(`   ✅ 后端环境变量模板: ${backendEnvPath}`);
  
  // 2. 前端环境变量
  const frontendEnv = `# 知识管理系统前端 生产环境配置
# ============================================

# 应用配置
NEXT_PUBLIC_APP_NAME=知识管理系统
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 功能开关
NEXT_PUBLIC_ENABLE_GROK=true
NEXT_PUBLIC_ENABLE_VECTOR_SEARCH=true
NEXT_PUBLIC_ENABLE_DOCUMENT_UPLOAD=true
NEXT_PUBLIC_ENABLE_BATCH_PROCESSING=true

# 性能配置
NEXT_PUBLIC_CACHE_ENABLED=true
NEXT_PUBLIC_PAGINATION_SIZE=20
NEXT_PUBLIC_SEARCH_TIMEOUT=10000
NEXT_PUBLIC_UPLOAD_TIMEOUT=30000

# 监控配置
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your-ga-id
NEXT_PUBLIC_HOTJAR_ID=your-hotjar-id

# 外部服务
NEXT_PUBLIC_GROK_ENABLED=true
NEXT_PUBLIC_OPENAI_ENABLED=false
NEXT_PUBLIC_CLAUDE_ENABLED=false

# 安全配置
NEXT_PUBLIC_CSP_ENABLED=true
NEXT_PUBLIC_HSTS_ENABLED=true
NEXT_PUBLIC_XSS_PROTECTION_ENABLED=true

# 开发工具 (生产环境应为false)
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_VERBOSE_LOGGING=false`;

  const frontendEnvPath = path.join(configDir, '.env.frontend.production.template');
  fs.writeFileSync(frontendEnvPath, frontendEnv);
  console.log(`   ✅ 前端环境变量模板: ${frontendEnvPath}`);
  
  // 3. 数据管理配置
  const dataConfig = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    databases: {
      primary: {
        type: 'sqlite',
        path: './data/knowledge_prod.db',
        backup: {
          enabled: true,
          schedule: 'daily',
          retention: '90 days'
        }
      },
      vector: {
        type: 'chroma',
        path: './data/chroma_prod',
        embeddingModel: 'BAAI/bge-m3',
        cacheSize: 1000
      }
    },
    retention: {
      documents: '365 days',
      vectors: '180 days',
      logs: '30 days',
      backups: '90 days'
    },
    encryption: {
      enabled: true,
      algorithm: 'aes-256-gcm',
      keyRotation: '90 days'
    },
    accessControl: {
      read: ['authenticated'],
      write: ['editor', 'admin'],
      delete: ['admin']
    }
  };
  
  const dataConfigPath = path.join(configDir, 'data-management.json');
  fs.writeFileSync(dataConfigPath, JSON.stringify(dataConfig, null, 2));
  console.log(`   ✅ 数据管理配置: ${dataConfigPath}`);
  
  return {
    backendEnv: backendEnvPath,
    frontendEnv: frontendEnvPath,
    dataConfig: dataConfigPath
  };
}

// 创建密钥管理脚本
function createKeyManagementScript() {
  console.log('\n🔑 创建密钥管理脚本...');
  
  const scriptsDir = '/Users/kane/mission-control/scripts/security';
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }
  
  // 1. 密钥生成脚本
  const keyGenScript = `#!/bin/bash

# 密钥生成和管理脚本
# 基于WORKFLOW_AUTO.md晚间主动推进授权

set -e

echo "🔑 密钥生成和管理"
echo "时间: \$(date)"
echo "=".repeat(60)

# 颜色定义
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m'

# 日志函数
log_info() { echo -e "\${GREEN}[INFO]\${NC} \$1"; }
log_warn() { echo -e "\${YELLOW}[WARN]\${NC} \$1"; }
log_error() { echo -e "\${RED}[ERROR]\${NC} \$1"; }

# 生成随机密钥
generate_key() {
    local length=\${1:-32}
    openssl rand -hex \$((length/2))
}

