-- Fix RLS policy op team_costs om Edge Function DELETE operaties toe te staan
-- Rootcause: Edge Functions gebruiken service_role, niet trigger context of user role

-- Drop bestaande policy
DROP POLICY IF EXISTS "Allow authenticated operations on team_costs" ON public.team_costs;

-- Nieuwe policy die ook service_role toestaat (voor Edge Functions zoals sync-card-penalties)
CREATE POLICY "Allow authenticated operations on team_costs"
ON public.team_costs
FOR ALL
USING (
  pg_trigger_depth() > 0 
  OR get_current_user_role() = 'admin'
  OR auth.role() = 'service_role'
)
WITH CHECK (
  pg_trigger_depth() > 0 
  OR get_current_user_role() = 'admin'
  OR auth.role() = 'service_role'
);

COMMENT ON POLICY "Allow authenticated operations on team_costs" ON public.team_costs IS 
'Allows operations from:
- Database triggers (pg_trigger_depth > 0)
- Admin users (get_current_user_role = admin)
- Service role (for Edge Functions like sync-card-penalties)';

-- Log voor verificatie
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policy aangepast: Edge Functions kunnen nu DELETE operaties uitvoeren';
  RAISE NOTICE '✅ sync-card-penalties Edge Function zou nu moeten werken';
END $$;