#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"

echo "[WF] health check"
code=$(curl -s -o /tmp/wf_health -w "%{http_code}" "$BASE_URL/api/health")
[[ "$code" == "200" ]] || { echo "[FAIL] /api/health -> $code"; exit 1; }

echo "[WF] create task"
TASK_ID=$(curl -s -X POST "$BASE_URL/api/task-hierarchy" -H 'content-type: application/json' -d '{"level":1,"title":"verify-workflow","status":"pending"}' | python3 -c "import sys,json;print((json.load(sys.stdin).get('data') or {}).get('id',''))")
[[ -n "$TASK_ID" ]] || { echo "[FAIL] create task"; exit 1; }

echo "[WF] transition checks"
curl -s -X POST "$BASE_URL/api/task-hierarchy/$TASK_ID/accept" -H 'content-type: application/json' -d '{}' >/dev/null
curl -s -X POST "$BASE_URL/api/task-hierarchy/$TASK_ID/outsource-confirm" -H 'content-type: application/json' -d '{}' >/dev/null
curl -s -X POST "$BASE_URL/api/task-hierarchy/$TASK_ID/analysis-complete" -H 'content-type: application/json' -d '{}' >/dev/null
curl -s -X POST "$BASE_URL/api/task-hierarchy/$TASK_ID/automation-complete" -H 'content-type: application/json' -d '{}' >/dev/null

# should fail: automation_done -> deployed
bad=$(curl -s -X POST "$BASE_URL/api/task-hierarchy/$TASK_ID/deploy" -H 'content-type: application/json' -d '{}')
echo "$bad" | rg -q "非法状态迁移" || { echo "[FAIL] gate check deploy should fail"; exit 1; }

curl -s -X POST "$BASE_URL/api/task-hierarchy/$TASK_ID/test-result" -H 'content-type: application/json' -d '{"pass":true}' >/dev/null
curl -s -X POST "$BASE_URL/api/task-hierarchy/$TASK_ID/deploy" -H 'content-type: application/json' -d '{"readyOnly":true}' >/dev/null
curl -s -X POST "$BASE_URL/api/task-hierarchy/$TASK_ID/deploy" -H 'content-type: application/json' -d '{}' >/dev/null
curl -s -X POST "$BASE_URL/api/task-hierarchy/$TASK_ID/invoice" -H 'content-type: application/json' -d '{}' >/dev/null

echo "[WF] check artifacts"
curl -s "$BASE_URL/api/task-hierarchy/$TASK_ID/events" | rg -q "invoice" || { echo "[FAIL] events missing invoice"; exit 1; }
code=$(curl -s -o /tmp/wf_doc -w "%{http_code}" "$BASE_URL/api/task-hierarchy/$TASK_ID/analysis-doc")
[[ "$code" == "200" ]] || { echo "[FAIL] analysis-doc -> $code"; exit 1; }

echo "[DONE] verify:workflow passed (task=$TASK_ID)"