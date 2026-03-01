#!/bin/bash
# Mission Control 稳定运行脚本
# 自动重启、监控和恢复服务

set -e

MISSION_CONTROL_DIR="/Users/kane/mission-control"
PORT=3001
LOG_FILE="/Users/kane/mission-control/logs/mission-control.log"
PID_FILE="/Users/kane/mission-control/logs/mission-control.pid"
MAX_RESTARTS=3
RESTART_DELAY=10

# 创建日志目录
mkdir -p "$(dirname "$LOG_FILE")"

# 函数：检查服务是否运行
check_service() {
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" | grep -q "200"; then
        return 0
    else
        return 1
    fi
}

# 函数：获取进程PID
get_pid() {
    if [ -f "$PID_FILE" ]; then
        cat "$PID_FILE"
    else
        echo ""
    fi
}

# 函数：停止服务
stop_service() {
    local pid=$(get_pid)
    if [ -n "$pid" ]; then
        echo "停止服务 (PID: $pid)..."
        kill -TERM "$pid" 2>/dev/null || true
        sleep 2
        # 确保进程停止
        if ps -p "$pid" > /dev/null 2>&1; then
            kill -KILL "$pid" 2>/dev/null || true
        fi
        rm -f "$PID_FILE"
    fi
    
    # 清理其他Next.js进程
    pkill -f "next.*$PORT" 2>/dev/null || true
    sleep 1
}

# 函数：启动服务
start_service() {
    echo "启动 Mission Control 服务 (端口: $PORT)..."
    
    # 切换到项目目录
    cd "$MISSION_CONTROL_DIR"
    
    # 使用npx启动，避免全局依赖问题
    nohup npx next dev --port "$PORT" \
        --max-old-space-size=512 \
        --expose-gc \
        > "$LOG_FILE" 2>&1 &
    
    local pid=$!
    echo "$pid" > "$PID_FILE"
    echo "服务启动成功，PID: $pid"
    
    # 等待服务就绪
    echo "等待服务就绪..."
    local attempts=0
    while [ $attempts -lt 30 ]; do
        if check_service; then
            echo "✅ 服务已就绪，运行在 http://localhost:$PORT"
            return 0
        fi
        sleep 2
        attempts=$((attempts + 1))
    done
    
    echo "❌ 服务启动超时"
    return 1
}

# 函数：监控服务
monitor_service() {
    local restarts=0
    
    while [ $restarts -lt $MAX_RESTARTS ]; do
        if ! check_service; then
            echo "⚠️ 服务不可用，尝试重启 ($((restarts + 1))/$MAX_RESTARTS)..."
            stop_service
            if start_service; then
                echo "✅ 服务重启成功"
                restarts=0
            else
                restarts=$((restarts + 1))
                if [ $restarts -ge $MAX_RESTARTS ]; then
                    echo "❌ 达到最大重启次数 ($MAX_RESTARTS)，停止尝试"
                    return 1
                fi
                echo "等待 $RESTART_DELAY 秒后重试..."
                sleep $RESTART_DELAY
            fi
        else
            # 服务正常运行，重置重启计数
            restarts=0
            echo "✅ 服务运行正常 (http://localhost:$PORT)"
            
            # 检查健康状态
            local health_status=$(curl -s "http://localhost:$PORT/api/health" | grep -o '"overallHealth":[0-9]*' | cut -d: -f2)
            if [ -n "$health_status" ] && [ "$health_status" -lt 50 ]; then
                echo "⚠️ 健康状态较低: $health_status%，需要关注"
            fi
        fi
        
        # 每30秒检查一次
        sleep 30
    done
}

# 主函数
main() {
    echo "========================================"
    echo "Mission Control 稳定运行脚本"
    echo "时间: $(date)"
    echo "端口: $PORT"
    echo "日志: $LOG_FILE"
    echo "========================================"
    
    # 停止现有服务
    stop_service
    
    # 启动服务
    if start_service; then
        echo "✅ 服务启动成功，开始监控..."
        
        # 启动监控
        monitor_service
    else
        echo "❌ 服务启动失败"
        exit 1
    fi
}

# 处理命令行参数
case "$1" in
    start)
        if start_service; then
            echo "✅ 服务启动成功"
        else
            echo "❌ 服务启动失败"
            exit 1
        fi
        ;;
    stop)
        stop_service
        echo "✅ 服务已停止"
        ;;
    restart)
        stop_service
        sleep 2
        if start_service; then
            echo "✅ 服务重启成功"
        else
            echo "❌ 服务重启失败"
            exit 1
        fi
        ;;
    status)
        if check_service; then
            echo "✅ 服务运行正常 (http://localhost:$PORT)"
            curl -s "http://localhost:$PORT/api/health" | grep -o '"overallHealth":[0-9]*' | cut -d: -f2 | xargs echo "健康状态:"
        else
            echo "❌ 服务未运行"
        fi
        ;;
    monitor)
        monitor_service
        ;;
    *)
        main
        ;;
esac