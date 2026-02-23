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
        log