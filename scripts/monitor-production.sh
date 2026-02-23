#!/bin/bash

# 生产环境监控脚本
# 基于WORKFLOW_AUTO.md晚间主动推进授权

echo "🔍 生产环境监控检查"
echo "时间: $(date)"
echo "============================================================"

# 检查服务健康
check_service() {
    local name=$1
    local url=$2
    
    if curl -s --connect-timeout 5 "$url" > /dev/null 2>&1; then
        echo "✅ $name: 健康 ($url)"
        return 0
    else
        echo "❌ $name: 不可达 ($url)"
        return 1
    fi
}

# 检查系统资源
check_resources() {
    echo ""
    echo "📊 系统资源检查:"
    
    # CPU使用率
    local cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
    echo "   CPU使用率: $cpu_usage%"
    
    # 内存使用率
    local mem_total=$(sysctl -n hw.memsize)
    local mem_wired=$(vm_stat | grep "Pages wired down" | awk '{print $4}' | sed 's/\.//')
    local mem_active=$(vm_stat | grep "Pages active" | awk '{print $3}' | sed 's/\.//')
    local page_size=$(vm_stat | grep "page size" | awk '{print $8}' | sed 's/\.//')
    
    local mem_used=$(( ($mem_wired + $mem_active) * $page_size ))
    local mem_percent=$(( $mem_used * 100 / $mem_total ))
    
    echo "   内存使用率: $mem_percent%"
    
    # 磁盘使用率
    local disk_usage=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
    echo "   磁盘使用率: $disk_usage%"
    
    # 检查阈值
    if [ $cpu_usage -gt 80 ]; then
        echo "   ⚠️ 警告: CPU使用率过高"
    fi
    
    if [ $mem_percent -gt 80 ]; then
        echo "   ⚠️ 警告: 内存使用率过高"
    fi
    
    if [ $disk_usage -gt 80 ]; then
        echo "   ⚠️ 警告: 磁盘使用率过高"
    fi
}

# 检查服务
echo "🔧 服务健康检查:"
check_service "Mission Control" "http://localhost:3001/health"
check_service "知识管理前端" "http://localhost:3000"
check_service "知识管理后端" "http://localhost:8000/health"
check_service "统一API网关" "http://localhost:3001/api/v1/unified?action=process&q=test"
check_service "监控系统" "http://localhost:3001/api/v6/monitoring?action=status"

# 检查资源
check_resources

# 检查PM2进程
echo ""
echo "📋 PM2进程状态:"
if command -v pm2 &> /dev/null; then
    pm2 list
else
    echo "   PM2未安装"
fi

# 生成报告
echo ""
echo "📈 监控报告生成完成"
echo "============================================================"
echo "建议:"
echo "   1. 定期运行此脚本监控系统状态"
echo "   2. 配置cron定时任务自动监控"
echo "   3. 设置告警通知（如Discord/Telegram）"
echo "   4. 定期备份重要数据"
echo "============================================================"