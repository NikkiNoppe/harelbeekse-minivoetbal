
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
  -- No forfait exception: costs are always applied when scores exist
  -- Forfait adjustments are handled manually by admin

  SELECT id INTO veld_cost_id FROM public.costs 
  WHERE name = 'Veldkosten' AND category = 'match_cost' AND is_active = true LIMIT 1;

  SELECT id INTO referee_cost_id FROM public.costs 
  WHERE name = 'Scheidsrechterkosten' AND category = 'match_cost' AND is_active = true LIMIT 1;

  SELECT id INTO admin_cost_id FROM public.costs 
  WHERE name = 'Administratiekosten' AND category = 'match_cost' AND is_active = true LIMIT 1;

  IF NEW.home_score IS NULL AND NEW.away_score IS NULL THEN
    DELETE FROM public.team_costs 
    WHERE match_id = NEW.match_id
      AND cost_setting_id IN (
        SELECT id FROM public.costs WHERE category = 'match_cost' AND is_active = true
      );
    RETURN NEW;
  END IF;

  IF NEW.is_submitted = true 
     AND (OLD.is_submitted = false OR OLD.is_submitted IS NULL)
     AND NEW.home_score IS NOT NULL 
     AND NEW.away_score IS NOT NULL THEN
    
    IF NEW.assigned_referee_id IS NULL AND referee_cost_id IS NOT NULL THEN
      DELETE FROM public.team_costs 
      WHERE match_id = NEW.match_id 
        AND cost_setting_id = referee_cost_id;
    END IF;

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
