#!/bin/bash
echo "🚀 启动 Mission Control 开发服务器"
echo "=================================="

# 检查依赖
echo "检查 Node.js 版本..."
node --version

echo "检查 npm 版本..."
npm --version

# 安装依赖（如果未安装）
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

# 启动开发服务器
echo "启动开发服务器..."
echo "访问: http://localhost:3000"
echo "按 Ctrl+C 停止"

npm run dev