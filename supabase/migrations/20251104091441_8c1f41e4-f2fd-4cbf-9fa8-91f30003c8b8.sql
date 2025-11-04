-- VOLLEDIGE FIX: Match Costs RLS en Trigger
-- Stap 1: Trigger tijdelijk uitschakelen
-- Stap 2: RLS Policy aanpassen voor DELETE operaties
-- Stap 3: Trigger opnieuw activeren

-- ===== STAP 1: Trigger uitschakelen =====
DROP TRIGGER IF EXISTS process_match_costs_trigger ON public.matches;

-- ===== STAP 2: RLS Policy Fix =====
-- Drop de oude restrictieve policy
DROP POLICY IF EXISTS "Allow trigger operations" ON public.team_costs;

-- Maak nieuwe policy die ook DELETE vanuit de app toestaat voor admins
CREATE POLICY "Allow authenticated operations on team_costs" ON public.team_costs
  FOR ALL
  USING (
    -- Triggers kunnen altijd opereren
    pg_trigger_depth() > 0 
    OR 
    -- Admins kunnen alles (inclusief DELETE)
    get_current_user_role() = 'admin'
  )
  WITH CHECK (
    pg_trigger_depth() > 0 
    OR 
    get_current_user_role() = 'admin'
  );

-- ===== STAP 3: Trigger opnieuw activeren =====
CREATE TRIGGER process_match_costs_trigger
  AFTER INSERT OR UPDATE ON public.matches
  FOR EACH ROW
  WHEN (NEW.is_submitted = true AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL)
  EXECUTE FUNCTION public.process_match_financial_costs();