-- Drop de bestaande trigger policy die alleen voor postgres role werkte
DROP POLICY IF EXISTS "Allow all for triggers and system" ON public.team_costs;

-- Maak een nieuwe policy die werkt in trigger context voor ALLE rollen
CREATE POLICY "Allow trigger operations"
ON public.team_costs
FOR ALL
TO public
USING (pg_trigger_depth() > 0)
WITH CHECK (pg_trigger_depth() > 0);

-- Ensure admin policy bestaat (indien nog niet)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'team_costs' 
    AND policyname = 'Admins can manage team costs'
  ) THEN
    CREATE POLICY "Admins can manage team costs"
    ON public.team_costs
    FOR ALL
    USING (get_current_user_role() = 'admin')
    WITH CHECK (get_current_user_role() = 'admin');
  END IF;
END $$;

-- Ensure public read policy bestaat (indien nog niet)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'team_costs' 
    AND policyname = 'Public can read team costs'
  ) THEN
    CREATE POLICY "Public can read team costs"
    ON public.team_costs
    FOR SELECT
    USING (true);
  END IF;
END $$;