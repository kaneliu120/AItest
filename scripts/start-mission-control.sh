#!/bin/bash
# Mission Control 启动脚本

set -e

echo "🚀 启动 Mission Control 服务..."

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 未安装，请先安装: npm install -g pm2"
    exit 1
fi

# 停止现有服务
echo "停止现有服务..."
pm2 stop mission-control 2>/dev/null || true
pm2 delete mission-control 2>/dev/null || true

# 清理端口占用
echo "清理端口占用..."
pkill -f "next.*3001" 2>/dev/null || true
sleep 2

# 创建日志目录
mkdir -p /Users/kane/mission-control/logs

# 启动服务
echo "启动 Mission Control..."
pm2 start /Users/kane/mission-control/pm2-mission-control.config.js

# 保存PM2配置
pm2 save

# 显示状态
echo ""
echo "✅ Mission Control 启动完成"
echo "访问地址: http://localhost:3001"
echo "健康检查: http://localhost:3001/api/health"
echo ""
pm2 status mission-control

# 设置开机自启动
echo ""
echo "设置开机自启动..."
pm2 startup 2>/dev/null || echo "需要sudo权限设置开机自启动"

echo ""
echo "📋 管理命令:"
echo "  pm2 status mission-control          # 查看状态"
echo "  pm2 logs mission-control           # 查看日志"
echo "  pm2 restart mission-control        # 重启服务"
echo "  pm2 stop mission-control           # 停止服务"
echo "  pm2 delete mission-control         # 删除服务"