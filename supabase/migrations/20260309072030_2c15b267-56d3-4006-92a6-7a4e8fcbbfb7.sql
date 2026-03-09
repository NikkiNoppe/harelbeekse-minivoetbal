-- Step 1: Delete duplicate team_costs, keeping only the oldest record per (match_id, team_id, cost_setting_id)
DELETE FROM team_costs
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY match_id, team_id, cost_setting_id 
      ORDER BY id
    ) as rn
    FROM team_costs
    WHERE match_id IS NOT NULL
  ) sub WHERE rn > 1
);

-- Step 2: Add unique constraint to prevent future duplicates
-- Use a partial unique index (only where match_id IS NOT NULL) to allow multiple NULL match_ids
CREATE UNIQUE INDEX IF NOT EXISTS unique_team_match_cost 
ON team_costs (match_id, team_id, cost_setting_id) 
WHERE match_id IS NOT NULL;

-- Step 3: Fix the DB trigger - change category = 'match' to category = 'match_cost'
CREATE OR REPLACE FUNCTION public.process_match_financial_costs()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  veld_cost_id INT;
  referee_cost_id INT;
BEGIN
  -- Fetch active cost settings with CORRECT category
  SELECT id INTO veld_cost_id FROM public.costs 
  WHERE name = 'Veldkosten' AND category = 'match_cost' AND is_active = true 
  LIMIT 1;

  SELECT id INTO referee_cost_id FROM public.costs 
  WHERE name = 'Scheidsrechterkosten' AND category = 'match_cost' AND is_active = true 
  LIMIT 1;

  -- If both scores are NULL, remove only the specific costs for this match
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
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date)
      VALUES (NEW.home_team_id, veld_cost_id, NEW.match_id, CURRENT_DATE)
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

    IF NEW.assigned_referee_id IS NOT NULL AND referee_cost_id IS NOT NULL THEN
      INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date)
      VALUES (NEW.away_team_id, referee_cost_id, NEW.match_id, CURRENT_DATE)
      ON CONFLICT (match_id, team_id, cost_setting_id) WHERE match_id IS NOT NULL DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;