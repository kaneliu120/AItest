#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# 仅检查前端展示层，不检查 API / 后端
TARGETS=(src/app src/components)
EXCLUDES=(
  --glob '!src/app/api/**'
)

# 旧词清单（可扩展）
PATTERN='工具管理|工具生态|工具市场|我的工具|工具统计'

if rg -n "$PATTERN" "${TARGETS[@]}" "${EXCLUDES[@]}" >/tmp/mcp-terminology-violations.txt; then
  echo "❌ 发现旧命名（应统一为 MCP 命名）："
  cat /tmp/mcp-terminology-violations.txt
  exit 1
fi

echo "✅ MCP 命名检查通过（前端）"
