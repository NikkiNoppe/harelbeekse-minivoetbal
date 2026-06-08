#!/usr/bin/env bash
# Verifieer security na migraties:
# - 20260607100000_secure_matches_rls.sql
# - 20260608100000_matches_restrictive_context_rls.sql
# - 20260609100000_security_hardening_session_auth.sql
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

echo "=== Security smoke test ==="
echo "Target: $SUPABASE_URL"

# Detect of session-auth migratie (20260609100000) live staat
mp_code=$(curl -s -o /dev/null -w "%{http_code}" \
  "$SUPABASE_URL/rest/v1/teams_public?select=team_id&limit=1" "${hdr[@]}")
session_auth_live=false
if [[ "$mp_code" == "200" ]]; then
  session_auth_live=true
  echo "Modus: session-auth migratie ACTIEF"
else
  echo "Modus: alleen matches-RLS (deploy 20260609100000 voor volledige hardening)"
fi
echo ""

# 1. matches_public moet bestaan en data teruggeven
code=$(curl -s -o /tmp/mp.json -w "%{http_code}" \
  "$SUPABASE_URL/rest/v1/matches_public?select=match_id,home_team_name&limit=3" "${hdr[@]}")
has_rows=$(python3 -c "import json; d=json.load(open('/tmp/mp.json')); print('true' if isinstance(d,list) and len(d)>0 else 'false')" 2>/dev/null || echo false)
check "matches_public bereikbaar (HTTP $code) met data" "$([[ "$code" == "200" && "$has_rows" == "true" ]] && echo true || echo false)"

# 2. matches_public mag geen gevoelige kolommen exposeren
code=$(curl -s -o /tmp/mp_sensitive.json -w "%{http_code}" \
  "$SUPABASE_URL/rest/v1/matches_public?select=home_players&limit=1" "${hdr[@]}")
body=$(cat /tmp/mp_sensitive.json)
no_sensitive_col=$([[ "$code" != "200" ]] || echo "$body" | grep -qi 'PGRST\|column\|does not exist' && echo true || echo false)
check "matches_public heeft geen home_players kolom (HTTP $code)" "$no_sensitive_col"

# 3. Anon mag geen lineup JSONB lezen via matches
code=$(curl -s -o /tmp/m.json -w "%{http_code}" \
  "$SUPABASE_URL/rest/v1/matches?select=match_id,home_players,away_players&limit=5" "${hdr[@]}")
body=$(cat /tmp/m.json)
empty_or_no_players=true
if [[ "$code" == "200" ]]; then
  if echo "$body" | grep -qE 'playerName|playerId|jerseyNumber'; then
    empty_or_no_players=false
  fi
  if [[ "$body" == "[]" ]]; then
    empty_or_no_players=true
  fi
else
  empty_or_no_players=true
fi
check "matches JSONB niet leesbaar voor anon (HTTP $code)" "$empty_or_no_players"

# 4. Anon mag geen match-rijen lezen via matches (RESTRICTIVE + geen permissive)
code=$(curl -s -o /tmp/m_count.json -w "%{http_code}" \
  "$SUPABASE_URL/rest/v1/matches?select=match_id&limit=5" "${hdr[@]}")
body=$(cat /tmp/m_count.json)
matches_blocked=false
if [[ "$code" == "401" || "$code" == "403" ]]; then
  matches_blocked=true
elif [[ "$code" == "200" && "$body" == "[]" ]]; then
  matches_blocked=true
fi
check "matches niet leesbaar voor anon zonder context (HTTP $code)" "$matches_blocked"

# 5. RPC kaarten zonder geldige sessie geeft lege set
if [[ "$session_auth_live" == "true" ]]; then
  code=$(curl -s -o /tmp/rpc.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/rpc/get_match_card_events" \
    -H "Content-Type: application/json" "${hdr[@]}" \
    -d '{"p_session_token": null}')
else
  code=$(curl -s -o /tmp/rpc.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/rpc/get_match_card_events" \
    -H "Content-Type: application/json" "${hdr[@]}" \
    -d '{"p_user_id": 0}')
fi
rpc_ok=$([[ "$code" == "200" && "$(cat /tmp/rpc.json)" == "[]" ]] && echo true || echo false)
check "get_match_card_events leeg zonder sessie (HTTP $code)" "$rpc_ok"

# 6. Anon players leeg
code=$(curl -s -o /tmp/p.json -w "%{http_code}" \
  "$SUPABASE_URL/rest/v1/players?select=player_id,first_name&limit=3" "${hdr[@]}")
players_empty=$([[ "$(cat /tmp/p.json)" == "[]" ]] && echo true || echo false)
check "players niet publiek leesbaar (HTTP $code)" "$([[ "$code" == "200" && "$players_empty" == "true" ]] && echo true || echo false)"

if [[ "$session_auth_live" == "true" ]]; then
  # 7. set_config niet meer callable door anon (session escalation geblokkeerd)
  code=$(curl -s -o /tmp/setcfg.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/rpc/set_config" \
    -H "Content-Type: application/json" "${hdr[@]}" \
    -d '{"parameter":"app.current_user_role","value":"admin"}')
  setcfg_blocked=$([[ "$code" == "404" || "$code" == "403" || "$code" == "401" ]] && echo true || echo false)
  if [[ "$code" == "200" || "$code" == "204" ]]; then
    setcfg_blocked=false
  fi
  check "set_config niet uitvoerbaar door anon (HTTP $code)" "$setcfg_blocked"

  # 8. Admin RPC zonder context leeg
  code=$(curl -s -o /tmp/users_admin.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/rpc/get_all_users_for_admin" \
    -H "Content-Type: application/json" "${hdr[@]}" \
    -d '{"p_session_token": null}')
  users_empty=$([[ "$code" == "200" && "$(cat /tmp/users_admin.json)" == "[]" ]] && echo true || echo false)
  check "get_all_users_for_admin leeg zonder admin-context (HTTP $code)" "$users_empty"

  # 9. teams_public heeft geen contact-PII kolommen
  code=$(curl -s -o /tmp/tp_pii.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/teams_public?select=contact_email&limit=1" "${hdr[@]}")
  tp_body=$(cat /tmp/tp_pii.json)
  no_contact_col=$([[ "$code" != "200" ]] || echo "$tp_body" | grep -qi 'PGRST\|column\|does not exist' && echo true || echo false)
  check "teams_public heeft geen contact_email (HTTP $code)" "$no_contact_col"

  # 10. teams_public basisvelden wel bereikbaar
  code=$(curl -s -o /tmp/tp.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/teams_public?select=team_id,team_name&limit=3" "${hdr[@]}")
  tp_has_rows=$(python3 -c "import json; d=json.load(open('/tmp/tp.json')); print('true' if isinstance(d,list) and len(d)>0 else 'false')" 2>/dev/null || echo false)
  check "teams_public bereikbaar met team_name (HTTP $code)" "$([[ "$code" == "200" && "$tp_has_rows" == "true" ]] && echo true || echo false)"

  # 11. Edge function zonder sessie geweigerd (na deploy edge functions)
  code=$(curl -s -o /tmp/ef.json -w "%{http_code}" \
    "$SUPABASE_URL/functions/v1/sync-match-costs" \
    -H "Content-Type: application/json" -H "apikey: $ANON_KEY" \
    -d '{"matchId":1,"homeTeamId":1,"awayTeamId":2,"isSubmitted":false}')
  ef_denied=$([[ "$code" == "401" || "$code" == "403" ]] && echo true || echo false)
  check "sync-match-costs geweigerd zonder x-session-token (HTTP $code)" "$ef_denied"
else
  echo "⏭️  Overgeslagen: set_config-blokkade, teams_public, admin-RPC, edge-auth (vereist migratie + deploy)"
fi

echo ""
echo "Resultaat: $pass geslaagd, $fail gefaald"
[[ "$fail" -eq 0 ]]
