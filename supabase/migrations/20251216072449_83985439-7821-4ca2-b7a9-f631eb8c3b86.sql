-- Add position-based playoff columns to matches table
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS home_position integer;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS away_position integer;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS playoff_type varchar(10); -- 'top' or 'bottom'
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS is_playoff_finalized boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.matches.home_position IS 'Position in standings for home team (1-8 for top, 9-15 for bottom playoffs)';
COMMENT ON COLUMN public.matches.away_position IS 'Position in standings for away team (1-8 for top, 9-15 for bottom playoffs)';
COMMENT ON COLUMN public.matches.playoff_type IS 'Type of playoff: top (positions 1-8) or bottom (positions 9-15)';
COMMENT ON COLUMN public.matches.is_playoff_finalized IS 'Whether actual teams have been assigned to positions';