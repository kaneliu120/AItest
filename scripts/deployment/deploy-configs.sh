#!/bin/bash

# 生产环境配置部署脚本
# 基于WORKFLOW_AUTO.md晚间主动推进授权

set -e

echo "🚀 生产环境配置部署"
echo "时间: $(date)"
echo "=".repeat(60)

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 日志函数
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 备份现有配置
backup_existing_configs() {
    log_info "备份现有配置..."
    
    local backup_dir="/Users/kane/mission-control/config/backups/config-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # 备份Mission Control配置
    if [ -f "/Users/kane/mission-control/.env.production" ]; then
        cp "/Users/kane/mission-control/.env.production" "${backup_dir}/mission-control.env"
    fi
    
    if [ -f "/Users/kane/mission-control/pm2.config.json" ]; then
        cp "/Users/kane/mission-control/pm2.config.json" "${backup_dir}/pm2.config.json"
    fi
    
    # 备份知识管理系统配置
    if [ -f "/Users/kane/knowledge-management-system/.env.production" ]; then
        cp "/Users/kane/knowledge-management-system/.env.production" "${backup_dir}/knowledge-system.env"
    fi
    
    log_info "配置备份完成: $backup_dir"
}

# 部署Mission Control配置
deploy_mission_control_config() {
    log_info "部署Mission Control配置..."
    
    local config_dir="/Users/kane/mission-control/config"
    
    # 检查模板文件
    if [ ! -f "${config_dir}/.env.production.template" ]; then
        logerror "环境变量模板不存在: ${config_dir}/.env.production.template"
        return 1
    fi
    
    # 如果环境文件不存在，从模板创建
    local env_file="/Users/kane/mission-control/.env.production"
    if [ ! -f "$env_file" ]; then
        log_info "创建环境变量文件..."
        cp "${config_dir}/.env.production.template" "$env_file"
        log_warn "请编辑 $env_file 并填写实际值"
    else
        log_info "环境变量文件已存在: $env_file"
    fi
    
    # 设置文件权限
    chmod 600 "$env_file" 2>/dev/null || true
    
    # 部署PM2配置
    if [ -f "${config_dir}/pm2.config.json" ]; then
        cp "${config_dir}/pm2.config.json" "/Users/kane/mission-control/pm2.config.json"
        log_info "PM2配置已部署"
    fi
    
    # 部署Nginx配置
    local nginx_dir="/Users/kane/mission-control/nginx"
    if [ -d "$nginx_dir" ]; then
        log_info "Nginx配置目录存在: $nginx_dir"
        # 这里可以添加Nginx配置部署逻辑
    fi
    
    log_info "Mission Control配置部署完成"
}

# 部署知识管理系统配置
deploy_knowledge_system_config() {
    log_info "部署知识管理系统配置..."
    
    local config_dir="/Users/kane/knowledge-management-system/config"
    
    # 检查后端模板
    if [ -f "${config_dir}/.env.backend.production.template" ]; then
        local backend_env="/Users/kane/knowledge-management-system/.env.production"
        if [ ! -f "$backend_env" ]; then
            log_info "创建后端环境变量文件..."
            cp "${config_dir}/.env.backend.production.template" "$backend_env"
            log_warn "请编辑 $backend_env 并填写实际值（特别是Grok API Key）"
        else
            log_info "后端环境变量文件已存在: $backend_env"
        fi
        
        # 设置文件权限
        chmod 600 "$backend_env" 2>/dev/null || true
    fi
    
    # 检查前端模板
    if [ -f "${config_dir}/.env.frontend.production.template" ]; then
        local frontend_env="/Users/kane/knowledge-management-system/frontend/.env.local"
        if [ ! -f "$frontend_env" ]; then
            log_info "创建前端环境变量文件..."
            cp "${config_dir}/.env.frontend.production.template" "$frontend_env"
        else
            log_info "前端环境变量文件已存在: $frontend_env"
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
    if [ -f "$mission_env" ]; then
        local size=$(wc -l < "$mission_env")
        echo "   ✅ 环境文件存在 ($size 行)"
        
        # 检查关键配置
        if grep -q "NODE_ENV=production" "$mission_env"; then
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
    if [ -f "$knowledge_env" ]; then
        echo "   ✅ 后端环境文件存在"
        
        if grep -q "GROK_API_KEY=" "$knowledge_env" && \
           ! grep -q "your-grok-api-key-here" "$knowledge_env"; then
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
    
    for file in "${env_files[@]}"; do
        if [ -f "$file" ]; then
            local perms=$(stat -f "%Sp" "$file" 2>/dev/null || stat -c "%A" "$file")
            if [[ "$perms" == *"rw-------" ]] || [[ "$perms" == "-rw-------" ]]; then
                echo "   ✅ $file: 权限正常"
            else
                echo "   ⚠️  $file: 权限过宽 ($perms)"
                echo "   💡 建议: chmod 600 $file"
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
        
        for service in "${services[@]}"; do
            IFS=':' read -r name port <<< "$service"
            
            if curl -s --connect-timeout 5 "http://localhost:$port/health" > /dev/null 2>&1 || \
               curl -s --connect-timeout 5 "http://localhost:$port" > /dev/null 2>&1; then
                echo "   ✅ $name 健康 (端口: $port)"
            else
                echo "   ⚠️  $name 可能仍在启动中 (端口: $port)"
            fi
        done
    else
        log_warn "PM2未安装，无法自动重启服务"
        log_info "请手动重启服务以应用新配置"
    fi
}

# 生成部署报告
generate_deployment_report() {
    local report_file="/Users/kane/mission-control/config/deployment-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "$report_file" << EOF
生产环境配置部署报告
============================================
部署时间: $(date)
部署脚本: $0
部署用户: $(whoami)
============================================

1. 备份信息:
   - 备份目录: /Users/kane/mission-control/config/backups/

2. 部署的配置文件:
   - Mission Control: /Users/kane/mission-control/.env.production
   - 知识管理系统: /Users/kane/knowledge-management-system/.env.production
   - PM2配置: /Users/kane/mission-control/pm2.config.json

3. 配置验证结果:
   - Mission Control环境文件: $(if [ -f "/Users/kane/mission-control/.env.production" ]; then echo "存在"; else echo "不存在"; fi)
   - 知识管理系统环境文件: $(if [ -f "/Users/kane/knowledge-management-system/.env.production" ]; then echo "存在"; else echo "不存在"; fi)
   - Grok API Key配置: $(if [ -f "/Users/kane/knowledge-management-system/.env.production" ] && grep -q "GROK_API_KEY=" "/Users/kane/knowledge-management-system/.env.production" && ! grep -q "your-grok-api-key-here" "/Users/kane/knowledge-management-system/.env.production"; then echo "已配置"; else echo "未配置"; fi)

4. 服务状态:
   - Mission Control: $(curl -s --connect-timeout 3 http://localhost:3001/health > /dev/null && echo "健康" || echo "不可达")
   - 知识管理前端: $(curl -s --connect-timeout 3 http://localhost:3000 > /dev/null && echo "运行" || echo "不可达")
   - 知识管理后端: $(curl -s --connect-timeout 3 http://localhost:8000/health > /dev/null && echo "健康" || echo "不可达")

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
    
    log_info "部署报告已生成: $report_file"
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
    
    if [[ "$restart_choice" == "y" || "$restart_choice" == "Y" ]]; then
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
main "$@"