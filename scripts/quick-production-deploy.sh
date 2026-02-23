#!/bin/bash

# 快速生产部署脚本
# 基于WORKFLOW_AUTO.md晚间主动推进授权

echo "🚀 开始快速生产部署"
echo "时间: $(date)"
echo "============================================================"

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装"
    exit 1
fi

echo "✅ Docker和Docker Compose已安装"

# 部署Mission Control
echo ""
echo "📦 部署Mission Control..."
cd /Users/kane/mission-control

# 检查生产配置
if [ ! -f "docker-compose.production.yml" ]; then
    echo "⚠️ 使用开发配置进行生产部署"
    DOCKER_COMPOSE_FILE="docker-compose.yml"
else
    DOCKER_COMPOSE_FILE="docker-compose.production.yml"
fi

echo "使用配置: $DOCKER_COMPOSE_FILE"

# 停止现有容器
echo "停止现有容器..."
docker-compose -f $DOCKER_COMPOSE_FILE down 2>/dev/null || true

# 构建镜像
echo "构建Docker镜像..."
docker-compose -f $DOCKER_COMPOSE_FILE build

# 启动容器
echo "启动生产容器..."
docker-compose -f $DOCKER_COMPOSE_FILE up -d

# 等待启动
echo "等待服务启动..."
sleep 15

# 检查服务状态
echo ""
echo "🔍 检查服务状态..."

if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Mission Control健康: http://localhost:3001/health"
else
    echo "⚠️ Mission Control健康检查失败，检查日志..."
    docker-compose -f $DOCKER_COMPOSE_FILE logs mission-control --tail=20
fi

# 部署知识管理系统
echo ""
echo "📚 部署知识管理系统..."
cd /Users/kane/knowledge-management-system

if [ ! -f "docker-compose.production.yml" ]; then
    echo "⚠️ 使用开发配置进行生产部署"
    DOCKER_COMPOSE_FILE="docker-compose.yml"
else
    DOCKER_COMPOSE_FILE="docker-compose.production.yml"
fi

echo "使用配置: $DOCKER_COMPOSE_FILE"

# 停止现有容器
echo "停止现有容器..."
docker-compose -f $DOCKER_COMPOSE_FILE down 2>/dev/null || true

# 构建镜像
echo "构建Docker镜像..."
docker-compose -f $DOCKER_COMPOSE_FILE build

# 启动容器
echo "启动生产容器..."
docker-compose -f $DOCKER_COMPOSE_FILE up -d

# 等待启动
echo "等待服务启动..."
sleep 20

# 检查服务状态
echo ""
echo "🔍 检查服务状态..."

if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ 知识管理后端健康: http://localhost:8000/health"
else
    echo "⚠️ 知识管理后端健康检查失败，检查日志..."
    docker-compose -f $DOCKER_COMPOSE_FILE logs backend --tail=20
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 知识管理前端运行: http://localhost:3000"
else
    echo "⚠️ 知识管理前端可能仍在启动中..."
fi

# 显示访问信息
echo ""
echo "============================================================"
echo "🎉 部署完成 - 访问信息"
echo "============================================================"
echo ""
echo "📊 Mission Control:"
echo "   前端: http://localhost:3001"
echo "   业务集成: http://localhost:3001/business-integration"
echo "   监控: http://localhost:3001/unified-monitoring"
echo ""
echo "📚 知识管理系统:"
echo "   前端: http://localhost:3000"
echo "   后端API: http://localhost:8000"
echo "   API文档: http://localhost:8000/docs"
echo ""
echo "🔧 管理命令:"
echo "   查看Mission Control日志: docker-compose -f /Users/kane/mission-control/$DOCKER_COMPOSE_FILE logs -f"
echo "   查看知识系统日志: docker-compose -f /Users/kane/knowledge-management-system/$DOCKER_COMPOSE_FILE logs -f"
echo "   停止所有服务: docker-compose -f <file> down"
echo ""
echo "⚠️ 安全提醒:"
echo "   1. 立即更改所有默认密码"
echo "   2. 配置生产环境变量（特别是API密钥）"
echo "   3. 考虑设置SSL证书"
echo ""
echo "============================================================"
echo "✅ 快速生产部署完成"
echo "============================================================"