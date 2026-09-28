#!/usr/bin/env bash
# Seeds one demo Instagram account + DM template + trigger rule via the
# back-office REST API, so you have something for simulate-comment.mjs to
# match against. Requires the server to be running (npm run dev) and `jq`.
#
# Usage: ./scripts/seed-demo.sh [base-url]
set -euo pipefail

BASE="${1:-http://localhost:3000}/api"
IG_USER_ID="${IG_USER_ID:-ig-acc-demo}"
MEDIA_ID="${MEDIA_ID:-media-demo}"
KEYWORD="${KEYWORD:-오이}"

echo "==> creating account ($IG_USER_ID)"
ACCOUNT=$(curl -sf -X POST "$BASE/accounts" \
  -H "Content-Type: application/json" \
  -d "{\"igUserId\":\"$IG_USER_ID\",\"username\":\"demo_shop\",\"pageAccessToken\":\"dummy-token\"}")
echo "$ACCOUNT" | jq .
ACCOUNT_ID=$(echo "$ACCOUNT" | jq -r .id)

echo "==> creating DM template"
TEMPLATE=$(curl -sf -X POST "$BASE/dm-templates" \
  -H "Content-Type: application/json" \
  -d '{"name":"cucumber","body":"안녕하세요 {{username}}님! 최저가 링크는 https://link.coupang.com/xyz 입니다"}')
echo "$TEMPLATE" | jq .
TEMPLATE_ID=$(echo "$TEMPLATE" | jq -r .id)

echo "==> creating trigger rule (keyword: $KEYWORD, media: $MEDIA_ID)"
curl -sf -X POST "$BASE/trigger-rules" \
  -H "Content-Type: application/json" \
  -d "{\"accountId\":\"$ACCOUNT_ID\",\"mediaId\":\"$MEDIA_ID\",\"keyword\":\"$KEYWORD\",\"dmTemplateId\":\"$TEMPLATE_ID\"}" | jq .

cat <<EOF

==> done. Now simulate a matching comment with:

  npm run simulate -- --ig-user "$IG_USER_ID" --media "$MEDIA_ID" --text "$KEYWORD 주세요"

and a non-matching one with:

  npm run simulate -- --ig-user "$IG_USER_ID" --media "$MEDIA_ID" --text "수박 주세요"

Then check the log with:

  curl -s "$BASE/events" | jq .
EOF
