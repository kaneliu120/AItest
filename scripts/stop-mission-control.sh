#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-3001}"

echo "🛑 stopping mission-control on :$PORT"

pkill -f "next dev --port $PORT" || true
pkill -f "npm exec next dev --port $PORT" || true

if command -v lsof >/dev/null 2>&1; then
  PIDS=$(lsof -ti tcp:"$PORT" -sTCP:LISTEN || true)
  if [[ -n "${PIDS:-}" ]]; then
    kill $PIDS || true
  fi
fi

rm -f "/tmp/mission-control-$PORT.pid"

echo "✅ stopped (if any process was running)"
