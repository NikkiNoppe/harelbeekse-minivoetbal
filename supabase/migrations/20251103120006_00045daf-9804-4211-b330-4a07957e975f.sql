-- Fix the process_match_financial_costs trigger to handle NULL cost IDs properly
-- This prevents "DELETE requires a WHERE clause" errors

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
  -- Get the cost setting IDs for field and referee costs
  SELECT id INTO veld_cost_id FROM public.costs 
  WHERE name = 'Veldkosten' AND category = 'match' AND is_active = true 
  LIMIT 1;

  SELECT id INTO referee_cost_id FROM public.costs 
  WHERE name = 'Scheidsrechterkosten' AND category = 'match' AND is_active = true 
  LIMIT 1;

  -- If both scores become null (match result cleared), remove all match costs
  IF NEW.home_score IS NULL AND NEW.away_score IS NULL THEN
    -- Only delete if we have valid cost IDs to filter on
    IF veld_cost_id IS NOT NULL OR referee_cost_id IS NOT NULL THEN
      DELETE FROM public.team_costs 
      WHERE match_id = NEW.match_id
        AND cost_setting_id IN (
          SELECT id FROM (
            SELECT veld_cost_id AS id WHERE veld_cost_id IS NOT NULL
            UNION ALL
            SELECT referee_cost_id AS id WHERE referee_cost_id IS NOT NULL
          ) AS valid_ids
        );
    END IF;
    RETURN NEW;
  END IF;

  -- If match is submitted with scores, ensure costs exist
  IF NEW.is_submitted = true AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
    -- Remove referee cost if match has no assigned referee
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