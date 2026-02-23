#!/bin/bash

# 生产环境启动脚本
# 基于WORKFLOW_AUTO.md晚间主动推进授权

echo "🚀 启动生产环境"
echo "时间: $(date)"
echo "============================================================"

# 创建日志目录
mkdir -p /Users/kane/mission-control/logs
mkdir -p /Users/kane/knowledge-management-system/logs

# 安装PM2（如果未安装）
if ! command -v pm2 &> /dev/null; then
    echo "安装PM2..."
    npm install -g pm2
fi

# 启动Mission Control
echo "启动Mission Control..."
cd /Users/kane/mission-control
pm2 start pm2.config.json --only mission-control

# 启动知识管理系统前端
echo "启动知识管理系统前端..."
cd /Users/kane/knowledge-management-system/frontend
pm2 start pm2.config.json --only knowledge-frontend

# 启动知识管理系统后端
echo "启动知识管理系统后端..."
cd /Users/kane/knowledge-management-system/backend
pm2 start pm2.config.json --only knowledge-backend

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查服务状态
echo ""
echo "🔍 检查服务状态..."

SERVICES=(
    "Mission Control:3001"
    "知识管理前端:3000"
    "知识管理后端:8000"
)

for service in "${SERVICES[@]}"; do
    IFS=':' read -r name port <<< "$service"
    
    if curl -s --connect-timeout 5 "http://localhost:$port" > /dev/null 2>&1 || \
       curl -s --connect-timeout 5 "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✅ $name 运行正常 (端口: $port)"
    else
        echo "⚠️ $name 可能仍在启动中 (端口: $port)"
    fi
done

# 显示PM2状态
echo ""
echo "📊 PM2进程状态:"
pm2 list

# 显示访问信息
echo ""
echo "============================================================"
echo "🌐 生产环境访问信息"
echo "============================================================"
echo ""
echo "📊 Mission Control:"
echo "   前端: http://localhost:3001"
echo "   业务集成: http://localhost:3001/business-integration"
echo "   监控: http://localhost:3001/unified-monitoring"
echo "   API网关: http://localhost:3001/api/v1/unified"
echo ""
echo "📚 知识管理系统:"
echo "   前端: http://localhost:3000"
echo "   后端API: http://localhost:8000"
echo "   API文档: http://localhost:8000/docs"
echo ""
echo "🔧 管理命令:"
echo "   查看所有进程: pm2 list"
echo "   查看日志: pm2 logs"
echo "   重启服务: pm2 restart <app-name>"
echo "   停止服务: pm2 stop <app-name>"
echo "   监控: pm2 monit"
echo ""
echo "📈 监控端点:"
echo "   健康检查: http://localhost:3001/health"
echo "   系统状态: http://localhost:3001/api/v6/monitoring?action=status"
echo ""
echo "============================================================"
echo "✅ 生产环境启动完成"
echo "============================================================"