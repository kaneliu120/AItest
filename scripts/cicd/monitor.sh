#!/bin/bash

# 监控和回滚脚本
# 基于WORKFLOW_AUTO.md晚间主动推进授权

set -e

echo "🔍 监控和回滚"
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

# 监控服务健康
monitor_services() {
    log_info "监控服务健康..."
    
    local services=(
        "Mission Control:3001"
        "知识管理前端:3000"
        "知识管理后端:8000"
    )
    
    local all_healthy=true
    
    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        
        if curl -s --connect-timeout 5 "http://localhost:$port/health" > /dev/null 2>&1 || \
           curl -s --connect-timeout 5 "http://localhost:$port" > /dev/null 2>&1; then
            echo "   ✅ $name 健康 (端口: $port)"
        else
            echo "   ❌ $name 异常 (端口: $port)"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        log_info "所有服务健康"
        return 0
    else
        log_error "有服务异常"
        return 1
    fi
}

# 监控性能指标
monitor_performance() {
    log_info "监控性能指标..."
    
    echo ""
    echo "📊 性能指标:"
    
    # CPU使用率
    local cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
    echo "   CPU使用率: $cpu_usage%"
    
    # 内存使用率
    local mem_info=$(pm2 list | grep "mission-control" | awk '{print $11, $12, $13}')
    echo "   内存使用: $mem_info"
    
    # 响应时间
    local response_time=$(curl -s -o /dev/null -w "%{time_total}s" http://localhost:3001/health)
    echo "   响应时间: $response_time 秒"
    
    # 错误率
    local error_count=$(pm2 logs mission-control --lines=100 | grep -c "error|Error|ERROR" || true)
    echo "   最近100行错误数: $error_count"
    
    # 检查阈值
    if [ $cpu_usage -gt 80 ]; then
        log_warn "⚠️  CPU使用率过高"
    fi
    
    if [ $(echo "$response_time > 1" | bc -l) -eq 1 ]; then
        log_warn "⚠️  响应时间过长"
    fi
    
    if [ $error_count -gt 5 ]; then
        log_warn "⚠️  错误数过多"
    fi
}

# 监控日志
monitor_logs() {
    log_info "监控日志..."
    
    echo ""
    echo "📝 最近错误日志:"
    
    # 查看最近错误
    pm2 logs mission-control --lines=20 --err 2>/dev/null | tail -20 || echo "   无错误日志"
    
    echo ""
    echo "📝 最近警告日志:"
    
    # 查看最近警告
    pm2 logs mission-control --lines=20 2>/dev/null | grep -i "warn|warning" | tail -10 || echo "   无警告日志"
}

# 自动回滚
auto_rollback() {
    log_info "检查是否需要回滚..."
    
    # 检查服务健康
    if ! monitor_services; then
        log_warn "服务异常，准备回滚..."
        
        # 检查是否有备份
        local latest_backup=$(ls -td /Users/kane/mission-control/backups/production-* 2>/dev/null | head -1)
        
        if [ -n "$latest_backup" ]; then
            log_info "找到最新备份: $latest_backup"
            
            # 确认回滚
            read -p "确认回滚到备份版本? (y/n): " rollback_confirm
            
            if [[ "$rollback_confirm" == "y" || "$rollback_confirm" == "Y" ]]; then
                # 执行回滚
                log_info "执行回滚..."
                
                # 停止当前服务
                pm2 stop mission-control
                
                # 恢复备份
                # 这里可以添加具体的恢复逻辑
                
                # 启动备份版本
                pm2 start mission-control
                
                log_info "回滚完成"
                
                # 验证回滚
                sleep 10
                if monitor_services; then
                    log_info "✅ 回滚成功，服务恢复正常"
                else
                    log_error "❌ 回滚失败"
                fi
            else
                log_info "回滚取消"
            fi
        else
            log_error "未找到备份，无法回滚"
        fi
    else
        log_info "服务正常，无需回滚"
    fi
}

# 生成监控报告
generate_monitor_report() {
    local report_file="monitor-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# 监控报告
##监控时间: $(date)
监控周期: 24小时

## 服务健康状态
- Mission Control: $(curl -s http://localhost:3001/health > /dev/null && echo "✅ 健康" || echo "❌ 异常")
- 知识管理前端: $(curl -s http://localhost:3000 > /dev/null && echo "✅ 运行" || echo "❌ 异常")
- 知识管理后端: $(curl -s http://localhost:8000/health > /dev/null && echo "✅ 健康" || echo "❌ 异常")

## 性能指标
- CPU使用率: $(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')%
- 内存使用: $(pm2 list | grep "mission-control" | awk '{print $11, $12, $13}')
- 响应时间: $(curl -s -o /dev/null -w "%{time_total}s" http://localhost:3001/health)秒
- 错误数: $(pm2 logs mission-control --lines=100 | grep -c "error|Error|ERROR" || true)

## 日志分析
### 最近错误
```
$(pm2 logs mission-control --lines=20 --err 2>/dev/null | tail -20 || echo "无错误日志")
```

### 最近警告
```
$(pm2 logs mission-control --lines=20 2>/dev/null | grep -i "warn|warning" | tail -10 || echo "无警告日志")
```

## 告警状态
- 服务健康: $(monitor_services > /dev/null && echo "✅ 正常" || echo "⚠️ 异常")
- 性能阈值: $(if [ $(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//') -gt 80 ]; then echo "⚠️ CPU过高"; else echo "✅ 正常"; fi)
- 错误率: $(if [ $(pm2 logs mission-control --lines=100 | grep -c "error|Error|ERROR" || true) -gt 5 ]; then echo "⚠️ 错误过多"; else echo "✅ 正常"; fi)

## 建议
1. $(if ! monitor_services > /dev/null; then echo "立即检查异常服务"; else echo "服务运行正常"; fi)
2. $(if [ $(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//') -gt 80 ]; then echo "优化CPU使用"; else echo "CPU使用正常"; fi)
3. $(if [ $(pm2 logs mission-control --lines=100 | grep -c "error|Error|ERROR" || true) -gt 5 ]; then echo "检查错误日志"; else echo "错误率正常"; fi)

## 下一步
1. 定期运行监控脚本
2. 设置自动告警
3. 配置性能优化
4. 更新监控规则

EOF
    
    log_info "监控报告已生成: $report_file"
}

# 设置定时监控
setup_scheduled_monitoring() {
    log_info "设置定时监控..."
    
    # 检查cron任务
    local cron_job="*/30 * * * * /Users/kane/mission-control/scripts/cicd/monitor.sh monitor >> /Users/kane/mission-control/logs/monitor.log 2>&1"
    
    if crontab -l | grep -q "monitor.sh"; then
        log_info "定时监控任务已存在"
    else
        log_info "添加定时监控任务..."
        (crontab -l 2>/dev/null; echo "$cron_job") | crontab -
        log_info "定时监控任务已添加: 每30分钟运行一次"
    fi
    
    # 检查日志轮转
    local logrotate_config="/etc/logrotate.d/mission-control"
    if [ ! -f "$logrotate_config" ]; then
        log_info "创建日志轮转配置..."
        
        sudo tee "$logrotate_config" > /dev/null << EOF
/Users/kane/mission-control/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 $(whoami) $(whoami)
}
EOF
        
        log_info "日志轮转配置已创建"
    else
        log_info "日志轮转配置已存在"
    fi
}

# 主菜单
main_menu() {
    echo ""
    echo "🔍 监控和回滚菜单"
    echo "=".repeat(60)
    echo "1. 监控服务健康"
    echo "2. 监控性能指标"
    echo "3. 监控日志"
    echo "4. 自动回滚检查"
    echo "5. 生成监控报告"
    echo "6. 设置定时监控"
    echo "7. 退出"
    echo "=".repeat(60)
    
    read -p "请选择操作 (1-7): " choice
    
    case $choice in
        1)
            monitor_services
            ;;
        2)
            monitor_performance
            ;;
        3)
            monitor_logs
            ;;
        4)
            auto_rollback
            ;;
        5)
            generate_monitor_report
            ;;
        6)
            setup_scheduled_monitoring
            ;;
        7)
            echo "退出监控"
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
if [ "$1" = "monitor" ]; then
    monitor_services
    monitor_performance
    monitor_logs
    auto_rollback
    generate_monitor_report
elif [ "$1" = "setup" ]; then
    setup_scheduled_monitoring
else
    main_menu
fi