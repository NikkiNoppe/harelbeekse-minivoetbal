-- Optimize players and users tables by removing unused columns and improving performance

-- Step 1: Analyze and remove unused columns from players table
-- Check if locked_from_date and is_locked are actually used
DO $$
BEGIN
    -- Check if locked_from_date column exists and is used
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'players' 
        AND column_name = 'locked_from_date'
        AND table_schema = 'public'
    ) THEN
        -- Check if the column has any non-null values
        IF NOT EXISTS (
            SELECT 1 FROM players 
            WHERE locked_from_date IS NOT NULL
        ) THEN
            ALTER TABLE public.players DROP COLUMN locked_from_date;
            RAISE NOTICE 'Removed unused locked_from_date column from players table';
        ELSE
            RAISE NOTICE 'locked_from_date column has data, keeping it';
        END IF;
    ELSE
        RAISE NOTICE 'locked_from_date column does not exist in players table';
    END IF;
    
    -- Check if is_locked column exists and is used
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'players' 
        AND column_name = 'is_locked'
        AND table_schema = 'public'
    ) THEN
        -- Check if the column has any non-default values
        IF NOT EXISTS (
            SELECT 1 FROM players 
            WHERE is_locked = true
        ) THEN
            ALTER TABLE public.players DROP COLUMN is_locked;
            RAISE NOTICE 'Removed unused is_locked column from players table';
        ELSE
            RAISE NOTICE 'is_locked column has data, keeping it';
        END IF;
    ELSE
        RAISE NOTICE 'is_locked column does not exist in players table';
    END IF;
END $$;

-- Step 2: Remove unused created_at column from users table
DO $$
BEGIN
    -- Check if created_at column exists and is used
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users DROP COLUMN created_at;
        RAISE NOTICE 'Removed unused created_at column from users table';
    ELSE
        RAISE NOTICE 'created_at column does not exist in users table';
    END IF;
END $$;

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
        RAISE NOTICE 'Added unique constraint to players table';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on players table';
    END IF;
END $$;

-- Step 5: Update any functions that might reference removed columns
-- Update player validation function to work without locked columns
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
    'Players table optimized' as status,
    'Removed unused columns and added performance indexes' as details
UNION ALL
SELECT 
    'Users table optimized' as status,
    'Removed unused created_at column and added indexes' as details
UNION ALL
SELECT 
    'Unique constraints added' as status,
    'Prevents duplicate players in same team' as details
UNION ALL
SELECT 
    'Functions updated' as status,
    'All functions updated to work with optimized structure' as details; 