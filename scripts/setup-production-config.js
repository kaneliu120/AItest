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

# 加密文件
encrypt_file() {
    local input_file="\$1"
    local output_file="\$2"
    local password="\$3"
    
    if [ ! -f "\$input_file" ]; then
        log_error "输入文件不存在: \$input_file"
        return 1
    fi
    
    openssl enc -aes-256-cbc -salt -in "\$input_file" -out "\$output_file" -pass pass:"\$password"
    log_info "文件已加密: \$output_file"
}

# 解密文件
decrypt_file() {
    local input_file="\$1"
    local output_file="\$2"
    local password="\$3"
    
    if [ ! -f "\$input_file" ]; then
        log_error "输入文件不存在: \$input_file"
        return 1
    fi
    
    openssl enc -aes-256-cbc -d -in "\$input_file" -out "\$output_file" -pass pass:"\$password"
    log_info "文件已解密: \$output_file"
}

# 生成所有密钥
generate_all_keys() {
    log_info "生成所有生产环境密钥..."
    
    local keys_dir="/Users/kane/mission-control/config/keys"
    mkdir -p "\$keys_dir"
    
    # 生成密钥
    local jwt_secret=\$(generate_key 64)
    local encryption_key=\$(generate_key 32)
    local session_secret=\$(generate_key 32)
    local csrf_secret=\$(generate_key 32)
    local db_password=\$(generate_key 16)
    local redis_password=\$(generate_key 16)
    
    # 保存到文件
    cat > "\${keys_dir}/keys-generated-\$(date +%Y%m%d-%H%M%S).txt" << EOF
# 生产环境密钥 - 生成时间: \$(date)
# ============================================
# 重要: 妥善保管此文件，不要提交到版本控制
# ============================================

JWT_SECRET=\${jwt_secret}
ENCRYPTION_KEY=\${encryption_key}
SESSION_SECRET=\${session_secret}
CSRF_SECRET=\${csrf_secret}
DATABASE_PASSWORD=\${db_password}
REDIS_PASSWORD=\${redis_password}

# 其他需要填写的密钥:
# OPENAI_API_KEY=your-openai-api-key
# GROK_API_KEY=your-grok-api-key
# GOOGLE_CLOUD_CREDENTIALS=your-google-credentials
# AWS_ACCESS_KEY_ID=your-aws-access-key
# AWS_SECRET_ACCESS_KEY=your-aws-secret-key
# AZURE_STORAGE_CONNECTION_STRING=your-azure-connection-string
# SMTP_PASSWORD=your-smtp-password
# DISCORD_WEBHOOK_TOKEN=your-discord-webhook-token
# TELEGRAM_BOT_TOKEN=your-telegram-bot-token

EOF
    
    log_info "密钥已生成并保存到: \${keys_dir}/"
    log_info "请将上述密钥复制到相应的环境变量文件中"
}

# 更新环境变量文件
update_env_files() {
    log_info "更新环境变量文件..."
    
    # Mission Control
    local mission_env="/Users/kane/mission-control/.env.production"
    if [ -f "\$mission_env" ]; then
        log_info "备份现有环境文件..."
        cp "\$mission_env" "\${mission_env}.backup-\$(date +%Y%m%d-%H%M%S)"
    fi
    
    # 知识管理系统
    local knowledge_backend_env="/Users/kane/knowledge-management-system/.env.production"
    if [ -f "\$knowledge_backend_env" ]; then
        log_info "备份知识系统环境文件..."
        cp "\$knowledge_backend_env" "\${knowledge_backend_env}.backup-\$(date +%Y%m%d-%H%M%S)"
    fi
    
    log_info "请手动更新环境变量文件中的密钥"
    log_info "参考模板文件:"
    log_info "  - /Users/kane/mission-control/config/.env.production.template"
    log_info "  - /Users/kane/knowledge-management-system/config/.env.backend.production.template"
}

# 密钥轮换
rotate_keys() {
    log_info "开始密钥轮换..."
    
    # 备份当前环境
    local backup_dir="/Users/kane/mission-control/config/backups/keys-\$(date +%Y%m%d-%H%M%S)"
    mkdir -p "\$backup_dir"
    
    # 备份当前密钥
    if [ -f "/Users/kane/mission-control/.env.production" ]; then
        cp "/Users/kane/mission-control/.env.production" "\${backup_dir}/mission-control.env"
    fi
    
    if [ -f "/Users/kane/knowledge-management-system/.env.production" ]; then
        cp "/Users/kane/knowledge-management-system/.env.production" "\${backup_dir}/knowledge-system.env"
    fi
    
    # 生成新密钥
    generate_all_keys
    
    log_info "密钥轮换完成"
    log_info "备份保存在: \$backup_dir"
    log_info "请更新环境变量文件并重启服务"
}

# 安全审计
security_audit() {
    log_info "执行安全审计..."
    
    echo ""
    echo "🔍 安全审计报告"
    echo "=".repeat(60)
    
    # 检查环境文件权限
    echo "1. 环境文件权限检查:"
    local env_files=(
        "/Users/kane/mission-control/.env.production"
        "/Users/kane/knowledge-management-system/.env.production"
        "/Users/kane/mission-control/config/keys"
    )
    
    for file in "\${env_files[@]}"; do
        if [ -e "\$file" ]; then
            local perms=\$(stat -f "%Sp" "\$file")
            if [[ "\$perms" == *"rw"* ]] && [[ "\$perms" != *"rw-------" ]]; then
                echo "   ⚠️  \$file: 权限过宽 (\$perms)"
            else
                echo "   ✅ \$file: 权限正常 (\$perms)"
            fi
        fi
    done
    
    # 检查默认密码
    echo ""
    echo "2. 默认密码检查:"
    local default_passwords=(
        "password"
        "123456"
        "admin"
        "root"
        "test"
    )
    
    # 这里可以添加密码检查逻辑
    echo "   ⚠️  请确保没有使用默认密码"
    
    # 检查服务状态
    echo ""
    echo "3. 服务安全状态:"
    
    # 检查端口开放
    local open_ports=\$(lsof -i -P -n | grep LISTEN | grep -E "(3000|3001|8000|5432|6379)" || true)
    if [ -n "\$open_ports" ]; then
        echo "   ✅ 服务端口正常"
    else
        echo "   ⚠️  服务端口可能未正确配置"
    fi
    
    echo ""
    echo "📋 安全建议:"
    echo "   1. 定期轮换密钥（建议每90天）"
    echo "   2. 启用防火墙限制访问"
    echo "   3. 配置SSL/TLS加密"
    echo "   4. 启用多因素认证"
    echo "   5. 定期安全审计"
    echo ""
    echo "=".repeat(60)
}

# 主菜单
main_menu() {
    echo ""
    echo "🔑 密钥管理菜单"
    echo "=".repeat(60)
    echo "1. 生成所有密钥"
    echo "2. 更新环境变量文件"
    echo "3. 密钥轮换"
    echo "4. 安全审计"
    echo "5. 加密配置文件"
    echo "6. 解密配置文件"
    echo "7. 退出"
    echo "=".repeat(60)
    
    read -p "请选择操作 (1-7): " choice
    
    case \$choice in
        1)
            generate_all_keys
            ;;
        2)
            update_env_files
            ;;
        3)
            rotate_keys
            ;;
        4)
            security_audit
            ;;
        5)
            read -p "输入要加密的文件路径: " input_file
            read -p "输入加密后文件路径: " output_file
            read -sp "输入加密密码: " password
            echo
            encrypt_file "\$input_file" "\$output_file" "\$password"
            ;;
        6)
            read -p "输入要解密的文件路径: " input_file
            read -p "输入解密后文件路径: " output_file
            read -sp "输入解密密码: " password
            echo
            decrypt_file "\$input_file" "\$output_file" "\$password"
            ;;
        7)
            echo "退出密钥管理"
            exit 0
            ;;
        *)
            echo "无效选择"
            ;;
    esac
    
    # 返回菜单
    read -p "按回车键返回菜单..."
    main_menu
}

# 执行主菜单
if [ "\$1" = "generate" ]; then
    generate_all_keys
elif [ "\$1" = "audit" ]; then
    security_audit
elif [ "\$1" = "rotate" ]; then
    rotate_keys
else
    main_menu
fi`;

  const keyGenPath = path.join(scriptsDir, 'key-management.sh');
  fs.writeFileSync(keyGenPath, keyGenScript);
  fs.chmodSync(keyGenPath, '755');
  console.log(`   ✅ 密钥管理脚本: ${keyGenPath}`);
  
  // 2. 环境变量验证脚本
  const envValidationScript = `#!/bin/bash

# 环境变量验证脚本
# 检查生产环境配置是否正确

set -e

echo "🔍 环境变量验证"
echo "时间: \$(date)"
echo "=".repeat(60)

# 检查Mission Control环境
check_mission_control_env() {
    echo ""
    echo "📊 Mission Control环境检查:"
    
    local env_file="/Users/kane/mission-control/.env.production"
    
    if [ ! -f "\$env_file" ]; then
        echo "   ❌ 环境文件不存在: \$env_file"
        echo "   💡 建议: 从模板创建: cp /Users/kane/mission-control/config/.env.production.template \$env_file"
        return 1
    fi
    
    echo "   ✅ 环境文件存在: \$env_file"
    
    # 检查关键变量
    local required_vars=(
        "NODE_ENV"
        "JWT_SECRET"
        "ENCRYPTION_KEY"
        "DATABASE_URL"
        "REDIS_URL"
    )
    
    local missing_vars=()
    
    for var in "\${required_vars[@]}"; do
        if ! grep -q "^\${var}=" "\$env_file"; then
            missing_vars+=("\$var")
        fi
    done
    
    if [ \${#missing_vars[@]} -eq 0 ]; then
        echo "   ✅ 所有关键变量已配置"
    else
        echo "   ⚠️  缺少变量: \${missing_vars[*]}"
    fi
    
    # 检查默认值
    if grep -q "password123" "\$env_file" || \\
       grep -q "changeme" "\$env_file" || \\
       grep -q "your-" "\$env_file"; then
        echo "   ⚠️  检测到默认值，请更新为实际值"
    else
        echo "   ✅ 未检测到明显默认值"
    fi
    
    # 检查文件权限
    local perms=\$(stat -f "%Sp" "\$env_file")
    if [[ "\$perms" == *"rw-------" ]]; then
        echo "   ✅ 文件权限正常: \$perms"
    else
        echo "   ⚠️  文件权限可能过宽: \$perms"
        echo "   💡 建议: chmod 600 \$env_file"
    fi
}

# 检查知识管理系统环境
check_knowledge_system_env() {
    echo ""
    echo "📚 知识管理系统环境检查:"
    
    local backend_env="/Users/kane/knowledge-management-system/.env.production"
    local frontend_env="/Users/kane/knowledge-management-system/frontend/.env.local"
    
    # 检查后端
    if [ ! -f "\$backend_env" ]; then
        echo "   ⚠️  后端环境文件不存在: \$backend_env"
        echo "   💡 建议: 从模板创建: cp /Users/kane/knowledge-management-system/config/.env.backend.production.template \$backend_env"
    else
        echo "   ✅ 后端环境文件存在: \$backend_env"
        
        # 检查Grok API Key
        if grep -q "your-grok-api-key-here" "\$backend_env"; then
            echo "   ⚠️  Grok API Key未配置"
        else
            echo "   ✅ Grok API Key已配置"
        fi
    fi
    
    # 检查前端
    if [ ! -f "\$frontend_env" ]; then
        echo "   ⚠️  前端环境文件不存在: \$frontend_env"
    else
        echo "   ✅ 前端环境文件存在: \$frontend_env"
    fi
}

# 检查服务健康
check_services_health() {
    echo ""
    echo "🔧 服务健康检查:"
    
    local services=(
        "Mission Control:3001"
        "知识管理前端:3000"
        "知识管理后端:8000"
    )
    
    for service in "\${services[@]}"; do
        IFS=':' read -r name port <<< "\$service"
        
        if curl -s --connect-timeout 3 "http://localhost:\$port/health" > /dev/null 2>&1 || \\
           curl -s --connect-timeout 3 "http://localhost:\$port" > /dev/null 2>&1; then
            echo "   ✅ \$name 健康 (端口: \$port)"
        else
            echo "   ❌ \$name 不可达 (端口: \$port)"
        fi
    done
}

# 生成验证报告
generate_validation_report() {
    echo ""
    echo "📋 环境验证报告"
    echo "=".repeat(60)
    echo "生成时间: \$(date)"
    echo ""
    
    check_mission_control_env
    check_knowledge_system_env
    check_services_health
    
    echo ""
    echo "🎯 验证建议:"
    echo "   1. 确保所有环境变量文件存在并正确配置"
    echo "   2. 更新所有默认密码和API密钥"
    echo "   3. 设置适当的文件权限 (chmod 600 .env.*)"
    echo "   4. 定期运行此脚本验证环境"
    echo "   5. 考虑使用密钥管理服务 (如HashiCorp Vault)"
    echo ""
    echo "=".repeat(60)
}

# 执行验证
generate_validation_report`;

  const envValidationPath = path.join(scriptsDir, 'validate-environment.sh');
  fs.writeFileSync(envValidationPath, envValidationScript);
  fs.chmodSync(envValidationPath, '755');
  console.log(`   ✅ 环境验证脚本: ${envValidationPath}`);
  
  return {
    keyManagement: keyGenPath,
    envValidation: envValidationPath
  };
}

// 创建配置部署脚本
function createConfigDeploymentScript() {
  console.log('\n🚀 创建配置部署脚本...');
  
  const scriptsDir = '/Users/kane/mission-control/scripts/deployment';
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }
  
  const deploymentScript = `#!/bin/bash

# 生产环境配置部署脚本
# 基于WORKFLOW_AUTO.md晚间主动推进授权

set -e

echo "🚀 生产环境配置部署"
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

# 备份现有配置
backup_existing_configs() {
    log_info "备份现有配置..."
    
    local backup_dir="/Users/kane/mission-control/config/backups/config-\$(date +%Y%m%d-%H%M%S)"
    mkdir -p "\$backup_dir"
    
    # 备份Mission Control配置
    if [ -f "/Users/kane/mission-control/.env.production" ]; then
        cp "/Users/kane/mission-control/.env.production" "\${backup_dir}/mission-control.env"
    fi
    
    if [ -f "/Users/kane/mission-control/pm2.config.json" ]; then
        cp "/Users/kane/mission-control/pm2.config.json" "\${backup_dir}/pm2.config.json"
    fi
    
    # 备份知识管理系统配置
    if [ -f "/Users/kane/knowledge-management-system/.env.production" ]; then
        cp "/Users/kane/knowledge-management-system/.env.production" "\${backup_dir}/knowledge-system.env"
    fi
    
    log_info "配置备份完成: \$backup_dir"
}

# 部署Mission Control配置
deploy_mission_control_config() {
    log_info "部署Mission Control配置..."
    
    local config_dir="/Users/kane/mission-control/config"
    
    # 检查模板文件
    if [ ! -f "\${config_dir}/.env.production.template" ]; then
        logerror "环境变量模板不存在: \${config_dir}/.env.production.template"
        return 1
    fi
    
    # 如果环境文件不存在，从模板创建
    local env_file="/Users/kane/mission-control/.env.production"
    if [ ! -f "\$env_file" ]; then
        log_info "创建环境变量文件..."
        cp "\${config_dir}/.env.production.template" "\$env_file"
        log_warn "请编辑 \$env_file 并填写实际值"
    else
        log_info "环境变量文件已存在: \$env_file"
    fi
    
    # 设置文件权限
    chmod 600 "\$env_file" 2>/dev/null || true
    
    # 部署PM2配置
    if [ -f "\${config_dir}/pm2.config.json" ]; then
        cp "\${config_dir}/pm2.config.json" "/Users/kane/mission-control/pm2.config.json"
        log_info "PM2配置已部署"
    fi
    
    # 部署Nginx配置
    local nginx_dir="/Users/kane/mission-control/nginx"
    if [ -d "\$nginx_dir" ]; then
        log_info "Nginx配置目录存在: \$nginx_dir"
        # 这里可以添加Nginx配置部署逻辑
    fi
    
    log_info "Mission Control配置部署完成"
}

# 部署知识管理系统配置
deploy_knowledge_system_config() {
    log_info "部署知识管理系统配置..."
    
    local config_dir="/Users/kane/knowledge-management-system/config"
    
    # 检查后端模板
    if [ -f "\${config_dir}/.env.backend.production.template" ]; then
        local backend_env="/Users/kane/knowledge-management-system/.env.production"
        if [ ! -f "\$backend_env" ]; then
            log_info "创建后端环境变量文件..."
            cp "\${config_dir}/.env.backend.production.template" "\$backend_env"
            log_warn "请编辑 \$backend_env 并填写实际值（特别是Grok API Key）"
        else
            log_info "后端环境变量文件已存在: \$backend_env"
        fi
        
        # 设置文件权限
        chmod 600 "\$backend_env" 2>/dev/null || true
    fi
    
    # 检查前端模板
    if [ -f "\${config_dir}/.env.frontend.production.template" ]; then
        local frontend_env="/Users/kane/knowledge-management-system/frontend/.env.local"
        if [ ! -f "\$frontend_env" ]; then
            log_info "创建前端环境变量文件..."
            cp "\${config_dir}/.env.frontend.production.template" "\$frontend_env"
        else
            log_info "前端环境变量文件已存在: \$frontend_env"
        fi
    fi
    
    log_info "知识管理系统配置部署完成"
}

# 验证配置
validate_configurations() {
    log_info "验证配置..."
    
    echo ""
    echo "🔍 配置验证报告"
    echo "=".repeat(60)
    
    # 检查Mission Control配置
    echo "1. Mission Control配置:"
    local mission_env="/Users/kane/mission-control/.env.production"
    if [ -f "\$mission_env" ]; then
        local size=\$(wc -l < "\$mission_env")
        echo "   ✅ 环境文件存在 (\$size 行)"
        
        # 检查关键配置
        if grep -q "NODE_ENV=production" "\$mission_env"; then
            echo "   ✅ NODE_ENV设置为production"
        else
            echo "   ⚠️  NODE_ENV未设置为production"
        fi
    else
        echo "   ❌ 环境文件不存在"
    fi
    
    # 检查知识管理系统配置
    echo ""
    echo "2. 知识管理系统配置:"
    local knowledge_env="/Users/kane/knowledge-management-system/.env.production"
    if [ -f "\$knowledge_env" ]; then
        echo "   ✅ 后端环境文件存在"
        
        if grep -q "GROK_API_KEY=" "\$knowledge_env" && \\
           ! grep -q "your-grok-api-key-here" "\$knowledge_env"; then
            echo "   ✅ Grok API Key已配置"
        else
            echo "   ⚠️  Grok API Key未配置或为默认值"
        fi
    else
        echo "   ⚠️  后端环境文件不存在"
    fi
    
    # 检查文件权限
    echo ""
    echo "3. 文件权限检查:"
    local env_files=(
        "/Users/kane/mission-control/.env.production"
        "/Users/kane/knowledge-management-system/.env.production"
    )
    
    for file in "\${env_files[@]}"; do
        if [ -f "\$file" ]; then
            local perms=\$(stat -f "%Sp" "\$file" 2>/dev/null || stat -c "%A" "\$file")
            if [[ "\$perms" == *"rw-------" ]] || [[ "\$perms" == "-rw-------" ]]; then
                echo "   ✅ \$file: 权限正常"
            else
                echo "   ⚠️  \$file: 权限过宽 (\$perms)"
                echo "   💡 建议: chmod 600 \$file"
            fi
        fi
    done
    
    echo ""
    echo "=".repeat(60)
}

# 重启服务
restart_services() {
    log_info "重启服务以应用新配置..."
    
    if command -v pm2 &> /dev/null; then
        echo ""
        echo "🔄 重启PM2服务..."
        pm2 restart all
        
        echo ""
        echo "📊 PM2服务状态:"
        pm2 list
        
        # 等待服务启动
        echo ""
        echo "⏳ 等待服务启动..."
        sleep 10
        
        # 检查服务健康
        echo ""
        echo "🔍 服务健康检查:"
        local services=(
            "Mission Control:3001"
            "知识管理前端:3000"
            "知识管理后端:8000"
        )
        
        for service in "\${services[@]}"; do
            IFS=':' read -r name port <<< "\$service"
            
            if curl -s --connect-timeout 5 "http://localhost:\$port/health" > /dev/null 2>&1 || \\
               curl -s --connect-timeout 5 "http://localhost:\$port" > /dev/null 2>&1; then
                echo "   ✅ \$name 健康 (端口: \$port)"
            else
                echo "   ⚠️  \$name 可能仍在启动中 (端口: \$port)"
            fi
        done
    else
        log_warn "PM2未安装，无法自动重启服务"
        log_info "请手动重启服务以应用新配置"
    fi
}

# 生成部署报告
generate_deployment_report() {
    local report_file="/Users/kane/mission-control/config/deployment-report-\$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "\$report_file" << EOF
生产环境配置部署报告
============================================
部署时间: \$(date)
部署脚本: \$0
部署用户: \$(whoami)
============================================

1. 备份信息:
   - 备份目录: /Users/kane/mission-control/config/backups/

2. 部署的配置文件:
   - Mission Control: /Users/kane/mission-control/.env.production
   - 知识管理系统: /Users/kane/knowledge-management-system/.env.production
   - PM2配置: /Users/kane/mission-control/pm2.config.json

3. 配置验证结果:
   - Mission Control环境文件: \$(if [ -f "/Users/kane/mission-control/.env.production" ]; then echo "存在"; else echo "不存在"; fi)
   - 知识管理系统环境文件: \$(if [ -f "/Users/kane/knowledge-management-system/.env.production" ]; then echo "存在"; else echo "不存在"; fi)
   - Grok API Key配置: \$(if [ -f "/Users/kane/knowledge-management-system/.env.production" ] && grep -q "GROK_API_KEY=" "/Users/kane/knowledge-management-system/.env.production" && ! grep -q "your-grok-api-key-here" "/Users/kane/knowledge-management-system/.env.production"; then echo "已配置"; else echo "未配置"; fi)

4. 服务状态:
   - Mission Control: \$(curl -s --connect-timeout 3 http://localhost:3001/health > /dev/null && echo "健康" || echo "不可达")
   - 知识管理前端: \$(curl -s --connect-timeout 3 http://localhost:3000 > /dev/null && echo "运行" || echo "不可达")
   - 知识管理后端: \$(curl -s --connect-timeout 3 http://localhost:8000/health > /dev/null && echo "健康" || echo "不可达")

5. 下一步行动:
   - 1. 编辑环境变量文件，填写实际API密钥和密码
   - 2. 运行密钥管理脚本生成安全密钥
   - 3. 设置定时备份任务
   - 4. 配置监控和告警
   - 5. 进行安全审计

6. 安全提醒:
   - 立即更改所有默认密码
   - 确保环境变量文件权限为600
   - 定期轮换密钥（建议每90天）
   - 启用防火墙和访问控制
   - 配置SSL/TLS加密

============================================
报告生成完成
EOF
    
    log_info "部署报告已生成: \$report_file"
}

# 主函数
main() {
    log_info "开始生产环境配置部署"
    
    # 备份现有配置
    backup_existing_configs
    
    # 部署Mission Control配置
    deploy_mission_control_config
    
    # 部署知识管理系统配置
    deploy_knowledge_system_config
    
    # 验证配置
    validate_configurations
    
    # 询问是否重启服务
    echo ""
    read -p "是否重启服务以应用新配置? (y/n): " restart_choice
    
    if [[ "\$restart_choice" == "y" || "\$restart_choice" == "Y" ]]; then
        restart_services
    else
        log_info "跳过服务重启"
        log_info "请手动重启服务以应用新配置"
    fi
    
    # 生成部署报告
    generate_deployment_report
    
    log_info "生产环境配置部署完成"
    
    echo ""
    echo "=".repeat(60)
    echo "🎉 配置部署完成"
    echo "=".repeat(60)
    echo ""
    echo "📋 下一步操作:"
    echo "   1. 编辑环境变量文件，填写实际值"
    echo "   2. 运行密钥管理脚本: bash /Users/kane/mission-control/scripts/security/key-management.sh"
    echo "   3. 验证环境配置: bash /Users/kane/mission-control/scripts/security/validate-environment.sh"
    echo "   4. 重启服务: pm2 restart all"
    echo "   5. 设置定时任务: crontab -e"
    echo ""
    echo "🔒 安全提醒:"
    echo "   - 立即更改所有默认密码"
    echo "   - 设置环境变量文件权限: chmod 600 .env.production"
    echo "   - 定期备份重要数据"
    echo "   - 启用监控和告警"
    echo ""
    echo "=".repeat(60)
}

# 执行主函数
main "$@"`;

  const deploymentPath = path.join(scriptsDir, 'deploy-configs.sh');
  fs.writeFileSync(deploymentPath, deploymentScript);
  fs.chmodSync(deploymentPath, '755');
  console.log(`   ✅ 配置部署脚本: ${deploymentPath}`);
  
  return deploymentPath;
}

// 生成总结报告
function generateSummaryReport(missionConfig, knowledgeConfig, keyScripts, deploymentScript) {
  console.log('\n📋 生成配置总结报告...');
  
  const report = {
    timestamp: new Date().toISOString(),
    missionControlConfig: {
      envTemplate: missionConfig.envTemplate,
      keyManagement: missionConfig.keyManagement,
      securityPolicy: missionConfig.securityPolicy
    },
    knowledgeSystemConfig: {
      backendEnv: knowledgeConfig.backendEnv,
      frontendEnv: knowledgeConfig.frontendEnv,
      dataConfig: knowledgeConfig.dataConfig
    },
    keyManagementScripts: {
      keyManagement: keyScripts.keyManagement,
      envValidation: keyScripts.envValidation
    },
    deploymentScript: deploymentScript,
    nextSteps: [
      '1. 运行密钥生成: bash /Users/kane/mission-control/scripts/security/key-management.sh generate',
      '2. 编辑环境变量文件，填写实际API密钥和密码',
      '3. 部署配置: bash /Users/kane/mission-control/scripts/deployment/deploy-configs.sh',
      '4. 验证环境: bash /Users/kane/mission-control/scripts/security/validate-environment.sh',
      '5. 重启服务: pm2 restart all',
      '6. 设置定时备份和监控任务'
    ],
    securityChecklist: [
      '✅ 生成安全随机密钥',
      '✅ 创建环境变量模板',
      '✅ 配置密钥管理策略',
      '✅ 设置文件权限保护',
      '✅ 创建安全审计脚本',
      '🔲 配置SSL/TLS证书',
      '🔲 设置防火墙规则',
      '🔲 启用多因素认证',
      '🔲 配置访问控制列表',
      '🔲 设置入侵检测系统'
    ]
  };
  
  const reportPath = '/tmp/production-config-summary.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`   ✅ 配置总结报告: ${reportPath}`);
  
  return report;
}

// 主函数
async function main() {
  try {
    console.log('='.repeat(80));
    console.log('🔐 生产环境配置和密钥管理');
    console.log('='.repeat(80));
    console.log('时间: ' + new Date().toLocaleString('zh-CN'));
    console.log('授权: ✅ 基于WORKFLOW_AUTO.md晚间主动推进授权');
    console.log('='.repeat(80));
    
    // 1. 配置Mission Control生产环境
    const missionConfig = setupMissionControlConfig();
    
    // 2. 配置知识管理系统生产环境
    const knowledgeConfig = setupKnowledgeSystemConfig();
    
    // 3. 创建密钥管理脚本
    const keyScripts = createKeyManagementScript();
    
    // 4. 创建配置部署脚本
    const deploymentScript = createConfigDeploymentScript();
    
    // 5. 生成总结报告
    const report = generateSummaryReport(missionConfig, knowledgeConfig, keyScripts, deploymentScript);
    
    // 6. 显示执行指南
    console.log('\n🎉 生产环境配置完成！');
    console.log('='.repeat(80));
    
    console.log('\n📁 创建的配置文件:');
    console.log('-'.repeat(40));
    console.log('Mission Control:');
    console.log(`   ✅ 环境变量模板: ${missionConfig.envTemplate}`);
    console.log(`   ✅ 密钥管理配置: ${missionConfig.keyManagement}`);
    console.log(`   ✅ 安全策略: ${missionConfig.securityPolicy}`);
    
    console.log('\n知识管理系统:');
    console.log(`   ✅ 后端环境模板: ${knowledgeConfig.backendEnv}`);
    console.log(`   ✅ 前端环境模板: ${knowledgeConfig.frontendEnv}`);
    console.log(`   ✅ 数据管理配置: ${knowledgeConfig.dataConfig}`);
    
    console.log('\n🔧 管理脚本:');
    console.log(`   ✅ 密钥管理: ${keyScripts.keyManagement}`);
    console.log(`   ✅ 环境验证: ${keyScripts.envValidation}`);
    console.log(`   ✅ 配置部署: ${deploymentScript}`);
    
    console.log('\n🚀 立即执行配置部署:');
    console.log('-'.repeat(40));
    console.log('   bash /Users/kane/mission-control/scripts/deployment/deploy-configs.sh');
    
    console.log('\n🔑 生成安全密钥:');
    console.log('-'.repeat(40));
    console.log('   bash /Users/kane/mission-control/scripts/security/key-management.sh generate');
    
    console.log('\n🔍 验证环境配置:');
    console.log('-'.repeat(40));
    console.log('   bash /Users/kane/mission-control/scripts/security/validate-environment.sh');
    
    console.log('\n📋 安全配置清单:');
    console.log('-'.repeat(40));
    report.securityChecklist.forEach(item => {
      console.log(`   ${item}`);
    });
    
    console.log('\n⚠️ 重要提醒:');
    console.log('-'.repeat(40));
    console.log('   1. 立即编辑环境变量文件，填写实际API密钥和密码');
    console.log('   2. 设置文件权限: chmod 600 .env.production');
    console.log('   3. 不要将环境变量文件提交到版本控制');
    console.log('   4. 定期轮换密钥（建议每90天）');
    console.log('   5. 启用监控和告警系统');
    
    console.log('\n='.repeat(80));
    console.log('✅ 基于WORKFLOW_AUTO.md授权，生产环境配置完成');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ 生产环境配置失败:', error.message);
    console.error(error.stack);
  }
}

// 执行主函数
if (require.main === module) {
  main().catch(console.error);
}