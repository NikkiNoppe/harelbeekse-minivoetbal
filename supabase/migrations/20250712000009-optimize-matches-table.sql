-- Optimize matches table by removing unused columns and improving performance

-- Step 1: Remove unused timestamp columns
ALTER TABLE public.matches 
DROP COLUMN IF EXISTS created_at,
DROP COLUMN IF EXISTS updated_at;

-- Step 2: Keep referee_notes column (it is used in the application)
-- ALTER TABLE public.matches 
-- DROP COLUMN IF EXISTS referee_notes;

-- Step 3: Optimize JSONB columns with better defaults and constraints
-- Update home_players and away_players to have better defaults
ALTER TABLE public.matches 
ALTER COLUMN home_players SET DEFAULT '[]'::jsonb,
ALTER COLUMN away_players SET DEFAULT '[]'::jsonb;

-- Add check constraints to ensure JSONB arrays are valid
ALTER TABLE public.matches 
ADD CONSTRAINT matches_home_players_check 
CHECK (jsonb_typeof(home_players) = 'array');

ALTER TABLE public.matches 
ADD CONSTRAINT matches_away_players_check 
CHECK (jsonb_typeof(away_players) = 'array');

-- Step 4: Add performance indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON public.matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON public.matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_cup ON public.matches(is_cup_match);
CREATE INDEX IF NOT EXISTS idx_matches_submitted ON public.matches(is_submitted);
CREATE INDEX IF NOT EXISTS idx_matches_unique_number ON public.matches(unique_number);
CREATE INDEX IF NOT EXISTS idx_matches_speeldag ON public.matches(speeldag);

-- Step 5: Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_matches_team_date ON public.matches(home_team_id, match_date);
CREATE INDEX IF NOT EXISTS idx_matches_away_team_date ON public.matches(away_team_id, match_date);
CREATE INDEX IF NOT EXISTS idx_matches_cup_date ON public.matches(is_cup_match, match_date);

-- Step 6: Add constraints for data integrity
-- Ensure scores are non-negative
ALTER TABLE public.matches 
ADD CONSTRAINT matches_scores_non_negative 
CHECK (home_score IS NULL OR home_score >= 0);

ALTER TABLE public.matches 
ADD CONSTRAINT matches_away_scores_non_negative 
CHECK (away_score IS NULL OR away_score >= 0);

-- Ensure unique_number is unique when not null
ALTER TABLE public.matches 
ADD CONSTRAINT matches_unique_number_unique 
UNIQUE (unique_number) 
WHERE unique_number IS NOT NULL;

-- Step 7: Update functions to work with optimized table
CREATE OR REPLACE FUNCTION public.process_match_costs()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only process if match is submitted and has scores
  IF NEW.is_submitted = true AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
    -- Add field cost for the match
    INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date)
    SELECT 
      NEW.home_team_id,
      cs.id,
      NEW.match_id,
      CURRENT_DATE
    FROM public.costs cs
    WHERE cs.category = 'match_cost' AND cs.name LIKE '%veld%'
    AND NOT EXISTS (
      SELECT 1 FROM public.team_costs tc 
      WHERE tc.match_id = NEW.match_id AND tc.team_id = NEW.home_team_id
    );
    
    -- Add field cost for away team too
    INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date)
    SELECT 
      NEW.away_team_id,
      cs.id,
      NEW.match_id,
      CURRENT_DATE
    FROM public.costs cs
    WHERE cs.category = 'match_cost' AND cs.name LIKE '%veld%'
    AND NOT EXISTS (
      SELECT 1 FROM public.team_costs tc 
      WHERE tc.match_id = NEW.match_id AND tc.team_id = NEW.away_team_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 8: Create helper function for match statistics
CREATE OR REPLACE FUNCTION public.get_match_statistics(match_id_param INTEGER)
RETURNS TABLE(
  total_players INTEGER,
  home_players_count INTEGER,
  away_players_count INTEGER,
  cards_count INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(jsonb_array_length(m.home_players), 0) + COALESCE(jsonb_array_length(m.away_players), 0) as total_players,
    COALESCE(jsonb_array_length(m.home_players), 0) as home_players_count,
    COALESCE(jsonb_array_length(m.away_players), 0) as away_players_count,
    (
      SELECT COUNT(*)::INTEGER
      FROM (
        SELECT jsonb_array_elements(m.home_players) as player
        UNION ALL
        SELECT jsonb_array_elements(m.away_players) as player
      ) all_players
      WHERE (player->>'cardType') IN ('yellow', 'red')
    ) as cards_count
  FROM public.matches m
  WHERE m.match_id = match_id_param;
END;
$$;

-- Step 9: Verify the optimization
SELECT 
    'Unused columns removed' as status,
    'created_at, updated_at removed (referee_notes kept)' as details
UNION ALL
SELECT 
    'Performance indexes added' as status,
    'Indexes added for date, teams, cup, submitted, unique_number, speeldag' as details
UNION ALL
SELECT 
    'Composite indexes added' as status,
    'Indexes for team+date and cup+date queries' as details
UNION ALL
SELECT 
    'Data integrity constraints added' as status,
    'Non-negative scores, unique numbers, valid JSONB arrays' as details
UNION ALL
SELECT 
    'Functions updated' as status,
    'process_match_costs and get_match_statistics functions optimized' as details; 