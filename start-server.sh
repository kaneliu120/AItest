#!/bin/bash

echo "=== 启动 Mission Control 服务器 ==="
echo "时间: $(date)"
echo ""

# 清理旧进程
echo "1. 清理旧进程..."
pkill -f "next dev" 2>/dev/null || echo "无next进程"
pkill -f "npm run dev" 2>/dev/null || echo "无npm进程"
sleep 2

# 检查端口
echo -e "\n2. 检查端口..."
for port in 3000 3001 3002 3003; do
  if lsof -ti:$port >/dev/null 2>&1; then
    echo "   端口 $port 被占用，尝试释放..."
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
  fi
done

# 安装依赖
echo -e "\n3. 检查依赖..."
if [ ! -d "node_modules" ]; then
  echo "   安装依赖..."
  npm install
else
  echo "   依赖已安装"
fi

# 启动服务器
echo -e "\n4. 启动服务器..."
echo "   启动命令: npm run dev"
echo "   日志输出到: /tmp/mission-control-server.log"

# 后台启动
nohup npm run dev > /tmp/mission-control-server.log 2>&1 &
SERVER_PID=$!

echo "   服务器PID: $SERVER_PID"

# 等待启动
echo -e "\n5. 等待服务器启动..."
for i in {1..30}; do
  if curl -s http://localhost:3000/ >/dev/null 2>&1 || curl -s http://localhost:3001/ >/dev/null 2>&1; then
    echo "   ✅ 服务器启动成功!"
    
    # 检查实际端口
    if curl -s http://localhost:3000/ >/dev/null 2>&1; then
      PORT=3000
    else
      PORT=3001
    fi
    
    echo "   访问地址: http://localhost:$PORT"
    echo "   API地址: http://localhost:$PORT/api/health"
    
    # 显示日志最后几行
    echo -e "\n6. 服务器日志:"
    tail -10 /tmp/mission-control-server.log
    
    exit 0
  fi
  
  echo "   等待中... ($i/30)"
  sleep 1
done

echo "   ❌ 服务器启动超时"
echo "   查看日志: tail -f /tmp/mission-control-server.log"
exit 1