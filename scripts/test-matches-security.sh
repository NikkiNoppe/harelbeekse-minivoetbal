#!/usr/bin/env bash
# Verifieer security na migraties:
# - 20260607100000_secure_matches_rls.sql
# - 20260608100000_matches_restrictive_context_rls.sql
# - 20260609100000_security_hardening_session_auth.sql
# - 20260611000000_public_schedule_rpcs.sql (get_public_matches / get_public_teams)
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

# Detect of session-auth + public RPC migratie live staat
rpc_code=$(curl -s -o /tmp/pub_teams_detect.json -w "%{http_code}" \
  "$SUPABASE_URL/rest/v1/rpc/get_public_teams" \
  -H "Content-Type: application/json" "${hdr[@]}" \
  -d '{}')
session_auth_live=false
if [[ "$rpc_code" == "200" ]]; then
  session_auth_live=true
  echo "Modus: session-auth + public RPC migratie ACTIEF"
else
  echo "Modus: legacy (deploy 20260611000000 voor public RPCs)"
fi
echo ""

# 1. get_public_matches moet data teruggeven
code=$(curl -s -o /tmp/mp.json -w "%{http_code}" \
  "$SUPABASE_URL/rest/v1/rpc/get_public_matches" \
  -H "Content-Type: application/json" "${hdr[@]}" \
  -d '{}')
has_rows=false
if [[ "$code" == "200" ]]; then
  has_rows=$(python3 -c "import json; d=json.load(open('/tmp/mp.json')); print('true' if isinstance(d,list) and len(d)>0 else 'false')" 2>/dev/null || echo false)
fi
if [[ "$session_auth_live" != "true" ]]; then
  # Fallback: oude matches_public view (pre-migratie)
  code=$(curl -s -o /tmp/mp.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/matches_public?select=match_id,home_team_name&limit=3" "${hdr[@]}")
  has_rows=$(python3 -c "import json; d=json.load(open('/tmp/mp.json')); print('true' if isinstance(d,list) and len(d)>0 else 'false')" 2>/dev/null || echo false)
  check "matches_public bereikbaar (HTTP $code) met data (legacy)" "$([[ "$code" == "200" && "$has_rows" == "true" ]] && echo true || echo false)"
else
  check "get_public_matches bereikbaar (HTTP $code) met data" "$([[ "$code" == "200" && "$has_rows" == "true" ]] && echo true || echo false)"
fi

# 2. Publiek schema mag geen home_players bevatten
if [[ "$session_auth_live" == "true" ]]; then
  no_sensitive_col=$(python3 -c "
import json
d=json.load(open('/tmp/mp.json'))
if not isinstance(d,list) or len(d)==0:
  print('true')
else:
  print('false' if 'home_players' in d[0] or 'assigned_referee_id' in d[0] else 'true')
" 2>/dev/null || echo false)
  check "get_public_matches heeft geen home_players/assigned_referee_id" "$no_sensitive_col"
else
  code=$(curl -s -o /tmp/mp_sensitive.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/matches_public?select=home_players&limit=1" "${hdr[@]}")
  body=$(cat /tmp/mp_sensitive.json)
  no_sensitive_col=$([[ "$code" != "200" ]] || echo "$body" | grep -qi 'PGRST\|column\|does not exist' && echo true || echo false)
  check "matches_public heeft geen home_players kolom (HTTP $code)" "$no_sensitive_col"
fi

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

# 6. Anon players niet leesbaar (RLS leeg of REVOKE SELECT)
code=$(curl -s -o /tmp/p.json -w "%{http_code}" \
  "$SUPABASE_URL/rest/v1/players?select=player_id,first_name&limit=3" "${hdr[@]}")
players_blocked=false
if [[ "$code" == "401" || "$code" == "403" ]]; then
  players_blocked=true
elif [[ "$code" == "200" && "$(cat /tmp/p.json)" == "[]" ]]; then
  players_blocked=true
fi
check "players niet publiek leesbaar (HTTP $code)" "$players_blocked"

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

  # 9. get_public_teams heeft geen contact-PII
  no_contact_pii=$(python3 -c "
import json
d=json.load(open('/tmp/pub_teams_detect.json'))
if not isinstance(d,list):
  print('false')
elif len(d)==0:
  print('true')
else:
  print('false' if 'contact_email' in d[0] else 'true')
" 2>/dev/null || echo false)
  check "get_public_teams heeft geen contact_email" "$no_contact_pii"

  # 10. get_public_teams basisvelden bereikbaar
  tp_has_rows=$(python3 -c "import json; d=json.load(open('/tmp/pub_teams_detect.json')); print('true' if isinstance(d,list) and len(d)>0 else 'false')" 2>/dev/null || echo false)
  check "get_public_teams bereikbaar met team_name (HTTP $rpc_code)" "$([[ "$rpc_code" == "200" && "$tp_has_rows" == "true" ]] && echo true || echo false)"

  # 11. Edge function zonder sessie geweigerd (na deploy edge functions)
  code=$(curl -s -o /tmp/ef.json -w "%{http_code}" \
    "$SUPABASE_URL/functions/v1/sync-match-costs" \
    -H "Content-Type: application/json" -H "apikey: $ANON_KEY" \
    -d '{"matchId":1,"homeTeamId":1,"awayTeamId":2,"isSubmitted":false}')
  ef_denied=$([[ "$code" == "401" || "$code" == "403" ]] && echo true || echo false)
  check "sync-match-costs geweigerd zonder x-session-token (HTTP $code)" "$ef_denied"

  # 12. referees_public niet meer bereikbaar
  code=$(curl -s -o /tmp/rp.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/referees_public?select=user_id,username&limit=3" "${hdr[@]}")
  rp_blocked=$([[ "$code" == "404" || "$code" == "401" || "$code" == "403" ]] && echo true || echo false)
  if [[ "$code" == "200" ]]; then
    rp_body=$(cat /tmp/rp.json)
    rp_blocked=$([[ "$rp_body" == "[]" ]] && echo true || echo false)
  fi
  check "referees_public niet publiek leesbaar (HTTP $code)" "$rp_blocked"

  # 13. get_referees_for_session leeg zonder token
  code=$(curl -s -o /tmp/ref_rpc.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/rpc/get_referees_for_session" \
    -H "Content-Type: application/json" "${hdr[@]}" \
    -d '{"p_session_token": null}')
  ref_rpc_empty=$([[ "$code" == "200" && "$(cat /tmp/ref_rpc.json)" == "[]" ]] && echo true || echo false)
  check "get_referees_for_session leeg zonder sessie (HTTP $code)" "$ref_rpc_empty"

  # 14. admin_get_referee_availability oude signature niet meer callable
  code=$(curl -s -o /tmp/old_admin_avail.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/rpc/admin_get_referee_availability" \
    -H "Content-Type: application/json" "${hdr[@]}" \
    -d '{"p_admin_user_id": 1, "p_poll_month": "2026-06"}')
  old_admin_avail_gone=$([[ "$code" == "404" || "$code" == "400" ]] && echo true || echo false)
  check "admin_get_referee_availability spoofable signature weg (HTTP $code)" "$old_admin_avail_gone"

  # 15. get_available_referees_for_match zonder token leeg
  code=$(curl -s -o /tmp/avail_match.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/rpc/get_available_referees_for_match" \
    -H "Content-Type: application/json" "${hdr[@]}" \
    -d '{"p_session_token": null, "p_match_id": 1}')
  avail_match_empty=$([[ "$code" == "200" && "$(cat /tmp/avail_match.json)" == "[]" ]] && echo true || echo false)
  check "get_available_referees_for_match leeg zonder sessie (HTTP $code)" "$avail_match_empty"

  # 16. assign_referee_to_match oude spoofable signature weg
  code=$(curl -s -o /tmp/old_assign.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/rpc/assign_referee_to_match" \
    -H "Content-Type: application/json" "${hdr[@]}" \
    -d '{"p_user_id": 1, "p_match_id": 1, "p_referee_id": 1}')
  old_assign_gone=$([[ "$code" == "404" || "$code" == "400" ]] && echo true || echo false)
  check "assign_referee_to_match spoofable signature weg (HTTP $code)" "$old_assign_gone"

  # 17. get_teams_for_session leeg zonder token
  code=$(curl -s -o /tmp/teams_sess.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/rpc/get_teams_for_session" \
    -H "Content-Type: application/json" "${hdr[@]}" \
    -d '{"p_session_token": null}')
  teams_sess_empty=$([[ "$code" == "200" && "$(cat /tmp/teams_sess.json)" == "[]" ]] && echo true || echo false)
  check "get_teams_for_session leeg zonder sessie (HTTP $code)" "$teams_sess_empty"

  # 18. matches_public view niet meer bereikbaar
  code=$(curl -s -o /tmp/mp_view.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/matches_public?select=match_id&limit=1" "${hdr[@]}")
  mp_view_gone=$([[ "$code" == "404" || "$code" == "401" || "$code" == "403" ]] && echo true || echo false)
  check "matches_public view niet publiek leesbaar (HTTP $code)" "$mp_view_gone"

  # 19. teams_public view niet meer bereikbaar
  code=$(curl -s -o /tmp/tp_view.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/teams_public?select=team_id&limit=1" "${hdr[@]}")
  tp_view_gone=$([[ "$code" == "404" || "$code" == "401" || "$code" == "403" ]] && echo true || echo false)
  check "teams_public view niet publiek leesbaar (HTTP $code)" "$tp_view_gone"

  # 20. get_player_cards_for_admin leeg zonder token
  code=$(curl -s -o /tmp/pc_admin.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/rpc/get_player_cards_for_admin" \
    -H "Content-Type: application/json" "${hdr[@]}" \
    -d '{"p_session_token": null}')
  pc_empty=$([[ "$code" == "200" && "$(cat /tmp/pc_admin.json)" == "[]" ]] && echo true || echo false)
  check "get_player_cards_for_admin leeg zonder sessie (HTTP $code)" "$pc_empty"

  # 21. delete-user geweigerd zonder x-session-token
  code=$(curl -s -o /tmp/del_user.json -w "%{http_code}" \
    "$SUPABASE_URL/functions/v1/delete-user" \
    -H "Content-Type: application/json" -H "apikey: $ANON_KEY" \
    -d '{"userId":1}')
  del_denied=$([[ "$code" == "401" || "$code" == "403" ]] && echo true || echo false)
  check "delete-user geweigerd zonder x-session-token (HTTP $code)" "$del_denied"

  # 22. send-transactional-email geweigerd zonder x-session-token
  code=$(curl -s -o /tmp/st_email.json -w "%{http_code}" \
    "$SUPABASE_URL/functions/v1/send-transactional-email" \
    -H "Content-Type: application/json" -H "apikey: $ANON_KEY" \
    -d '{"templateName":"forfait-notification","recipientEmail":"test@example.com"}')
  st_denied=$([[ "$code" == "401" || "$code" == "403" ]] && echo true || echo false)
  check "send-transactional-email geweigerd zonder x-session-token (HTTP $code)" "$st_denied"

  # 23. send-forfait-notification geweigerd zonder x-session-token
  code=$(curl -s -o /tmp/forfait_ef.json -w "%{http_code}" \
    "$SUPABASE_URL/functions/v1/send-forfait-notification" \
    -H "Content-Type: application/json" -H "apikey: $ANON_KEY" \
    -d '{"recipients":["test@example.com"],"homeTeamName":"A","awayTeamName":"B","forfaitTeamName":"A"}')
  forfait_denied=$([[ "$code" == "401" || "$code" == "403" ]] && echo true || echo false)
  check "send-forfait-notification geweigerd zonder x-session-token (HTTP $code)" "$forfait_denied"

  # 24. anon mag teams.contact_email niet lezen (kolom-revoke)
  code=$(curl -s -o /tmp/teams_contact.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/teams?select=team_id,contact_email&limit=1" "${hdr[@]}")
  teams_contact_blocked=false
  if [[ "$code" != "200" ]]; then
    teams_contact_blocked=true
  else
    body=$(cat /tmp/teams_contact.json)
    if echo "$body" | grep -qi 'PGRST\|column\|does not exist\|permission'; then
      teams_contact_blocked=true
    elif [[ "$body" == "[]" ]]; then
      teams_contact_blocked=true
    else
      teams_contact_blocked=$(python3 -c "
import json
d=json.load(open('/tmp/teams_contact.json'))
print('false' if isinstance(d,list) and len(d)>0 and 'contact_email' in d[0] else 'true')
" 2>/dev/null || echo false)
    fi
  fi
  check "teams.contact_email niet leesbaar voor anon (HTTP $code)" "$teams_contact_blocked"

  # 25. password_reset_tokens niet leesbaar voor anon
  code=$(curl -s -o /tmp/prt_read.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/password_reset_tokens?select=token&limit=1" "${hdr[@]}")
  prt_blocked=$([[ "$code" != "200" || "$(cat /tmp/prt_read.json)" == "[]" ]] && echo true || echo false)
  if [[ "$code" == "200" ]]; then
    body=$(cat /tmp/prt_read.json)
    if echo "$body" | grep -qi 'PGRST\|permission\|JWT'; then
      prt_blocked=true
    fi
  fi
  check "password_reset_tokens niet leesbaar voor anon (HTTP $code)" "$prt_blocked"

  # 26. generate-competition-schedule geweigerd zonder x-session-token
  code=$(curl -s -o /tmp/gcs_ef.json -w "%{http_code}" \
    "$SUPABASE_URL/functions/v1/generate-competition-schedule" \
    -H "Content-Type: application/json" -H "apikey: $ANON_KEY" \
    -d '{"config":{"name":"test","format_type":"round","start_date":"2026-01-01","end_date":"2026-06-01","matches_per_week":2},"teams":[],"team_preferences":[],"vacation_periods":[],"ai_provider":"abacus"}')
  gcs_denied=$([[ "$code" == "401" || "$code" == "403" ]] && echo true || echo false)
  check "generate-competition-schedule geweigerd zonder x-session-token (HTTP $code)" "$gcs_denied"

  # 27. get_public_application_settings retourneert theme_colors
  code=$(curl -s -o /tmp/pub_settings.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/rpc/get_public_application_settings" \
    -H "Content-Type: application/json" "${hdr[@]}" \
    -d '{"p_categories":["theme_colors"]}')
  pub_settings_ok=false
  if [[ "$code" == "200" ]]; then
    pub_settings_ok=$(python3 -c "
import json
d=json.load(open('/tmp/pub_settings.json'))
print('true' if isinstance(d,list) and len(d)>0 and d[0].get('setting_category')=='theme_colors' else 'false')
" 2>/dev/null || echo false)
  fi
  check "get_public_application_settings theme_colors (HTTP $code)" "$pub_settings_ok"

  # 28. _old_competition_standings niet leesbaar voor anon
  code=$(curl -s -o /tmp/old_standings.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/_old_competition_standings?select=team_id&limit=1" "${hdr[@]}")
  old_standings_blocked=$([[ "$code" != "200" || "$(cat /tmp/old_standings.json)" == "[]" ]] && echo true || echo false)
  if [[ "$code" == "200" ]]; then
    body=$(cat /tmp/old_standings.json)
    if echo "$body" | grep -qi 'PGRST\|permission\|JWT'; then
      old_standings_blocked=true
    fi
  fi
  check "_old_competition_standings niet leesbaar voor anon (HTTP $code)" "$old_standings_blocked"

  # 29. application_settings direct REST niet leesbaar voor anon
  code=$(curl -s -o /tmp/app_settings_direct.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/application_settings?select=id&limit=1" "${hdr[@]}")
  app_settings_blocked=$([[ "$code" != "200" || "$(cat /tmp/app_settings_direct.json)" == "[]" ]] && echo true || echo false)
  if [[ "$code" == "200" ]]; then
    body=$(cat /tmp/app_settings_direct.json)
    if echo "$body" | grep -qi 'PGRST\|permission\|JWT'; then
      app_settings_blocked=true
    fi
  fi
  check "application_settings niet direct leesbaar voor anon (HTTP $code)" "$app_settings_blocked"

  # 30. Bekend default superadmin-wachtwoord geweigerd
  code=$(curl -s -o /tmp/sa_old_pw.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/rpc/login_super_admin" \
    -H "Content-Type: application/json" "${hdr[@]}" \
    -d '{"p_password": "admin1987"}')
  sa_old_denied=$([[ "$code" == "200" && "$(cat /tmp/sa_old_pw.json)" == "[]" ]] && echo true || echo false)
  if [[ "$code" == "404" || "$code" == "401" ]]; then
    sa_old_denied=true
  fi
  check "login_super_admin weigert bekend default-wachtwoord (HTTP $code)" "$sa_old_denied"

  # 31. create_user_with_hashed_password niet meer callable
  code=$(curl -s -o /tmp/create_user_old.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/rpc/create_user_with_hashed_password" \
    -H "Content-Type: application/json" "${hdr[@]}" \
    -d '{"username_param":"x","email_param":null,"password_param":"x","role_param":"admin"}')
  create_user_gone=$([[ "$code" == "404" || "$code" == "400" ]] && echo true || echo false)
  check "create_user_with_hashed_password spoofable signature weg (HTTP $code)" "$create_user_gone"

  # 32. update_match_with_context niet meer callable
  code=$(curl -s -o /tmp/umc_old.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/rpc/update_match_with_context" \
    -H "Content-Type: application/json" "${hdr[@]}" \
    -d '{"p_user_id": 1, "p_match_id": 1, "p_update_data": {}}')
  umc_gone=$([[ "$code" == "404" || "$code" == "400" ]] && echo true || echo false)
  check "update_match_with_context spoofable signature weg (HTTP $code)" "$umc_gone"

  # 33. get_current_user_role niet callable door anon
  code=$(curl -s -o /tmp/gcur.json -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/rpc/get_current_user_role" \
    -H "Content-Type: application/json" "${hdr[@]}" \
    -d '{}')
  gcur_revoked=$([[ "$code" == "404" || "$code" == "401" || "$code" == "403" ]] && echo true || echo false)
  check "get_current_user_role niet uitvoerbaar door anon (HTTP $code)" "$gcur_revoked"
else
  echo "⏭️  Overgeslagen: set_config-blokkade, public RPC, admin-RPC, edge-auth (vereist migratie + deploy)"
fi

echo ""
echo "Resultaat: $pass geslaagd, $fail gefaald"
[[ "$fail" -eq 0 ]]
