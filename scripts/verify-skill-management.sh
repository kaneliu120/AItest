#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3011}"

echo "[1/6] health stats"
curl -sS "$BASE_URL/api/ecosystem/skill-evaluator?action=stats" | jq -e '.success == true' >/dev/null

echo "[2/6] list skills"
curl -sS "$BASE_URL/api/ecosystem/skill-evaluator?action=skills&page=1&pageSize=5&type=all&status=all" | jq -e '.success == true and (.data.skills | type == "array")' >/dev/null

echo "[3/6] redirect /skill-management -> /skill-evaluator"
LOCATION=$(curl -sSI "$BASE_URL/skill-management" | awk -F': ' 'tolower($1)=="location"{print $2}' | tr -d '\r')
if [[ "$LOCATION" != "/skill-evaluator" ]]; then
  echo "redirect check failed: got location=$LOCATION"
  exit 1
fi

echo "[4/6] validate create/merge param guards"
curl -sS -X POST "$BASE_URL/api/ecosystem/skill-evaluator" -H 'Content-Type: application/json' -d '{"action":"create-skill"}' | jq -e '.success == false and .error == "缺少 skillName"' >/dev/null

MERGE_EMPTY_RESP=$(mktemp)
MERGE_EMPTY_CODE=$(curl -sS -o "$MERGE_EMPTY_RESP" -w "%{http_code}" -X POST "$BASE_URL/api/ecosystem/skill-evaluator" -H 'Content-Type: application/json' -d '{"action":"merge-skills","sourceSkillPaths":[],"targetSkillPath":""}')
if [[ "$MERGE_EMPTY_CODE" != "400" ]]; then
  echo "merge empty expected 400, got $MERGE_EMPTY_CODE"
  cat "$MERGE_EMPTY_RESP"
  rm -f "$MERGE_EMPTY_RESP"
  exit 1
fi
jq -e '.success == false and .error == "缺少 sourceSkillPaths"' "$MERGE_EMPTY_RESP" >/dev/null
rm -f "$MERGE_EMPTY_RESP"

MERGE_NO_TARGET_RESP=$(mktemp)
MERGE_NO_TARGET_CODE=$(curl -sS -o "$MERGE_NO_TARGET_RESP" -w "%{http_code}" -X POST "$BASE_URL/api/ecosystem/skill-evaluator" -H 'Content-Type: application/json' -d '{"action":"merge-skills","sourceSkillPaths":["/tmp/a"]}')
if [[ "$MERGE_NO_TARGET_CODE" != "400" ]]; then
  echo "merge missing target expected 400, got $MERGE_NO_TARGET_CODE"
  cat "$MERGE_NO_TARGET_RESP"
  rm -f "$MERGE_NO_TARGET_RESP"
  exit 1
fi
jq -e '.success == false and .error == "缺少 targetSkillPath"' "$MERGE_NO_TARGET_RESP" >/dev/null
rm -f "$MERGE_NO_TARGET_RESP"

echo "[5/6] create + archive lifecycle"
NAME="verify-skill-$(date +%s)"
CREATE_RESP=$(curl -sS -X POST "$BASE_URL/api/ecosystem/skill-evaluator" -H 'Content-Type: application/json' -d "{\"action\":\"create-skill\",\"skillName\":\"$NAME\",\"relativePath\":\"testing\",\"evaluateNow\":false}")
SKILL_PATH=$(echo "$CREATE_RESP" | jq -r '.data.skillPath')
if [[ -z "$SKILL_PATH" || "$SKILL_PATH" == "null" ]]; then
  echo "create skill failed: $CREATE_RESP"
  exit 1
fi
curl -sS -X POST "$BASE_URL/api/ecosystem/skill-evaluator" -H 'Content-Type: application/json' -d "{\"action\":\"delete-skill\",\"skillPath\":\"$SKILL_PATH\",\"hardDelete\":false}" | jq -e '.success == true and .data.deleted == true' >/dev/null

echo "[6/6] evaluate guard"
curl -sS -X POST "$BASE_URL/api/ecosystem/skill-evaluator" -H 'Content-Type: application/json' -d '{"action":"evaluate"}' | jq -e '.success == false' >/dev/null

echo "✅ skill-management verification passed @ $BASE_URL"
