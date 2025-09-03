-- Update the process_match_financial_costs function to use correct cost setting names
CREATE OR REPLACE FUNCTION public.process_match_financial_costs()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    veld_cost_id INTEGER;
    referee_cost_id INTEGER;
    veld_cost_amount NUMERIC;
    referee_cost_amount NUMERIC;
BEGIN
    -- Get cost setting IDs and amounts (updated names to match actual cost settings)
    SELECT id, amount INTO veld_cost_id, veld_cost_amount FROM public.costs 
    WHERE category = 'match_cost' AND name = 'Veldkosten' AND is_active = true;
    
    SELECT id, amount INTO referee_cost_id, referee_cost_amount FROM public.costs 
    WHERE category = 'match_cost' AND name = 'Scheidsrechterkosten' AND is_active = true;

    -- If match is being submitted with scores, add costs
    IF NEW.is_submitted = true AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
        
        -- Add field costs for both teams (only if not already exists)
        IF veld_cost_id IS NOT NULL THEN
            INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date, amount)
            SELECT NEW.home_team_id, veld_cost_id, NEW.match_id, CURRENT_DATE, veld_cost_amount
            WHERE NOT EXISTS (
                SELECT 1 FROM public.team_costs 
                WHERE team_id = NEW.home_team_id AND match_id = NEW.match_id AND cost_setting_id = veld_cost_id
            );
            
            INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date, amount)
            SELECT NEW.away_team_id, veld_cost_id, NEW.match_id, CURRENT_DATE, veld_cost_amount
            WHERE NOT EXISTS (
                SELECT 1 FROM public.team_costs 
                WHERE team_id = NEW.away_team_id AND match_id = NEW.match_id AND cost_setting_id = veld_cost_id
            );
        END IF;
        
        -- Add referee costs for both teams if referee is assigned (only if not already exists)
        IF NEW.referee IS NOT NULL AND NEW.referee != '' AND referee_cost_id IS NOT NULL THEN
            INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date, amount)
            SELECT NEW.home_team_id, referee_cost_id, NEW.match_id, CURRENT_DATE, referee_cost_amount
            WHERE NOT EXISTS (
                SELECT 1 FROM public.team_costs 
                WHERE team_id = NEW.home_team_id AND match_id = NEW.match_id AND cost_setting_id = referee_cost_id
            );
            
            INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date, amount)
            SELECT NEW.away_team_id, referee_cost_id, NEW.match_id, CURRENT_DATE, referee_cost_amount
            WHERE NOT EXISTS (
                SELECT 1 FROM public.team_costs 
                WHERE team_id = NEW.away_team_id AND match_id = NEW.match_id AND cost_setting_id = referee_cost_id
            );
        END IF;
        
    -- If match is being cleared (scores removed or not submitted), remove associated costs
    ELSIF (NEW.is_submitted = false OR NEW.home_score IS NULL OR NEW.away_score IS NULL) AND 
          (OLD.is_submitted = true AND OLD.home_score IS NOT NULL AND OLD.away_score IS NOT NULL) THEN
        
        -- Remove all match-related costs for this match
        DELETE FROM public.team_costs 
        WHERE match_id = NEW.match_id 
        AND cost_setting_id IN (veld_cost_id, referee_cost_id);
        
    -- If referee is removed but match still has scores, remove only referee costs
    ELSIF NEW.is_submitted = true AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL AND
          (NEW.referee IS NULL OR NEW.referee = '') AND 
          (OLD.referee IS NOT NULL AND OLD.referee != '') THEN
        
        DELETE FROM public.team_costs 
        WHERE match_id = NEW.match_id 
        AND cost_setting_id = referee_cost_id;
        
    -- If referee is added but match already has scores, add referee costs
    ELSIF NEW.is_submitted = true AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL AND
          (NEW.referee IS NOT NULL AND NEW.referee != '') AND 
          (OLD.referee IS NULL OR OLD.referee = '') AND referee_cost_id IS NOT NULL THEN
        
        INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date, amount)
        SELECT NEW.home_team_id, referee_cost_id, NEW.match_id, CURRENT_DATE, referee_cost_amount
        WHERE NOT EXISTS (
            SELECT 1 FROM public.team_costs 
            WHERE team_id = NEW.home_team_id AND match_id = NEW.match_id AND cost_setting_id = referee_cost_id
        );
        
        INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date, amount)
        SELECT NEW.away_team_id, referee_cost_id, NEW.match_id, CURRENT_DATE, referee_cost_amount
        WHERE NOT EXISTS (
            SELECT 1 FROM public.team_costs 
            WHERE team_id = NEW.away_team_id AND match_id = NEW.match_id AND cost_setting_id = referee_cost_id
        );
    END IF;
    
    RETURN NEW;
END;
$function$;