#!/bin/bash

# 环境变量验证脚本
# 检查生产环境配置是否正确

set -e

echo "🔍 环境变量验证"
echo "时间: $(date)"
echo "=".repeat(60)

# 检查Mission Control环境
check_mission_control_env() {
    echo ""
    echo "📊 Mission Control环境检查:"
    
    local env_file="/Users/kane/mission-control/.env.production"
    
    if [ ! -f "$env_file" ]; then
        echo "   ❌ 环境文件不存在: $env_file"
        echo "   💡 建议: 从模板创建: cp /Users/kane/mission-control/config/.env.production.template $env_file"
        return 1
    fi
    
    echo "   ✅ 环境文件存在: $env_file"
    
    # 检查关键变量
    local required_vars=(
        "NODE_ENV"
        "JWT_SECRET"
        "ENCRYPTION_KEY"
        "DATABASE_URL"
        "REDIS_URL"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" "$env_file"; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        echo "   ✅ 所有关键变量已配置"
    else
        echo "   ⚠️  缺少变量: ${missing_vars[*]}"
    fi
    
    # 检查默认值
    if grep -q "password123" "$env_file" || \
       grep -q "changeme" "$env_file" || \
       grep -q "your-" "$env_file"; then
        echo "   ⚠️  检测到默认值，请更新为实际值"
    else
        echo "   ✅ 未检测到明显默认值"
    fi
    
    # 检查文件权限
    local perms=$(stat -f "%Sp" "$env_file")
    if [[ "$perms" == *"rw-------" ]]; then
        echo "   ✅ 文件权限正常: $perms"
    else
        echo "   ⚠️  文件权限可能过宽: $perms"
        echo "   💡 建议: chmod 600 $env_file"
    fi
}

# 检查知识管理系统环境
check_knowledge_system_env() {
    echo ""
    echo "📚 知识管理系统环境检查:"
    
    local backend_env="/Users/kane/knowledge-management-system/.env.production"
    local frontend_env="/Users/kane/knowledge-management-system/frontend/.env.local"
    
    # 检查后端
    if [ ! -f "$backend_env" ]; then
        echo "   ⚠️  后端环境文件不存在: $backend_env"
        echo "   💡 建议: 从模板创建: cp /Users/kane/knowledge-management-system/config/.env.backend.production.template $backend_env"
    else
        echo "   ✅ 后端环境文件存在: $backend_env"
        
        # 检查Grok API Key
        if grep -q "your-grok-api-key-here" "$backend_env"; then
            echo "   ⚠️  Grok API Key未配置"
        else
            echo "   ✅ Grok API Key已配置"
        fi
    fi
    
    # 检查前端
    if [ ! -f "$frontend_env" ]; then
        echo "   ⚠️  前端环境文件不存在: $frontend_env"
    else
        echo "   ✅ 前端环境文件存在: $frontend_env"
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
    
    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        
        if curl -s --connect-timeout 3 "http://localhost:$port/health" > /dev/null 2>&1 || \
           curl -s --connect-timeout 3 "http://localhost:$port" > /dev/null 2>&1; then
            echo "   ✅ $name 健康 (端口: $port)"
        else
            echo "   ❌ $name 不可达 (端口: $port)"
        fi
    done
}

# 生成验证报告
generate_validation_report() {
    echo ""
    echo "📋 环境验证报告"
    echo "=".repeat(60)
    echo "生成时间: $(date)"
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
generate_validation_report