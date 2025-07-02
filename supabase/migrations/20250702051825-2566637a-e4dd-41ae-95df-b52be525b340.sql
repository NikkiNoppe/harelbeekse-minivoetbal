
-- Fix 1: Enable RLS on team_transactions table and add policies
ALTER TABLE public.team_transactions ENABLE ROW LEVEL SECURITY;

-- Add admin policy for team_transactions
CREATE POLICY "Admins can manage all team transactions"
  ON public.team_transactions
  FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Add read access for team managers to their own team's transactions
CREATE POLICY "Team managers can view their team transactions"
  ON public.team_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_users tu
      WHERE tu.team_id = team_transactions.team_id
      AND tu.user_id = (
        SELECT user_id FROM public.users
        WHERE username = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Fix 2: Add policies for cost_settings table (currently has RLS enabled but no policies)
CREATE POLICY "Admins can manage cost settings"
  ON public.cost_settings
  FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Public can read active cost settings"
  ON public.cost_settings
  FOR SELECT
  USING (is_active = true);

-- Fix 3: Update functions with proper search_path to fix security warnings
CREATE OR REPLACE FUNCTION public.calculate_team_balance(team_id_param integer)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  balance DECIMAL(10,2) := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN transaction_type = 'deposit' THEN amount
      ELSE -amount
    END
  ), 0)
  INTO balance
  FROM public.team_transactions
  WHERE team_id = team_id_param;
  
  RETURN balance;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_team_balance_updated(team_id_param integer)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  balance DECIMAL(10,2) := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN transaction_type = 'deposit' THEN amount
      ELSE -amount
    END
  ), 0)
  INTO balance
  FROM public.team_transactions
  WHERE team_id = team_id_param;
  
  RETURN balance;
END;
$function$;

-- Fix 4: Fix the update_team_balances function to avoid "UPDATE requires WHERE clause" error
CREATE OR REPLACE FUNCTION public.update_team_balances()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  team_record RECORD;
BEGIN
  FOR team_record IN SELECT team_id FROM public.teams
  LOOP
    UPDATE public.teams 
    SET balance = public.calculate_team_balance(team_record.team_id)
    WHERE team_id = team_record.team_id;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_update_team_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Update balance voor het oude team
    UPDATE public.teams 
    SET balance = public.calculate_team_balance_updated(OLD.team_id)
    WHERE team_id = OLD.team_id;
    RETURN OLD;
  ELSE
    -- Update balance voor het nieuwe team
    UPDATE public.teams 
    SET balance = public.calculate_team_balance_updated(NEW.team_id)
    WHERE team_id = NEW.team_id;
    
    -- Als team_id is gewijzigd, update ook het oude team
    IF TG_OP = 'UPDATE' AND OLD.team_id IS DISTINCT FROM NEW.team_id THEN
      UPDATE public.teams 
      SET balance = public.calculate_team_balance_updated(OLD.team_id)
      WHERE team_id = OLD.team_id;
    END IF;
    
    RETURN NEW;
  END IF;
END;
$function$;

-- Fix 5: Enhance admin policies for all major tables to ensure admins have full access
-- Update matches table policies
DROP POLICY IF EXISTS "Enable update for users based on admin" ON public.matches;
CREATE POLICY "Admins have full access to matches"
  ON public.matches
  FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Ensure team managers can update matches for their teams
CREATE POLICY "Team managers can update their team matches"
  ON public.matches
  FOR UPDATE
  USING (
    home_team_id IN (
      SELECT tu.team_id FROM public.team_users tu
      INNER JOIN public.users u ON tu.user_id = u.user_id
      WHERE u.username = current_setting('request.jwt.claims', true)::json->>'sub'
      AND u.role = 'player_manager'
    )
    OR
    away_team_id IN (
      SELECT tu.team_id FROM public.team_users tu
      INNER JOIN public.users u ON tu.user_id = u.user_id
      WHERE u.username = current_setting('request.jwt.claims', true)::json->>'sub'
      AND u.role = 'player_manager'
    )
  )
  WITH CHECK (
    home_team_id IN (
      SELECT tu.team_id FROM public.team_users tu
      INNER JOIN public.users u ON tu.user_id = u.user_id
      WHERE u.username = current_setting('request.jwt.claims', true)::json->>'sub'
      AND u.role = 'player_manager'
    )
    OR
    away_team_id IN (
      SELECT tu.team_id FROM public.team_users tu
      INNER JOIN public.users u ON tu.user_id = u.user_id
      WHERE u.username = current_setting('request.jwt.claims', true)::json->>'sub'
      AND u.role = 'player_manager'
    )
  );

-- Ensure referees can also update matches
CREATE POLICY "Referees can update matches"
  ON public.matches
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE username = current_setting('request.jwt.claims', true)::json->>'sub'
      AND role = 'referee'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE username = current_setting('request.jwt.claims', true)::json->>'sub'
      AND role = 'referee'
    )
  );
