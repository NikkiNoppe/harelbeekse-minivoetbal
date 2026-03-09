-- Step 1: Insert Administratiekosten cost record
INSERT INTO costs (name, amount, category, is_active, description)
VALUES ('Administratiekosten', 1.00, 'match_cost', true, 'Administratiekosten per team per wedstrijd')
ON CONFLICT DO NOTHING;

-- Step 2: Update trigger to include Administratiekosten
CREATE OR REPLACE FUNCTION public.process_match_financial_costs()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  veld_cost_id INT;
  referee_cost_id INT;
  admin_cost_id INT;
BEGIN
  -- Fetch active cost settings
  SELECT id INTO veld_cost_id FROM public.costs 
  WHERE name = 'Veldkosten' AND category = 'match_cost' AND is_active = true LIMIT 1;

  SELECT id INTO referee_cost_id FROM public.costs 
  WHERE name = 'Scheidsrechterkosten' AND category = 'match_cost' AND is_active = true LIMIT 1;

  SELECT id INTO admin_cost_id FROM public.costs 
  WHERE name = 'Administratiekosten' AND category = 'match_cost' AND is_active = true LIMIT 1;

  -- If both scores are NULL, remove match costs
  IF NEW.home_score IS NULL AND NEW.away_score IS NULL THEN
    DELETE FROM public.team_costs 
    WHERE match_id = NEW.match_id
      AND cost_setting_id IN (
        SELECT id FROM public.costs WHERE category = 'match_cost' AND is_active = true
      );
    RETURN NEW;
  END IF;

  -- If match submitted with scores, ensure costs exist
  IF NEW.is_submitted = true AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
    -- Remove referee cost if no assigned referee
    IF NEW.assigned_referee_id IS NULL AND referee_cost_id IS NOT NULL THEN
      DELETE FROM public.team_costs 
      WHERE match_id = NEW.match_id 
        AND cost_setting_id = referee_cost_id;
    END IF;

    -- Home team costs
    IF veld_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date)
      VALUES (NEW.home_team_id, veld_cost_id, NEW.match_id, CURRENT_DATE)
      ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL DO NOTHING;
    END IF;

    IF admin_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date)
      VALUES (NEW.home_team_id, admin_cost_id, NEW.match_id, CURRENT_DATE)
      ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL DO NOTHING;
    END IF;

    IF NEW.assigned_referee_id IS NOT NULL AND referee_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date)
      VALUES (NEW.home_team_id, referee_cost_id, NEW.match_id, CURRENT_DATE)
      ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL DO NOTHING;
    END IF;

    -- Away team costs
    IF veld_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date)
      VALUES (NEW.away_team_id, veld_cost_id, NEW.match_id, CURRENT_DATE)
      ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL DO NOTHING;
    END IF;

    IF admin_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date)
      VALUES (NEW.away_team_id, admin_cost_id, NEW.match_id, CURRENT_DATE)
      ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL DO NOTHING;
    END IF;

    IF NEW.assigned_referee_id IS NOT NULL AND referee_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date)
      VALUES (NEW.away_team_id, referee_cost_id, NEW.match_id, CURRENT_DATE)
      ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;