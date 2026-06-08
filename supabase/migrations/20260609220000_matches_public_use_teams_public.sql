-- matches_public: join teams_public i.p.v. teams (anon heeft geen SELECT op teams).

DROP VIEW IF EXISTS public.matches_public;

CREATE VIEW public.matches_public
WITH (security_invoker = false)
AS
SELECT
  m.match_id,
  m.unique_number,
  m.match_date,
  m.location,
  m.speeldag,
  m.home_team_id,
  m.away_team_id,
  m.home_score,
  m.away_score,
  m.home_position,
  m.away_position,
  m.referee,
  m.is_submitted,
  m.is_locked,
  m.is_cup_match,
  m.is_playoff_match,
  m.is_playoff_finalized,
  m.playoff_type,
  m.assigned_referee_id,
  ht.team_name AS home_team_name,
  at.team_name AS away_team_name
FROM public.matches m
LEFT JOIN public.teams_public ht ON ht.team_id = m.home_team_id
LEFT JOIN public.teams_public at ON at.team_id = m.away_team_id;

GRANT SELECT ON public.matches_public TO anon, authenticated;

COMMENT ON VIEW public.matches_public IS
  'Public match schedule and scores. Team names via teams_public (no contact PII).';
