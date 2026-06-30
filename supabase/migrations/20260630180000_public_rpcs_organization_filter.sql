-- Optionele organization_id-filter op publieke schedule-RPC's (default 1 = Harelbeke).

DROP FUNCTION IF EXISTS public.get_public_matches();
DROP FUNCTION IF EXISTS public.get_public_teams();

CREATE OR REPLACE FUNCTION public.get_public_matches(p_organization_id integer DEFAULT 1)
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
  WHERE m.organization_id = p_organization_id
  ORDER BY m.match_date ASC;
$$;

CREATE OR REPLACE FUNCTION public.get_public_teams(p_organization_id integer DEFAULT 1)
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
  WHERE t.organization_id = p_organization_id
  ORDER BY t.team_name ASC;
$$;

REVOKE ALL ON FUNCTION public.get_public_matches(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_teams(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_matches(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_teams(integer) TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_matches(integer) IS
  'Public match schedule per organization. Default org 1 (Harelbeke).';
COMMENT ON FUNCTION public.get_public_teams(integer) IS
  'Public team names per organization. Default org 1 (Harelbeke).';
