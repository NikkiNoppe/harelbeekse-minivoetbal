-- Fix: prevent "DELETE requires a WHERE clause" when clearing scores
-- Safe, idempotent trigger function and trigger re-creation

CREATE OR REPLACE FUNCTION public.process_match_financial_costs()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  veld_cost_id INT;
  referee_cost_id INT;
BEGIN
  -- Fetch active cost settings
  SELECT id INTO veld_cost_id FROM public.costs 
  WHERE name = 'Veldkosten' AND category = 'match' AND is_active = true 
  LIMIT 1;

  SELECT id INTO referee_cost_id FROM public.costs 
  WHERE name = 'Scheidsrechterkosten' AND category = 'match' AND is_active = true 
  LIMIT 1;

  -- If both scores are NULL, remove only the specific costs for this match (guarded by WHERE)
  IF NEW.home_score IS NULL AND NEW.away_score IS NULL THEN
    IF veld_cost_id IS NOT NULL OR referee_cost_id IS NOT NULL THEN
      DELETE FROM public.team_costs 
      WHERE match_id = NEW.match_id
        AND (
          (veld_cost_id IS NOT NULL AND cost_setting_id = veld_cost_id) OR
          (referee_cost_id IS NOT NULL AND cost_setting_id = referee_cost_id)
        );
    END IF;
    RETURN NEW;
  END IF;

  -- If match submitted with scores, ensure costs exist and are correct
  IF NEW.is_submitted = true AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
    -- Remove referee cost if no assigned referee
    IF NEW.assigned_referee_id IS NULL AND referee_cost_id IS NOT NULL THEN
      DELETE FROM public.team_costs 
      WHERE match_id = NEW.match_id 
        AND cost_setting_id = referee_cost_id;
    END IF;

    -- Home team costs
    IF veld_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, created_at)
      VALUES (NEW.home_team_id, veld_cost_id, NEW.match_id, NOW())
      ON CONFLICT (team_id, cost_setting_id, match_id) DO NOTHING;
    END IF;

    IF NEW.assigned_referee_id IS NOT NULL AND referee_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, created_at)
      VALUES (NEW.home_team_id, referee_cost_id, NEW.match_id, NOW())
      ON CONFLICT (team_id, cost_setting_id, match_id) DO NOTHING;
    END IF;

    -- Away team costs
    IF veld_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, created_at)
      VALUES (NEW.away_team_id, veld_cost_id, NEW.match_id, NOW())
      ON CONFLICT (team_id, cost_setting_id, match_id) DO NOTHING;
    END IF;

    IF NEW.assigned_referee_id IS NOT NULL AND referee_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, created_at)
      VALUES (NEW.away_team_id, referee_cost_id, NEW.match_id, NOW())
      ON CONFLICT (team_id, cost_setting_id, match_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists and points to the corrected function
DO $$
BEGIN
  -- Drop any existing triggers that might reference old functions
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname IN (
      'process_match_costs_trigger',
      'trigger_process_match_costs',
      'trigger_match_costs',
      'match_costs_trigger'
    )
  ) THEN
    DROP TRIGGER IF EXISTS process_match_costs_trigger ON public.matches;
    DROP TRIGGER IF EXISTS trigger_process_match_costs ON public.matches;
    DROP TRIGGER IF EXISTS trigger_match_costs ON public.matches;
    DROP TRIGGER IF EXISTS match_costs_trigger ON public.matches;
  END IF;

  -- Recreate a single canonical trigger name
  CREATE TRIGGER process_match_costs_trigger
  AFTER UPDATE OF home_score, away_score, is_submitted ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.process_match_financial_costs();
END $$;

-- Notice for deploy logs
DO $$ BEGIN RAISE NOTICE '✅ Trigger function updated and trigger re-created'; END $$;


