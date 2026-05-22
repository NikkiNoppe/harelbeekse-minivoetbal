-- Track update_competition_standings_optimized in repo (already live in production).
-- Adds is_playoff_match filter so direct rebuilds never count playoff matches.

CREATE OR REPLACE FUNCTION public.update_competition_standings_optimized()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  match_record RECORD;
BEGIN
  INSERT INTO public.competition_standings (
    team_id, matches_played, wins, draws, losses,
    goals_scored, goals_against, goal_difference, points
  )
  SELECT t.team_id, 0, 0, 0, 0, 0, 0, 0, 0
  FROM public.teams t
  ON CONFLICT (team_id) DO NOTHING;

  UPDATE public.competition_standings cs
  SET
    matches_played = 0,
    wins = 0,
    draws = 0,
    losses = 0,
    goals_scored = 0,
    goals_against = 0,
    goal_difference = 0,
    points = 0
  WHERE cs.team_id IN (SELECT team_id FROM public.teams);

  FOR match_record IN
    SELECT
      home_team_id,
      away_team_id,
      home_score,
      away_score
    FROM public.matches
    WHERE is_submitted = true
      AND home_score IS NOT NULL
      AND away_score IS NOT NULL
      AND is_cup_match = false
      AND is_playoff_match = false
  LOOP
    UPDATE public.competition_standings cs
    SET
      matches_played = matches_played + 1,
      goals_scored   = goals_scored   + match_record.home_score,
      goals_against  = goals_against  + match_record.away_score,
      goal_difference= goal_difference+ (match_record.home_score - match_record.away_score),
      wins           = wins           + CASE WHEN match_record.home_score > match_record.away_score THEN 1 ELSE 0 END,
      draws          = draws          + CASE WHEN match_record.home_score = match_record.away_score THEN 1 ELSE 0 END,
      losses         = losses         + CASE WHEN match_record.home_score < match_record.away_score THEN 1 ELSE 0 END,
      points         = points         + CASE
                                         WHEN match_record.home_score > match_record.away_score THEN 3
                                         WHEN match_record.home_score = match_record.away_score THEN 1
                                         ELSE 0
                                       END
    WHERE cs.team_id = match_record.home_team_id;

    UPDATE public.competition_standings cs
    SET
      matches_played = matches_played + 1,
      goals_scored   = goals_scored   + match_record.away_score,
      goals_against  = goals_against  + match_record.home_score,
      goal_difference= goal_difference+ (match_record.away_score - match_record.home_score),
      wins           = wins           + CASE WHEN match_record.away_score > match_record.home_score THEN 1 ELSE 0 END,
      draws          = draws          + CASE WHEN match_record.away_score = match_record.home_score THEN 1 ELSE 0 END,
      losses         = losses         + CASE WHEN match_record.away_score < match_record.home_score THEN 1 ELSE 0 END,
      points         = points         + CASE
                                         WHEN match_record.away_score > match_record.home_score THEN 3
                                         WHEN match_record.away_score = match_record.home_score THEN 1
                                         ELSE 0
                                       END
    WHERE cs.team_id = match_record.away_team_id;
  END LOOP;
END;
$function$;

SELECT public.update_competition_standings_optimized();
