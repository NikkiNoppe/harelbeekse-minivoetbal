-- Create a direct update function to bypass problematic triggers
-- This function will update match scores without triggering the problematic DELETE operations

CREATE OR REPLACE FUNCTION public.direct_update_match_scores(
  match_id_param integer,
  home_score_param integer,
  away_score_param integer
)
RETURNS TABLE(match_id integer, home_score integer, away_score integer, updated_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Direct SQL update without triggers that might cause DELETE issues
  UPDATE public.matches 
  SET 
    home_score = home_score_param,
    away_score = away_score_param,
    updated_at = NOW()
  WHERE matches.match_id = match_id_param;
  
  -- Return the updated row
  RETURN QUERY
  SELECT matches.match_id, matches.home_score, matches.away_score, matches.updated_at
  FROM public.matches
  WHERE matches.match_id = match_id_param;
END;
$function$; 