#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-3001}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🔍 checking existing processes on :$PORT"

# kill processes that explicitly run next dev on target port
pkill -f "next dev --port $PORT" || true
pkill -f "npm exec next dev --port $PORT" || true

# fallback: kill listeners on the port when lsof exists
if command -v lsof >/dev/null 2>&1; then
  PIDS=$(lsof -ti tcp:"$PORT" -sTCP:LISTEN || true)
  if [[ -n "${PIDS:-}" ]]; then
    echo "🧹 killing listeners on :$PORT -> $PIDS"
    kill $PIDS || true
  fi
fi

sleep 1

echo "🚀 starting mission-control on :$PORT"
cd "$ROOT_DIR"
nohup env NODE_OPTIONS='--max-old-space-size=512 --expose-gc' npx next dev --port "$PORT" > "/tmp/mission-control-$PORT.log" 2>&1 &
PID=$!
echo "$PID" > "/tmp/mission-control-$PORT.pid"

echo "⏳ waiting for health endpoint..."
for i in {1..45}; do
  if curl -sf "http://127.0.0.1:$PORT/api/ecosystem/skill-evaluator?action=stats" >/dev/null; then
    echo "✅ mission-control is healthy on http://127.0.0.1:$PORT"
    echo "📄 log: /tmp/mission-control-$PORT.log"
    exit 0
  fi
  sleep 1
done

echo "❌ startup timeout, last logs:"
tail -n 80 "/tmp/mission-control-$PORT.log" || true
exit 1
