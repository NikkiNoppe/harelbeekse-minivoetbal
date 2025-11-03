-- Create the missing trigger on matches table to handle financial costs
-- This trigger will automatically manage team_costs when a match is submitted

DROP TRIGGER IF EXISTS process_match_costs_trigger ON public.matches;

CREATE TRIGGER process_match_costs_trigger
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  WHEN (
    NEW.is_submitted = true 
    AND OLD.is_submitted = false
    AND NEW.home_score IS NOT NULL 
    AND NEW.away_score IS NOT NULL
    AND NEW.is_cup_match = false
  )
  EXECUTE FUNCTION public.process_match_financial_costs();

-- Log for verification
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger process_match_costs_trigger created successfully on matches table';
END $$;