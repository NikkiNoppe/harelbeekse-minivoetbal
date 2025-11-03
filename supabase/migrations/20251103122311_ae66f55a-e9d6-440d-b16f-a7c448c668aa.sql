-- Fix RLS policy voor team_costs om trigger functies toe te staan
-- De trigger functie draait als SECURITY DEFINER maar RLS blokkeert nog steeds
-- We moeten de policy aanpassen om system/trigger operaties toe te staan

-- Drop de bestaande restrictive admin policy
DROP POLICY IF EXISTS "Only admins can manage team costs" ON public.team_costs;

-- Maak een nieuwe policy die zowel admins als system functies (triggers) toestaat
CREATE POLICY "Admins and system can manage team costs"
ON public.team_costs
FOR ALL
TO public
USING (
  -- Allow if user is admin OR if current_setting for user context is empty (system/trigger context)
  get_current_user_role() = 'admin' 
  OR current_setting('request.jwt.claims', true) IS NULL
  OR pg_trigger_depth() > 0  -- Allow operations from within triggers
)
WITH CHECK (
  get_current_user_role() = 'admin' 
  OR current_setting('request.jwt.claims', true) IS NULL
  OR pg_trigger_depth() > 0
);