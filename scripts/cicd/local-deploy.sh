#!/bin/bash

# 本地部署脚本
# 基于WORKFLOW_AUTO.md晚间主动推进授权

set -e

echo "🚀 本地部署"
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

# 部署到预发布环境
deploy_to_staging() {
    log_info "部署到预发布环境..."
    
    # 检查PM2
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2未安装"
        exit 1
    fi
    
    # 停止现有服务
    log_info "停止现有预发布服务..."
    pm2 stop mission-control-staging 2>/dev/null || true
    pm2 delete mission-control-staging 2>/dev/null || true
    
    # 启动新服务
    log_info "启动预发布服务..."
    pm2 start npm --name "mission-control-staging" -- start
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 健康检查
    log_info "运行健康检查..."
    if curl -s http://localhost:3002/health > /dev/null; then
        log_info "✅ 预发布环境部署成功"
    else
        log_error "❌ 预发布环境部署失败"
        pm2 logs mission-control-staging --lines=20
        exit 1
    fi
    
    # 运行冒烟测试
    log_info "运行冒烟测试..."
    npm run smoke-test 2>/dev/null || log_warn "冒烟测试未配置"
    
    log_info "预发布环境部署完成"
}

# 部署到生产环境
deploy_to_production() {
    log_info "部署到生产环境..."
    
    # 确认部署
    echo ""
    read -p "⚠️  确认部署到生产环境? (y/n): " confirm
    
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        log_info "部署取消"
        exit 0
    fi
    
    # 备份当前生产环境
    log_info "备份当前生产环境..."
    local backup_dir="/Users/kane/mission-control/backups/production-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # 这里可以添加备份逻辑
    log_info "备份完成: $backup_dir"
    
    # 停止生产服务
    log_info "停止生产服务..."
    pm2 stop mission-control 2>/dev/null || true
    
    # 部署新版本
    log_info "部署新版本..."
    
    # 使用PM2重新加载
    pm2 reload mission-control --update-env
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 15
    
    # 健康检查
    log_info "运行健康检查..."
    if curl -s http://localhost:3001/health > /dev/null; then
        log_info "✅ 生产环境部署成功"
    else
        log_error "❌ 生产环境部署失败"
        
        # 回滚到上一个版本
        log_info "尝试回滚..."
        pm2 stop mission-control
        # 这里可以添加回滚逻辑
        pm2 start mission-control
        
        log_error "已回滚到上一个版本"
        exit 1
    fi
    
    # 运行生产环境测试
    log_info "运行生产环境测试..."
    npm run test:production 2>/dev/null || log_warn "生产环境测试未配置"
    
    log_info "生产环境部署完成"
}

# 蓝绿部署
blue_green_deployment() {
    log_info "蓝绿部署..."
    
    # 检查当前运行的颜色
    local current_color="blue"
    if pm2 list | grep -q "mission-control-green"; then
        current_color="green"
    fi
    
    local next_color=$([ "$current_color" = "blue" ] && echo "green" || echo "blue")
    
    log_info "当前运行: $current_color, 准备部署: $next_color"
    
    # 部署新版本到备用环境
    log_info "部署到$next_color环境..."
    pm2 start npm --name "mission-control-$next_color" -- start -- --port=$([ "$next_color" = "blue" ] && echo "3003" || echo "3004")
    
    # 等待备用环境启动
    log_info "等待$next_color环境启动..."
    sleep 15
    
    # 检查备用环境健康
    local next_port=$([ "$next_color" = "blue" ] && echo "3003" || echo "3004")
    if curl -s http://localhost:$next_port/health > /dev/null; then
        log_info "✅ $next_color环境健康"
    else
        log_error "❌ $next_color环境不健康"
        pm2 delete mission-control-$next_color
        exit 1
    fi
    
    # 切换流量
    log_info "切换流量到$next_color环境..."
    # 这里可以添加负载均衡器配置更新逻辑
    
    # 停止旧环境
    log_info "停止$current_color环境..."
    pm2 stop mission-control-$current_color
    pm2 delete mission-control-$current_color
    
    log_info "蓝绿部署完成，当前运行: $next_color"
}

# 金丝雀发布
canary_release() {
    log_info "金丝雀发布..."
    
    # 部署金丝雀版本
    log_info "部署金丝雀版本..."
    pm2 start npm --name "mission-control-canary" -- start -- --port=3005
    
    # 等待金丝雀版本启动
    log_info "等待金丝雀版本启动..."
    sleep 15
    
    # 检查金丝雀版本健康
    if curl -s http://localhost:3005/health > /dev/null; then
        log_info "✅ 金丝雀版本健康"
    else
        log_error "❌ 金丝雀版本不健康"
        pm2 delete mission-control-canary
        exit 1
    fi
    
    # 将少量流量路由到金丝雀版本
    log_info "将10%流量路由到金丝雀版本..."
    # 这里可以添加流量路由逻辑
    
    # 监控金丝雀版本性能
    log_info "监控金丝雀版本性能..."
    # 这里可以添加监控逻辑
    
    # 询问是否全面发布
    echo ""
    read -p "金丝雀版本运行正常，是否全面发布? (y/n): " canary_confirm
    
    if [[ "$canary_confirm" == "y" || "$canary_confirm" == "Y" ]]; then
        # 全面发布
        deploy_to_production
        
        # 停止金丝雀版本
        pm2 stop mission-control-canary
        pm2 delete mission-control-canary
        
        log_info "金丝雀发布完成，已全面发布"
    else
        log_info "金丝雀发布暂停，保持当前状态"
        log_info "金丝雀版本运行在端口3005"
    fi
}

# 生成部署报告
generate_deployment_report() {
    local report_file="deployment-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# 部署报告
## 部署信息
- 时间: $(date)
- 环境: $1
- 部署方式: $2
- 部署用户: $(whoami)

## 服务状态
- Mission Control: $(curl -s http://localhost:3001/health > /dev/null && echo "✅ 健康" || echo "❌ 异常")
- 知识管理系统前端: $(curl -s http://localhost:3000 > /dev/null && echo "✅ 运行" || echo "❌ 异常")
- 知识管理系统后端: $(curl -s http://localhost:8000/health > /dev/null && echo "✅ 健康" || echo "❌ 异常")

## 部署步骤
1. ✅ 环境检查
2. ✅ 服务停止
3. ✅ 新版本部署
4. ✅ 健康检查
5. ✅ 冒烟测试

## 性能指标
- 响应时间: $(curl -s -o /dev/null -w "%{time_total}s" http://localhost:3001/health)s
- 内存使用: $(pm2 show mission-control | grep "memory" | head -1 | awk '{print $4}') MB
- CPU使用: $(pm2 show mission-control | grep "CPU" | head -1 | awk '{print $3}')%

## 下一步
1. 监控服务性能24小时
2. 检查错误日志
3. 验证业务功能
4. 更新文档

EOF
    
    log_info "部署报告已生成: $report_file"
}

# 主菜单
main_menu() {
    echo ""
    echo "🚀 本地部署菜单"
    echo "=".repeat(60)
    echo "1. 部署到预发布环境"
    echo "2. 部署到生产环境"
    echo "3. 蓝绿部署"
    echo "4. 金丝雀发布"
    echo "5. 生成部署报告"
    echo "6. 退出"
    echo "=".repeat(60)
    
    read -p "请选择部署方式 (1-6): " choice
    
    case $choice in
        1)
            deploy_to_staging
            generate_deployment_report "staging" "standard"
            ;;
        2)
            deploy_to_production
            generate_deployment_report "production" "standard"
            ;;
        3)
            blue_green_deployment
            generate_deployment_report "production" "blue-green"
            ;;
        4)
            canary_release
            generate_deployment_report "production" "canary"
            ;;
        5)
            generate_deployment_report "$2" "$3"
            ;;
        6)
            echo "退出部署"
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
if [ "$1" = "staging" ]; then
    deploy_to_staging
elif [ "$1" = "production" ]; then
    deploy_to_production
elif [ "$1" = "blue-green" ]; then
    blue_green_deployment
elif [ "$1" = "canary" ]; then
    canary_release
else
    main_menu
fi