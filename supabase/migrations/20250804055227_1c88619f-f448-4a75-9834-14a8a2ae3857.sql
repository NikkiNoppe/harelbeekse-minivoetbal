-- Create function to automatically process match financial costs
CREATE OR REPLACE FUNCTION public.process_match_financial_costs()
RETURNS TRIGGER AS $$
DECLARE
    veld_cost_id INTEGER;
    referee_cost_id INTEGER;
BEGIN
    -- Get cost setting IDs
    SELECT id INTO veld_cost_id FROM public.costs 
    WHERE category = 'match_cost' AND name = 'Veldkosten per wedstrijd' AND is_active = true;
    
    SELECT id INTO referee_cost_id FROM public.costs 
    WHERE category = 'match_cost' AND name = 'Scheidsrechterkosten per wedstrijd per team' AND is_active = true;

    -- If match is being submitted with scores, add costs
    IF NEW.is_submitted = true AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
        
        -- Add field costs for both teams (only if not already exists)
        IF veld_cost_id IS NOT NULL THEN
            INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date)
            SELECT NEW.home_team_id, veld_cost_id, NEW.match_id, CURRENT_DATE
            WHERE NOT EXISTS (
                SELECT 1 FROM public.team_costs 
                WHERE team_id = NEW.home_team_id AND match_id = NEW.match_id AND cost_setting_id = veld_cost_id
            );
            
            INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date)
            SELECT NEW.away_team_id, veld_cost_id, NEW.match_id, CURRENT_DATE
            WHERE NOT EXISTS (
                SELECT 1 FROM public.team_costs 
                WHERE team_id = NEW.away_team_id AND match_id = NEW.match_id AND cost_setting_id = veld_cost_id
            );
        END IF;
        
        -- Add referee costs for both teams if referee is assigned (only if not already exists)
        IF NEW.referee IS NOT NULL AND NEW.referee != '' AND referee_cost_id IS NOT NULL THEN
            INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date)
            SELECT NEW.home_team_id, referee_cost_id, NEW.match_id, CURRENT_DATE
            WHERE NOT EXISTS (
                SELECT 1 FROM public.team_costs 
                WHERE team_id = NEW.home_team_id AND match_id = NEW.match_id AND cost_setting_id = referee_cost_id
            );
            
            INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date)
            SELECT NEW.away_team_id, referee_cost_id, NEW.match_id, CURRENT_DATE
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
        
        INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date)
        SELECT NEW.home_team_id, referee_cost_id, NEW.match_id, CURRENT_DATE
        WHERE NOT EXISTS (
            SELECT 1 FROM public.team_costs 
            WHERE team_id = NEW.home_team_id AND match_id = NEW.match_id AND cost_setting_id = referee_cost_id
        );
        
        INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date)
        SELECT NEW.away_team_id, referee_cost_id, NEW.match_id, CURRENT_DATE
        WHERE NOT EXISTS (
            SELECT 1 FROM public.team_costs 
            WHERE team_id = NEW.away_team_id AND match_id = NEW.match_id AND cost_setting_id = referee_cost_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically process match costs
DROP TRIGGER IF EXISTS trigger_process_match_costs ON public.matches;

CREATE TRIGGER trigger_process_match_costs
    AFTER UPDATE ON public.matches
    FOR EACH ROW
    WHEN (
        OLD.is_submitted IS DISTINCT FROM NEW.is_submitted OR
        OLD.home_score IS DISTINCT FROM NEW.home_score OR
        OLD.away_score IS DISTINCT FROM NEW.away_score OR
        OLD.referee IS DISTINCT FROM NEW.referee
    )
    EXECUTE FUNCTION public.process_match_financial_costs();