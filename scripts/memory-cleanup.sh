#!/bin/bash

# 内存清理脚本 - 每日3次自动执行
# 执行时间: 上午9:00, 下午15:00, 晚上21:00

echo "========================================="
echo "内存清理脚本启动 - $(date)"
echo "========================================="

# 1. 记录清理前内存状态
echo "📊 清理前内存状态:"
top -l 1 -o mem | head -10 | tail -8

# 2. 清理Discord Helper进程 (高内存占用)
echo "🧹 清理Discord Helper进程..."
pkill -f "Discord Helper" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Discord Helper进程已清理"
else
    echo "ℹ️ 未找到Discord Helper进程"
fi

# 3. 重载Chrome标签页 (释放缓存内存)
echo "🌐 优化Chrome内存使用..."
osascript -e 'tell application "Google Chrome" to tell every tab of every window to reload' 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Chrome标签页已重载"
else
    echo "ℹ️ Chrome未运行或无法访问"
fi

# 4. 清理Telegram缓存 (如果运行中)
echo "💬 优化Telegram内存..."
pkill -f "Telegram" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Telegram已重启"
    # 等待2秒后重新打开Telegram
    sleep 2
    open -a Telegram 2>/dev/null
else
    echo "ℹ️ Telegram未运行"
fi

# 5. 清理系统缓存 (需要sudo权限)
echo "🗑️ 清理系统缓存..."
sync
if command -v purge &> /dev/null; then
    # 尝试使用sudo清理 (如果配置了免密码sudo)
    sudo -n purge 2>/dev/null || echo "⚠️ 需要sudo权限清理系统缓存"
else
    echo "ℹ️ purge命令不可用 (macOS系统)"
fi

# 6. 优化Node.js进程内存
echo "⚡ 优化Node.js进程..."
# 查找并重启内存占用过高的Node.js进程 (非核心服务)
ps aux | grep -E "node.*--max-old-space-size" | grep -v grep | while read line; do
    pid=$(echo $line | awk '{print $2}')
    mem=$(echo $line | awk '{print $4}')
    cmd=$(echo $line | awk '{for(i=11;i<=NF;i++) printf $i" "; print ""}')
    
    # 如果内存使用超过50%，记录但不重启（可能是核心服务）
    if (( $(echo "$mem > 50" | bc -l) )); then
        echo "⚠️ 高内存Node进程 (PID: $pid, 内存: $mem%): $cmd"
    fi
done

# 7. 清理临时文件
echo "📁 清理临时文件..."
find /tmp -name "*.tmp" -type f -mtime +1 -delete 2>/dev/null
find ~/Library/Caches -name "*.cache" -type f -mtime +7 -delete 2>/dev/null

# 8. 记录清理后内存状态
echo "📊 清理后内存状态:"
sleep 2
top -l 1 -o mem | head -10 | tail -8

# 9. 生成清理报告
echo "========================================="
echo "内存清理完成报告 - $(date)"
echo "========================================="
echo "✅ 执行的操作:"
echo "  1. Discord Helper进程清理"
echo "  2. Chrome标签页重载"
echo "  3. Telegram优化"
echo "  4. 系统缓存清理"
echo "  5. Node.js进程监控"
echo "  6. 临时文件清理"
echo ""
echo "📈 建议:"
echo "  - 定期重启通讯应用 (每日)"
echo "  - 监控Mission Control内存使用"
echo "  - 考虑服务分离部署"
echo "========================================="

# 10. 记录到日志文件
LOG_FILE="/Users/kane/mission-control/logs/memory-cleanup.log"
mkdir -p "$(dirname "$LOG_FILE")"
{
    echo "========================================="
    echo "内存清理执行时间: $(date)"
    echo "========================================="
    top -l 1 -o mem | head -10 | tail -8
    echo "========================================="
} >> "$LOG_FILE"

echo "📝 清理日志已保存到: $LOG_FILE"
echo "✅ 内存清理脚本执行完成"