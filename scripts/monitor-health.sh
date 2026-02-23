#!/bin/bash

# 健康检查脚本
set -e

# 配置
API_URL="http://localhost:3001/api/requirements-analysis?action=status"
TIMEOUT=10
RETRY_COUNT=3
RETRY_DELAY=2

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查服务健康
check_service_health() {
    local attempt=1
    
    while [ $attempt -le $RETRY_COUNT ]; do
        log_info "尝试 $attempt/$RETRY_COUNT: 检查服务健康..."
        
        response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT $API_URL 2>/dev/null || echo "000")
        
        if [ "$response" -eq 200 ]; then
            log_info "服务健康检查通过 (HTTP $response)"
            return 0
        elif [ "$response" -eq 000 ]; then
            log_warn "服务不可达 (超时)"
        else
            log_warn "服务返回非200状态码: HTTP $response"
        fi
        
        if [ $attempt -lt $RETRY_COUNT ]; then
            sleep $RETRY_DELAY
        fi
        
        attempt=$((attempt + 1))
    done
    
    log_error "服务健康检查失败"
    return 1
}

# 检查系统资源
check_system_resources() {
    log_info "检查系统资源..."
    
    # 检查内存
    memory_usage=$(free | awk '/Mem:/ {printf "%.1f", $3/$2 * 100}')
    if (( $(echo "$memory_usage > 90" | bc -l) )); then
        log_warn "内存使用率过高: ${memory_usage}%"
    else
        log_info "内存使用率正常: ${memory_usage}%"
    fi
    
    # 检查磁盘
    disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        log_warn "磁盘使用率过高: ${disk_usage}%"
    else
        log_info "磁盘使用率正常: ${disk_usage}%"
    fi
    
    # 检查CPU负载
    load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    cpu_cores=$(nproc)
    if (( $(echo "$load_avg > $cpu_cores" | bc -l) )); then
        log_warn "CPU负载过高: ${load_avg} (核心数: ${cpu_cores})"
    else
        log_info "CPU负载正常: ${load_avg} (核心数: ${cpu_cores})"
    fi
}

# 检查Docker容器
check_docker_containers() {
    if command -v docker &> /dev/null; then
        log_info "检查Docker容器..."
        
        running_containers=$(docker ps --format "{{.Names}}" | wc -l)
        total_containers=$(docker ps -a --format "{{.Names}}" | wc -l)
        
        log_info "运行中的容器: ${running_containers}/${total_containers}"
        
        # 检查特定容器
        for container in mission-control-prod mission-prometheus mission-grafana; do
            if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
                log_info "容器 ${container} 运行正常"
            else
                log_warn "容器 ${container} 未运行"
            fi
        done
    else
        log_warn "Docker未安装，跳过容器检查"
    fi
}

# 检查端口占用
check_ports() {
    log_info "检查端口占用..."
    
    for port in 3001 9090 3002; do
        if ss -tuln | grep -q ":${port} "; then
            log_info "端口 ${port} 已被占用"
        else
            log_warn "端口 ${port} 未被占用"
        fi
    done
}

# 生成报告
generate_report() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    cat > /tmp/health-report-$(date +%Y%m%d-%H%M%S).txt << EOF
健康检查报告
============
时间: ${timestamp}

1. 服务健康: $([ $1 -eq 0 ] && echo "✅ 通过" || echo "❌ 失败")
2. 系统资源:
   - 内存使用率: ${memory_usage}%
   - 磁盘使用率: ${disk_usage}%
   - CPU负载: ${load_avg}
3. Docker容器: ${running_containers:-0}/${total_containers:-0} 运行中
4. 端口状态:
   - 3001 (应用): $(ss -tuln | grep -q ":3001 " && echo "✅ 占用" || echo "❌ 空闲")
   - 9090 (Prometheus): $(ss -tuln | grep -q ":9090 " && echo "✅ 占用" || echo "❌ 空闲")
   - 3002 (Grafana): $(ss -tuln | grep -q ":3002 " && echo "✅ 占用" || echo "❌ 空闲")

建议:
$([ "$memory_usage" -gt 90 ] && echo "- 内存使用率过高，考虑优化或增加内存" || echo "- 内存使用正常")
$([ "$disk_usage" -gt 90 ] && echo "- 磁盘空间不足，考虑清理或扩容" || echo "- 磁盘空间充足")
$(( $(echo "$load_avg > $cpu_cores" | bc -l) )) && echo "- CPU负载过高，考虑优化或扩容" || echo "- CPU负载正常"
EOF
    
    log_info "健康检查报告已生成: /tmp/health-report-*.txt"
}

# 主函数
main() {
    log_info "开始健康检查..."
    
    # 检查服务健康
    if check_service_health; then
        service_health=0
    else
        service_health=1
    fi
    
    # 检查系统资源
    check_system_resources
    
    # 检查Docker容器
    check_docker_containers
    
    # 检查端口
    check_ports
    
    # 生成报告
    generate_report $service_health
    
    # 返回状态码
    if [ $service_health -eq 0 ]; then
        log_info "✅ 所有检查通过"
        exit 0
    else
        log_error "❌ 健康检查失败"
        exit 1
    fi
}

# 执行主函数
main "$@"