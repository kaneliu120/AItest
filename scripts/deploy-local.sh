#!/bin/bash
# Mission Control 本地部署脚本
# 用途: 拉取最新代码 → 安装依赖 → 构建 → 重启生产服务
# 触发: 手动执行 或 GitHub webhook

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="/tmp/mission-control-deploy.log"

log() { echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

log "=== Mission Control 部署开始 ==="
log "目录: $PROJECT_DIR"
cd "$PROJECT_DIR"

# 1. 拉取最新代码
log "📥 拉取最新代码..."
git pull origin main

# 2. 安装依赖
log "📦 安装依赖..."
npm ci --prefer-offline

# 3. 构建
log "🔨 构建应用..."
NODE_ENV=production npm run build

# 4. 重启服务
log "🔄 重启服务..."
# 杀掉旧的 next dev 进程
pkill -f "next dev --port 3002" || true
sleep 2

# 启动生产服务器
PORT=3002 nohup npm start > /tmp/mission-control-prod.log 2>&1 &
PROD_PID=$!
echo $PROD_PID > /tmp/mission-control.pid

sleep 3

# 5. 健康检查
log "🏥 健康检查..."
if curl -sf "http://localhost:3002/api/health" > /dev/null; then
  log "✅ 部署成功! PID: $PROD_PID"
else
  log "❌ 健康检查失败，查看日志: /tmp/mission-control-prod.log"
  exit 1
fi

log "=== 部署完成 ==="
