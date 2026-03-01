#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"

echo "[SMOKE] 0) Health precheck"
health_code=$(curl -s -o /tmp/mc_smoke_health -w "%{http_code}" "${BASE_URL}/api/health" || true)
if [[ "$health_code" != "200" ]]; then
  echo "[FAIL] health precheck -> ${health_code} (is dev server running on ${BASE_URL}?)"
  exit 1
fi

echo "[SMOKE] 1) Type-check"
npm run -s type-check >/tmp/mc_smoke_tsc.log 2>&1

echo "[SMOKE] 2) Build"
npm run -s build >/tmp/mc_smoke_build.log 2>&1

echo "[SMOKE] 3) API probes"
api_paths=(
  "/api/health"
  "/api/tasks"
  "/api/finance"
  "/api/freelance"
  "/api/tools"
  "/api/missions"
  "/api/dashboard"
  "/api/workflows/bookings"
  "/api/automation?action=status"
)

for p in "${api_paths[@]}"; do
  code=$(curl -s -o /tmp/mc_smoke_resp -w "%{http_code}" "${BASE_URL}${p}")
  if [[ "$code" != "200" ]]; then
    echo "[FAIL] ${p} -> ${code}"
    exit 1
  fi
  echo "[OK]   ${p} -> ${code}"
done

echo "[SMOKE] 4) Validation checks (expect 400)"
code=$(curl -s -o /tmp/mc_smoke_resp -w "%{http_code}" -X POST "${BASE_URL}/api/tasks/batch" -H 'content-type: application/json' -d '{"action":"status","ids":[]}')
[[ "$code" == "400" ]] || { echo "[FAIL] /api/tasks/batch invalid payload -> ${code}"; exit 1; }

echo "[OK]   /api/tasks/batch invalid payload -> 400"

echo "[DONE] smoke passed"