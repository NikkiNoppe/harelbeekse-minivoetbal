#!/usr/bin/env bash
# Verifieer matches-RLS na migratie 20260607100000_secure_matches_rls.sql
set -euo pipefail

SUPABASE_URL="${SUPABASE_URL:-https://kuyviionmstyvkvglizh.supabase.co}"
ANON_KEY="${ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1eXZpaW9ubXN0eXZrdmdsaXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDc3NDQsImV4cCI6MjA2MjIyMzc0NH0.a8pkewpTbzFsLptp_yWD98tHgBlFXKHCRP_Bh3D2XYA}"

hdr=(-H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY")

pass=0
fail=0

check() {
  local name="$1" ok="$2"
  if [[ "$ok" == "true" ]]; then
    echo "✅ $name"
    pass=$((pass + 1))
  else
    echo "❌ $name"
    fail=$((fail + 1))
  fi
}

echo "=== Matches security smoke test ==="
echo "Target: $SUPABASE_URL"
echo ""

# 1. matches_public moet bestaan en data teruggeven
code=$(curl -s -o /tmp/mp.json -w "%{http_code}" \
  "$SUPABASE_URL/rest/v1/matches_public?select=match_id&limit=1" "${hdr[@]}")
has_rows=$(python3 -c "import json; d=json.load(open('/tmp/mp.json')); print('true' if isinstance(d,list) and len(d)>0 else 'false')" 2>/dev/null || echo false)
check "matches_public bereikbaar (HTTP $code) met data" "$([[ "$code" == "200" && "$has_rows" == "true" ]] && echo true || echo false)"

# 2. Anon mag geen lineup JSONB meer lezen via matches
code=$(curl -s -o /tmp/m.json -w "%{http_code}" \
  "$SUPABASE_URL/rest/v1/matches?select=match_id,home_players&limit=1" "${hdr[@]}")
body=$(cat /tmp/m.json)
empty_or_no_players=true
if [[ "$code" == "200" ]]; then
  if echo "$body" | grep -q 'playerName\|playerId'; then
    empty_or_no_players=false
  fi
  if [[ "$body" == "[]" ]]; then
    empty_or_no_players=true
  fi
else
  empty_or_no_players=true
fi
check "matches.home_players niet leesbaar voor anon (HTTP $code)" "$empty_or_no_players"

# 3. RPC voor kaarten moet bestaan
code=$(curl -s -o /tmp/rpc.json -w "%{http_code}" \
  "$SUPABASE_URL/rest/v1/rpc/get_match_card_events" \
  -H "Content-Type: application/json" "${hdr[@]}" \
  -d '{"p_user_id": 0}')
check "get_match_card_events RPC bestaat (HTTP $code, verwacht 200)" "$([[ "$code" == "200" ]] && echo true || echo false)"

# 4. Anon players leeg of geblokkeerd
code=$(curl -s -o /tmp/p.json -w "%{http_code}" \
  "$SUPABASE_URL/rest/v1/players?select=player_id&limit=1" "${hdr[@]}")
players_empty=$([[ "$(cat /tmp/p.json)" == "[]" ]] && echo true || echo false)
check "players niet publiek leesbaar (HTTP $code, leeg=$players_empty)" "$([[ "$code" == "200" && "$players_empty" == "true" ]] && echo true || echo false)"

echo ""
echo "Resultaat: $pass geslaagd, $fail gefaald"
[[ "$fail" -eq 0 ]]
