-- Add match_id column to referee_availability for match-level availability tracking
ALTER TABLE public.referee_availability
ADD COLUMN IF NOT EXISTS match_id integer;

-- Add foreign key constraint to matches table
ALTER TABLE public.referee_availability
ADD CONSTRAINT referee_availability_match_id_fkey 
FOREIGN KEY (match_id) REFERENCES public.matches(match_id) ON DELETE CASCADE;

-- Create unique constraint for match-level availability (one entry per referee per match)
CREATE UNIQUE INDEX IF NOT EXISTS referee_availability_unique_match 
ON public.referee_availability(user_id, match_id) 
WHERE match_id IS NOT NULL;

-- Keep existing poll_group_id for backward compatibility
-- Create unique constraint for poll-level availability
CREATE UNIQUE INDEX IF NOT EXISTS referee_availability_unique_poll 
ON public.referee_availability(user_id, poll_group_id, poll_month) 
WHERE poll_group_id IS NOT NULL;