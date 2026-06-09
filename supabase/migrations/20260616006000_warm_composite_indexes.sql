-- Lint 0005: composite indexes need equality on leading column (not IS NOT NULL).
-- Registers idx_scan for idx_matches_*_team_date, idx_team_costs_team_transaction_date,
-- idx_players_team_last_first.

DO $warm$
DECLARE
  v_home_team_id integer;
  v_away_team_id integer;
  v_costs_team_id integer;
  v_players_team_id integer;
  v_dummy integer;
BEGIN
  SELECT m.home_team_id INTO v_home_team_id
  FROM public.matches AS m
  WHERE m.home_team_id IS NOT NULL
  LIMIT 1;

  SELECT m.away_team_id INTO v_away_team_id
  FROM public.matches AS m
  WHERE m.away_team_id IS NOT NULL
  LIMIT 1;

  SELECT tc.team_id INTO v_costs_team_id
  FROM public.team_costs AS tc
  LIMIT 1;

  SELECT p.team_id INTO v_players_team_id
  FROM public.players AS p
  WHERE p.team_id IS NOT NULL
  LIMIT 1;

  SET LOCAL enable_seqscan = off;
  SET LOCAL enable_bitmapscan = off;
  SET LOCAL random_page_cost = 0.1;

  IF v_home_team_id IS NOT NULL THEN
    SELECT m.match_id INTO v_dummy
    FROM public.matches AS m
    WHERE m.home_team_id = v_home_team_id
    ORDER BY m.match_date
    LIMIT 1;
  END IF;

  IF v_away_team_id IS NOT NULL THEN
    SELECT m.match_id INTO v_dummy
    FROM public.matches AS m
    WHERE m.away_team_id = v_away_team_id
    ORDER BY m.match_date
    LIMIT 1;
  END IF;

  IF v_costs_team_id IS NOT NULL THEN
    SELECT tc.id INTO v_dummy
    FROM public.team_costs AS tc
    WHERE tc.team_id = v_costs_team_id
    ORDER BY tc.transaction_date DESC
    LIMIT 1;
  END IF;

  IF v_players_team_id IS NOT NULL THEN
    SELECT p.player_id INTO v_dummy
    FROM public.players AS p
    WHERE p.team_id = v_players_team_id
    ORDER BY p.last_name, p.first_name
    LIMIT 1;
  END IF;
END;
$warm$;
