#!/bin/bash

# Mission Control 部署脚本
# 用法: ./deploy.sh [环境]

set -e  # 遇到错误退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "命令 $1 未安装"
        exit 1
    fi
}

# 显示帮助
show_help() {
    echo "Mission Control 部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  dev         开发环境部署"
    echo "  staging     预发布环境部署"
    echo "  production  生产环境部署"
    echo "  docker      使用Docker部署"
    echo "  vercel      部署到Vercel"
    echo "  help        显示此帮助"
    echo ""
    echo "示例:"
    echo "  $0 dev        # 部署到开发环境"
    echo "  $0 docker     # 使用Docker部署"
    echo "  $0 vercel     # 部署到Vercel"
}

# 开发环境部署
deploy_dev() {
    log_info "开始开发环境部署..."
    
    # 检查Node.js环境
    check_command node
    check_command npm
    
    # 安装依赖
    log_info "安装依赖..."
    npm ci
    
    # 构建应用
    log_info "构建应用..."
    npm run build
    
    # 启动开发服务器
    log_info "启动开发服务器..."
    npm run dev &
    
    log_success "开发环境部署完成"
    log_info "访问: http://localhost:3000"
}

# 生产环境部署
deploy_production() {
    log_info "开始生产环境部署..."
    
    # 检查环境变量
    if [ ! -f ".env.production" ]; then
        log_error "缺少 .env.production 文件"
        log_info "请复制 .env.production.example 并修改配置"
        exit 1
    fi
    
    # 设置环境
    export NODE_ENV=production
    
    # 安装生产依赖
    log_info "安装生产依赖..."
    npm ci --only=production
    
    # 构建应用
    log_info "构建生产版本..."
    npm run build
    
    # 启动应用
    log_info "启动生产服务器..."
    pm2 start npm --name "mission-control" -- start || {
        log_info "安装PM2: npm install -g pm2"
        npm install -g pm2
        pm2 start npm --name "mission-control" -- start
    }
    
    # 保存PM2配置
    pm2 save
    
    log_success "生产环境部署完成"
    log_info "PM2状态: pm2 status"
    log_info "日志查看: pm2 logs mission-control"
}

# Docker部署
deploy_docker() {
    log_info "开始Docker部署..."
    
    check_command docker
    check_command docker-compose
    
    # 检查Docker Compose文件
    if [ ! -f "docker-compose.yml" ]; then
        log_error "缺少 docker-compose.yml 文件"
        exit 1
    fi
    
    # 构建镜像
    log_info "构建Docker镜像..."
    docker-compose build
    
    # 停止旧容器
    log_info "停止旧容器..."
    docker-compose down || true
    
    # 启动新容器
    log_info "启动新容器..."
    docker-compose up -d
    
    # 检查状态
    log_info "检查容器状态..."
    docker-compose ps
    
    log_success "Docker部署完成"
    log_info "查看日志: docker-compose logs -f"
    log_info "停止服务: docker-compose down"
}

# Vercel部署
deploy_vercel() {
    log_info "开始Vercel部署..."
    
    check_command vercel
    
    # 检查是否登录
    if ! vercel whoami &> /dev/null; then
        log_error "未登录Vercel"
        log_info "请运行: vercel login"
        exit 1
    fi
    
    # 部署到Vercel
    log_info "部署到Vercel..."
    vercel --prod
    
    log_success "Vercel部署完成"
    log_info "管理面板: https://vercel.com/dashboard"
}

# 备份数据库
backup_database() {
    log_info "备份数据库..."
    
    BACKUP_DIR="./backups"
    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/mission-control_$DATE.tar.gz"
    
    # 创建备份目录
    mkdir -p $BACKUP_DIR
    
    # 备份SQLite数据库
    if [ -f "mission-control.db" ]; then
        cp mission-control.db "$BACKUP_DIR/mission-control_$DATE.db"
        log_success "数据库备份完成: $BACKUP_DIR/mission-control_$DATE.db"
    fi
    
    # 备份配置文件
    tar -czf $BACKUP_FILE \
        .env.production \
        docker-compose.yml \
        Dockerfile \
        package.json \
        tsconfig.json \
        next.config.ts 2>/dev/null || true
    
    log_success "配置文件备份完成: $BACKUP_FILE"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查端口
    if curl -s http://localhost:3000/api/health > /dev/null; then
        log_success "应用健康检查通过"
        return 0
    else
        log_error "应用健康检查失败"
        return 1
    fi
}

# 主函数
main() {
    local environment=${1:-help}
    
    # 显示标题
    echo ""
    echo "========================================"
    echo "    Mission Control 部署系统"
    echo "========================================"
    echo ""
    
    case $environment in
        dev)
            deploy_dev
            ;;
        production)
            backup_database
            deploy_production
            health_check
            ;;
        docker)
            backup_database
            deploy_docker
            sleep 5
            health_check
            ;;
        vercel)
            deploy_vercel
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知环境: $environment"
            show_help
            exit 1
            ;;
    esac
    
    echo ""
    echo "========================================"
    echo "          部署流程完成"
    echo "========================================"
    echo ""
}

# 执行主函数
main "$@"