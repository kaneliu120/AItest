#!/bin/bash
# Mission Control 监控脚本

set -e

LOG_FILE="/Users/kane/mission-control/logs/monitor.log"
MAX_RETRIES=3
RETRY_DELAY=10
HEALTH_THRESHOLD=50

# 创建日志目录
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_health() {
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/api/health" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        local health_score
        health_score=$(curl -s "http://localhost:3001/api/health" 2>/dev/null | grep -o '"overallHealth":[0-9]*' | cut -d: -f2)
        
        if [ -n "$health_score" ]; then
            if [ "$health_score" -lt "$HEALTH_THRESHOLD" ]; then
                log "⚠️ 健康状态较低: ${health_score}% (阈值: ${HEALTH_THRESHOLD}%)"
                return 2
            else
                log "✅ 健康状态良好: ${health_score}%"
                return 0
            fi
        else
            log "⚠️ 无法获取健康分数"
            return 1
        fi
    else
        log "❌ 服务不可用 (HTTP: $response)"
        return 1
    fi
}

check_pm2_status() {
    local status
    status=$(pm2 status mission-control 2>/dev/null | grep -E "online|stopped|errored" | head -1 | awk '{print $18}')
    
    case "$status" in
        "online")
            log "✅ PM2状态: 运行中"
            return 0
            ;;
        "stopped")
            log "⚠️ PM2状态: 已停止"
            return 1
            ;;
        "errored")
            log "❌ PM2状态: 错误"
            return 2
            ;;
        *)
            log "❓ PM2状态: 未知 ($status)"
            return 3
            ;;
    esac
}

restart_service() {
    log "尝试重启服务..."
    
    # 停止服务
    pm2 stop mission-control 2>/dev/null || true
    sleep 2
    
    # 清理可能的内存泄漏
    pkill -f "next.*3001" 2>/dev/null || true
    sleep 1
    
    # 重启服务
    pm2 restart mission-control
    
    # 等待服务就绪
    local attempts=0
    while [ $attempts -lt 10 ]; do
        if check_health; then
            log "✅ 服务重启成功"
            return 0
        fi
        sleep 3
        attempts=$((attempts + 1))
    done
    
    log "❌ 服务重启失败"
    return 1
}

main_monitor() {
    log "开始监控 Mission Control 服务..."
    
    local consecutive_failures=0
    
    while true; do
        # 检查PM2状态
        if ! check_pm2_status; then
            log "PM2状态异常，尝试恢复..."
            if restart_service; then
                consecutive_failures=0
            else
                consecutive_failures=$((consecutive_failures + 1))
            fi
        fi
        
        # 检查健康状态
        if ! check_health; then
            consecutive_failures=$((consecutive_failures + 1))
            log "健康检查失败，连续失败次数: $consecutive_failures"
            
            if [ $consecutive_failures -ge $MAX_RETRIES ]; then
                log "达到最大失败次数 ($MAX_RETRIES)，执行重启..."
                if restart_service; then
                    consecutive_failures=0
                    log "✅ 重启成功，重置失败计数"
                else
                    log "❌ 重启失败，等待 $RETRY_DELAY 秒后重试"
                    sleep $RETRY_DELAY
                fi
            fi
        else
            # 健康状态良好，重置失败计数
            if [ $consecutive_failures -gt 0 ]; then
                log "✅ 服务恢复健康，重置失败计数"
                consecutive_failures=0
            fi
        fi
        
        # 记录资源使用情况
        local pm2_info
        pm2_info=$(pm2 show mission-control 2>/dev/null | grep -E "cpu|mem" | head -2)
        if [ -n "$pm2_info" ]; then
            log "资源使用: $pm2_info"
        fi
        
        # 每60秒检查一次
        sleep 60
    done
}

# 处理命令行参数
case "$1" in
    start)
        main_monitor
        ;;
    status)
        echo "=== Mission Control 状态检查 ==="
        check_pm2_status
        check_health
        echo "=== 最近监控日志 ==="
        tail -20 "$LOG_FILE" 2>/dev/null || echo "无日志文件"
        ;;
    restart)
        restart_service
        ;;
    log)
        tail -f "$LOG_FILE"
        ;;
    *)
        echo "使用方法: $0 {start|status|restart|log}"
        echo "  start   - 启动监控"
        echo "  status  - 检查状态"
        echo "  restart - 重启服务"
        echo "  log     - 查看监控日志"
        exit 1
        ;;
esac