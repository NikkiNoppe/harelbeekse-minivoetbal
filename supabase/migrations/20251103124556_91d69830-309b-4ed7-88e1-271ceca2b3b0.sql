-- Drop ALLE bestaande policies op team_costs
DROP POLICY IF EXISTS "Admins and system can manage team costs" ON public.team_costs;
DROP POLICY IF EXISTS "Authenticated users can read team costs" ON public.team_costs;
DROP POLICY IF EXISTS "team_costs_anon_policy" ON public.team_costs;
DROP POLICY IF EXISTS "team_costs_public_read_final" ON public.team_costs;
DROP POLICY IF EXISTS "Public can read team costs" ON public.team_costs;

-- Maak een nieuwe policy specifiek voor postgres/triggers (zonder voorwaarden)
CREATE POLICY "Allow all for triggers and system"
ON public.team_costs
FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

-- Maak een nieuwe admin policy
CREATE POLICY "Admins can manage team costs"
ON public.team_costs
FOR ALL
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Hermaak de read policies
CREATE POLICY "Public can read team costs"
ON public.team_costs
FOR SELECT
USING (true);