-- Add is_playoff_match column to matches table
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS is_playoff_match BOOLEAN DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_matches_is_playoff_match ON public.matches(is_playoff_match);

-- Update existing playoff matches if any exist (matches with playoff-related unique_numbers)
UPDATE public.matches 
SET is_playoff_match = true 
WHERE unique_number LIKE '%playoff%' 
   OR unique_number LIKE '%finale%' 
   OR unique_number LIKE '%halve%'
   OR speeldag LIKE '%finale%'
   OR speeldag LIKE '%playoff%';