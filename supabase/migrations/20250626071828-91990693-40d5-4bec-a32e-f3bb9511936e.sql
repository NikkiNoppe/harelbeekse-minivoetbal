
-- Add location column to matches table
ALTER TABLE public.matches 
ADD COLUMN location TEXT;

-- Update existing matches to have a default location if needed
UPDATE public.matches 
SET location = 'Te bepalen' 
WHERE location IS NULL;
