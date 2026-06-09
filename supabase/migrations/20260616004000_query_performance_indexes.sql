-- Query performance: composite indexes for PostgREST patterns (pg_stat / index advisor).
-- Covers ORDER BY match_date, team_costs by team+date, players name sort.

-- matches: global date sort (playoff filter, standings, forms)
CREATE INDEX IF NOT EXISTS idx_matches_match_date ON public.matches (match_date);

CREATE INDEX IF NOT EXISTS idx_matches_playoff_match_date
  ON public.matches (is_playoff_match, match_date);

CREATE INDEX IF NOT EXISTS idx_matches_submitted_match_date
  ON public.matches (is_submitted, match_date DESC);

-- Team schedule: (home|away)_team_id = ? ORDER BY match_date (replaces single-column FK indexes)
DROP INDEX IF EXISTS public.idx_matches_home_team_id;
DROP INDEX IF EXISTS public.idx_matches_away_team_id;

CREATE INDEX IF NOT EXISTS idx_matches_home_team_date
  ON public.matches (home_team_id, match_date);

CREATE INDEX IF NOT EXISTS idx_matches_away_team_date
  ON public.matches (away_team_id, match_date);

-- Redundant with idx_matches_playoff_match_date for playoff+date scans
DROP INDEX IF EXISTS public.idx_matches_is_playoff_match;

-- team_costs: WHERE team_id = ? ORDER BY transaction_date DESC (financial overview)
DROP INDEX IF EXISTS public.idx_team_costs_team_id;

CREATE INDEX IF NOT EXISTS idx_team_costs_team_transaction_date
  ON public.team_costs (team_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_team_costs_transaction_date
  ON public.team_costs (transaction_date DESC);

-- players: ORDER BY last_name, first_name (+ team filter)
DROP INDEX IF EXISTS public.idx_players_team_id_rls;

CREATE INDEX IF NOT EXISTS idx_players_team_last_first
  ON public.players (team_id, last_name, first_name);

CREATE INDEX IF NOT EXISTS idx_players_last_first
  ON public.players (last_name, first_name);

COMMENT ON INDEX public.idx_matches_match_date IS 'PostgREST/RLS: ORDER BY match_date (forms, standings, schedule).';
COMMENT ON INDEX public.idx_team_costs_team_transaction_date IS 'PostgREST: team financial list ORDER BY transaction_date DESC.';
