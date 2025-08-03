-- First, delete existing competition data to test fresh generation
DELETE FROM public.team_costs WHERE match_id IN (
  SELECT match_id FROM public.matches WHERE is_cup_match = false
);

DELETE FROM public.matches WHERE is_cup_match = false;

-- Clear competition standings for fresh start
DELETE FROM public.competition_standings WHERE true;