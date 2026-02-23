#!/bin/bash

# 生产环境部署脚本
set -e

# 配置
APP_NAME="mission-control"
APP_PORT=3001
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"
BUILD_DIR="."
LOG_DIR="./logs"
DATA_DIR="./data"
UPLOADS_DIR="./uploads"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装"
        exit 1
    fi
    log_info "Docker版本: $(docker --version | awk '{print $3}')"
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose未安装"
        exit 1
    fi
    
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
        log_info "Docker Compose版本: $(docker-compose --version | awk '{print $3}')"
    else
        DOCKER_COMPOSE_CMD="docker compose"
        log_info "Docker Compose (插件) 可用"
    fi
}

# 检查环境配置
check_environment() {
    log_info "检查环境配置..."
    
    # 检查环境文件
    if [ ! -f "$ENV_FILE" ]; then
        log_warn "环境文件 $ENV_FILE 不存在，创建默认配置"
        cp .env.example "$ENV_FILE" 2>/dev/null || true
    fi
    
    # 检查必要环境变量
    if [ -f "$ENV_FILE" ]; then
        if ! grep -q "NODE_ENV=production" "$ENV_FILE"; then
            log_warn "NODE_ENV未设置为production"
        fi
        
        if ! grep -q "PORT=$APP_PORT" "$ENV_FILE"; then
            log_warn "PORT未设置为$APP_PORT"
        fi
    fi
    
    # 创建必要目录
    for dir in "$LOG_DIR" "$DATA_DIR" "$UPLOADS_DIR"; do
        if [ ! -d "$dir" ]; then
            log_info "创建目录: $dir"
            mkdir -p "$dir"
        fi
    done
}

# 停止现有服务
stop_existing_services() {
    log_info "停止现有服务..."
    
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        if $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" ps | grep -q "Up"; then
            log_info "停止运行中的容器..."
            $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" down
            sleep 5
        else
            log_info "没有运行中的容器"
        fi
    else
        log_warn "Docker Compose文件不存在: $DOCKER_COMPOSE_FILE"
    fi
    
    # 清理旧的容器和镜像
    log_info "清理未使用的Docker资源..."
    docker system prune -f
}

# 构建应用
build_application() {
    log_info "构建应用程序..."
    
    # 检查Node.js环境
    if [ -f "package.json" ]; then
        log_info "安装依赖..."
        npm ci --only=production
        
        log_info "构建应用..."
        npm run build
        
        if [ $? -eq 0 ]; then
            log_success "应用构建成功"
        else
            log_error "应用构建失败"
            exit 1
        fi
    else
        log_error "package.json 不存在"
        exit 1
    fi
}

# 构建Docker镜像
build_docker_image() {
    log_info "构建Docker镜像..."
    
    if [ -f "Dockerfile" ]; then
        docker build -t "$APP_NAME:latest" .
        
        if [ $? -eq 0 ]; then
            log_success "Docker镜像构建成功"
        else
            log_error "Docker镜像构建失败"
            exit 1
        fi
    else
        log_error "Dockerfile 不存在"
        exit 1
    fi
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        log_info "使用Docker Compose启动服务..."
        $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" up -d
        
        # 等待服务启动
        log_info "等待服务启动..."
        sleep 10
        
        # 检查服务状态
        if $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" ps | grep -q "Up"; then
            log_success "服务启动成功"
        else
            log_error "服务启动失败"
            $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" logs
            exit 1
        fi
    else
        log_error "Docker Compose文件不存在: $DOCKER_COMPOSE_FILE"
        exit 1
    fi
}

# 验证部署
verify_deployment() {
    log_info "验证部署..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "验证尝试 $attempt/$max_attempts..."
        
        # 检查应用健康
        if curl -s -f "http://localhost:$APP_PORT/api/requirements-analysis?action=status" > /dev/null 2>&1; then
            log_success "应用健康检查通过"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "应用健康检查失败"
            return 1
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    # 检查监控服务
    if curl -s -f "http://localhost:9090/-/healthy" > /dev/null 2>&1; then
        log_success "Prometheus健康检查通过"
    else
        log_warn "Prometheus健康检查失败"
    fi
    
    if curl -s -f "http://localhost:3002/api/health" > /dev/null 2>&1; then
        log_success "Grafana健康检查通过"
    else
        log_warn "Grafana健康检查失败"
    fi
    
    return 0
}

# 显示部署信息
show_deployment_info() {
    log_info "部署完成！"
    echo ""
    echo "📊 部署信息:"
    echo "=============="
    echo "应用名称: $APP_NAME"
    echo "应用地址: http://localhost:$APP_PORT"
    echo "API文档: http://localhost:$APP_PORT/api/requirements-analysis"
    echo "监控面板: http://localhost:3002 (admin/admin123)"
    echo "Prometheus: http://localhost:9090"
    echo ""
    echo "🔧 管理命令:"
    echo "查看日志: $DOCKER_COMPOSE_CMD -f $DOCKER_COMPOSE_FILE logs"
    echo "停止服务: $DOCKER_COMPOSE_CMD -f $DOCKER_COMPOSE_FILE down"
    echo "重启服务: $DOCKER_COMPOSE_CMD -f $DOCKER_COMPOSE_FILE restart"
    echo "健康检查: ./scripts/monitor-health.sh"
    echo ""
    echo "📋 下一步:"
    echo "1. 访问应用界面测试功能"
    echo "2. 配置监控告警"
    echo "3. 设置定期备份"
    echo "4. 配置域名和SSL证书"
}

# 主部署流程
main() {
    log_info "开始部署 $APP_NAME..."
    
    # 检查依赖
    check_dependencies
    
    # 检查环境
    check_environment
    
    # 停止现有服务
    stop_existing_services
    
    # 构建应用
    build_application
    
    # 构建Docker镜像
    build_docker_image
    
    # 启动服务
    start_services
    
    # 验证部署
    if verify_deployment; then
        show_deployment_info
        log_success "部署成功完成！"
    else
        log_error "部署验证失败"
        exit 1
    fi
}

# 执行部署
main "$@"