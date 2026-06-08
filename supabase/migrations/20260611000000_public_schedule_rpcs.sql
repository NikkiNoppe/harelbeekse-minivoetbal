-- Public schedule RPCs: replace matches_public / teams_public anon SELECT with explicit allowlists.

-- ---------------------------------------------------------------------------
-- get_public_matches
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_matches()
RETURNS TABLE(
  match_id integer,
  unique_number text,
  match_date timestamptz,
  location text,
  speeldag text,
  home_team_id integer,
  away_team_id integer,
  home_score integer,
  away_score integer,
  home_position integer,
  away_position integer,
  referee text,
  is_submitted boolean,
  is_locked boolean,
  is_cup_match boolean,
  is_playoff_match boolean,
  is_playoff_finalized boolean,
  playoff_type text,
  home_team_name text,
  away_team_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    m.match_id,
    m.unique_number::text,
    m.match_date,
    m.location::text,
    m.speeldag::text,
    m.home_team_id,
    m.away_team_id,
    m.home_score,
    m.away_score,
    m.home_position,
    m.away_position,
    m.referee::text,
    m.is_submitted,
    m.is_locked,
    m.is_cup_match,
    m.is_playoff_match,
    m.is_playoff_finalized,
    m.playoff_type::text,
    ht.team_name::text AS home_team_name,
    at.team_name::text AS away_team_name
  FROM public.matches m
  LEFT JOIN public.teams ht ON ht.team_id = m.home_team_id
  LEFT JOIN public.teams at ON at.team_id = m.away_team_id
  ORDER BY m.match_date ASC;
$$;

REVOKE ALL ON FUNCTION public.get_public_matches() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_matches() TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_matches() IS
  'Public match schedule and scores. No lineup JSONB, referee_notes, or assigned_referee_id.';

-- ---------------------------------------------------------------------------
-- get_public_teams
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_teams()
RETURNS TABLE(
  team_id integer,
  team_name text,
  club_colors text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    t.team_id,
    t.team_name::text,
    t.club_colors::text
  FROM public.teams t
  ORDER BY t.team_name::text;
$$;

REVOKE ALL ON FUNCTION public.get_public_teams() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_teams() TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_teams() IS
  'Public team names and club colors only. No contact PII.';
