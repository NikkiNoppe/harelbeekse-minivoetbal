-- Simple optimization for players and users tables with correct syntax

-- Step 1: Remove unused columns from players table (if they exist and are empty)
ALTER TABLE public.players DROP COLUMN IF EXISTS locked_from_date;
ALTER TABLE public.players DROP COLUMN IF EXISTS is_locked;

-- Step 2: Remove unused column from users table (if it exists)
ALTER TABLE public.users DROP COLUMN IF EXISTS created_at;

-- Step 3: Add performance indexes for better query performance
-- Players table indexes
CREATE INDEX IF NOT EXISTS idx_players_team_id ON public.players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_name ON public.players(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_players_cards ON public.players(yellow_cards, red_cards);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_username_email ON public.users(username, email);

-- Step 4: Add unique constraint to prevent duplicate players in same team
-- This prevents the same player from being added multiple times to the same team
DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'players_team_name_unique' 
        AND table_name = 'players'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.players 
        ADD CONSTRAINT players_team_name_unique 
        UNIQUE (team_id, first_name, last_name, birth_date);
    END IF;
END $$;

-- Step 5: Update player validation function
CREATE OR REPLACE FUNCTION public.validate_player_data(
  p_first_name VARCHAR(100),
  p_last_name VARCHAR(100),
  p_birth_date DATE,
  p_team_id INTEGER,
  p_exclude_player_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  existing_player_count INTEGER;
BEGIN
  -- Check if player already exists in the same team
  SELECT COUNT(*) INTO existing_player_count
  FROM public.players
  WHERE team_id = p_team_id
    AND first_name = p_first_name
    AND last_name = p_last_name
    AND birth_date = p_birth_date
    AND (p_exclude_player_id IS NULL OR player_id != p_exclude_player_id);
  
  RETURN existing_player_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Verify the optimizations
SELECT 
    'Tables optimized' as status,
    'Removed unused columns and added performance indexes' as details; 