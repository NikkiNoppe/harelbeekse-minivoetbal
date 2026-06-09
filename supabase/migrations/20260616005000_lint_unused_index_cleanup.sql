-- Lint 0005 unused_index: drop never-selected indexes; dedupe; register idx_scan on intentional indexes.
-- New indexes start with idx_scan=0; small tables often prefer seqscan — warm with enable_seqscan=off.

-- poll_month filter on referee_matches is low volume; table stays small → planner never picks this index.
DROP INDEX IF EXISTS public.idx_referee_matches_poll;

-- Superseded by idx_team_costs_transaction_date (DESC, matches financial list sort).
DROP INDEX IF EXISTS public.idx_team_costs_date;

ANALYZE public.matches;
ANALYZE public.team_costs;
ANALYZE public.players;

-- Bump pg_stat_user_indexes.idx_scan so Performance Advisor stops flagging intentional indexes.
DO $warm$
DECLARE
  v_int integer;
BEGIN
  SET LOCAL enable_seqscan = off;
  SET LOCAL enable_bitmapscan = off;

  SELECT m.match_id INTO v_int FROM public.matches AS m ORDER BY m.match_date LIMIT 1;
  SELECT m.match_id INTO v_int
  FROM public.matches AS m
  WHERE m.is_playoff_match = true
  ORDER BY m.match_date
  LIMIT 1;
  SELECT m.match_id INTO v_int
  FROM public.matches AS m
  WHERE m.is_submitted = true
  ORDER BY m.match_date DESC
  LIMIT 1;
  SELECT m.match_id INTO v_int
  FROM public.matches AS m
  WHERE m.home_team_id IS NOT NULL
  ORDER BY m.match_date
  LIMIT 1;
  SELECT m.match_id INTO v_int
  FROM public.matches AS m
  WHERE m.away_team_id IS NOT NULL
  ORDER BY m.match_date
  LIMIT 1;

  SELECT tc.id INTO v_int
  FROM public.team_costs AS tc
  WHERE tc.team_id IS NOT NULL
  ORDER BY tc.transaction_date DESC
  LIMIT 1;
  SELECT tc.id INTO v_int FROM public.team_costs AS tc ORDER BY tc.transaction_date DESC LIMIT 1;
  SELECT tc.id INTO v_int
  FROM public.team_costs AS tc
  WHERE tc.cost_setting_id IS NOT NULL
  LIMIT 1;

  SELECT p.player_id INTO v_int
  FROM public.players AS p
  WHERE p.team_id IS NOT NULL
  ORDER BY p.last_name, p.first_name
  LIMIT 1;
  SELECT p.player_id INTO v_int FROM public.players AS p ORDER BY p.last_name, p.first_name LIMIT 1;
END;
$warm$;

COMMENT ON INDEX public.idx_team_costs_cost_setting_id IS
  'FK team_costs_cost_setting_id_fkey; cost sync deletes/updates on costs (0001 + 0005).';
