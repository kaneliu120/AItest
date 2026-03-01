#!/usr/bin/env bash
set -euo pipefail

# 生产环境必须配置管理员令牌
if [[ "${NODE_ENV:-}" == "production" ]]; then
  if [[ -z "${WORKFLOW_ADMIN_TOKEN:-}" ]]; then
    echo "❌ NODE_ENV=production 时缺少 WORKFLOW_ADMIN_TOKEN"
    exit 1
  fi
fi

# 非生产给出提示，不阻断
if [[ "${NODE_ENV:-}" != "production" && -z "${WORKFLOW_ADMIN_TOKEN:-}" ]]; then
  echo "⚠️ 非生产环境未设置 WORKFLOW_ADMIN_TOKEN（可选）"
else
  echo "✅ WORKFLOW_ADMIN_TOKEN 配置检查通过"
fi
