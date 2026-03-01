#!/bin/bash
# 设置Mission Control定时任务

set -e

echo "设置 Mission Control 定时任务..."

# 创建日志目录
mkdir -p /Users/kane/mission-control/logs

# 添加定时任务到crontab
CRON_JOBS="
# Mission Control 每日健康检查 (每小时)
0 * * * * /Users/kane/mission-control/scripts/monitor-mission-control.sh status >> /Users/kane/mission-control/logs/cron-hourly.log 2>&1

# Mission Control 每日重启 (凌晨3点，避免高峰)
0 3 * * * /Users/kane/mission-control/scripts/start-mission-control.sh >> /Users/kane/mission-control/logs/cron-daily-restart.log 2>&1

# Mission Control 日志清理 (每周日凌晨2点)
0 2 * * 0 find /Users/kane/mission-control/logs -name \"*.log\" -mtime +7 -delete >> /Users/kane/mission-control/logs/cron-cleanup.log 2>&1

# Mission Control 内存监控 (每30分钟)
*/30 * * * * /Users/kane/mission-control/scripts/monitor-mission-control.sh status | grep -E \"(健康状态|资源使用)\" >> /Users/kane/mission-control/logs/cron-memory.log 2>&1
"

# 备份现有crontab
echo "备份现有crontab..."
crontab -l > /Users/kane/mission-control/logs/crontab-backup-$(date +%Y%m%d_%H%M%S).bak 2>/dev/null || true

# 添加新任务
echo "添加定时任务..."
(crontab -l 2>/dev/null | grep -v "mission-control"; echo "$CRON_JOBS") | crontab -

# 验证任务添加
echo "当前crontab任务:"
crontab -l | grep -E "(mission-control|Mission Control)"

echo ""
echo "✅ 定时任务设置完成"
echo "日志目录: /Users/kane/mission-control/logs/"
echo ""
echo "📋 定时任务详情:"
echo "  1. 每小时健康检查"
echo "  2. 每日凌晨3点重启"
echo "  3. 每周日志清理"
echo "  4. 每30分钟内存监控"