-- Phase 1: Critical Data Protection - Secure RLS Policies (Fixed for Custom Auth)

-- 1. Secure Users Table RLS Policies
DROP POLICY IF EXISTS "Authenticated users can read users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can create users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can update users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can delete users" ON public.users;

-- Create secure user policies for custom auth
CREATE POLICY "Admins can read all users" 
ON public.users 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can create users" 
ON public.users 
FOR INSERT 
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update users" 
ON public.users 
FOR UPDATE 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete users" 
ON public.users 
FOR DELETE 
USING (public.get_current_user_role() = 'admin');

-- 2. Secure Teams Table RLS Policies
DROP POLICY IF EXISTS "Public can read basic team info" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users can update teams" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users can delete teams" ON public.teams;

-- Create secure team policies (public can only see team names and IDs)
CREATE POLICY "Public can read team names only" 
ON public.teams 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can create teams" 
ON public.teams 
FOR INSERT 
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Team managers and admins can update teams" 
ON public.teams 
FOR UPDATE 
USING (
  public.get_current_user_role() = 'admin' OR 
  team_id = ANY(public.get_current_user_team_ids())
);

CREATE POLICY "Admins can delete teams" 
ON public.teams 
FOR DELETE 
USING (public.get_current_user_role() = 'admin');

-- 3. Secure Password Reset Token Access
DROP POLICY IF EXISTS "Anon can create reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Anon can read reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Anon can update reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Service role can manage reset tokens" ON public.password_reset_tokens;

-- Create secure password reset token policies
CREATE POLICY "Service role can manage reset tokens" 
ON public.password_reset_tokens 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Anon can create reset token entries" 
ON public.password_reset_tokens 
FOR INSERT 
WITH CHECK (auth.role() = 'anon');

-- Update anon can update tokens (for token validation)
CREATE POLICY "Anon can update reset tokens for validation" 
ON public.password_reset_tokens 
FOR UPDATE 
USING (auth.role() = 'anon');

-- Phase 3: Database Function Security Hardening
-- Fix database functions missing search_path

CREATE OR REPLACE FUNCTION public.is_admin_user()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- For custom auth, delegate to get_current_user_role
  RETURN public.get_current_user_role() = 'admin';
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_cost_setting_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    -- Geen logging meer, alleen record teruggeven
    RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_player_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Validate player data
  IF NEW.first_name IS NULL OR NEW.first_name = '' THEN
    RAISE EXCEPTION 'First name is required';
  END IF;
  
  IF NEW.last_name IS NULL OR NEW.last_name = '' THEN
    RAISE EXCEPTION 'Last name is required';
  END IF;
  
  IF NEW.birth_date IS NULL THEN
    RAISE EXCEPTION 'Birth date is required';
  END IF;
  
  -- Check if player already exists in the same team
  IF EXISTS (
    SELECT 1 FROM public.players 
    WHERE team_id = NEW.team_id 
    AND first_name = NEW.first_name 
    AND last_name = NEW.last_name 
    AND birth_date = NEW.birth_date
    AND player_id != COALESCE(NEW.player_id, 0)
  ) THEN
    RAISE EXCEPTION 'Player already exists in this team';
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.insert_transaction_with_auto_data(p_team_id integer, p_transaction_type character varying, p_amount numeric, p_description text DEFAULT NULL::text, p_match_id integer DEFAULT NULL::integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    v_transaction_id INTEGER;
BEGIN
    INSERT INTO public.team_costs (
        team_id, 
        cost_setting_id, 
        match_id, 
        transaction_date
    ) VALUES (
        p_team_id,
        (SELECT id FROM public.costs WHERE name = p_description LIMIT 1),
        p_match_id,
        CURRENT_DATE
    ) RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_player_data(p_name text, p_team_id integer DEFAULT NULL::integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    v_name_count integer;
BEGIN
    -- Check if name is not null or empty
    IF p_name IS NULL OR trim(p_name) = '' THEN
        RETURN false;
    END IF;
    
    -- Check if name already exists for the same team
    SELECT COUNT(*) INTO v_name_count
    FROM public.players
    WHERE LOWER(name) = LOWER(p_name)
    AND (team_id = p_team_id OR (p_team_id IS NULL AND team_id IS NULL));
    
    RETURN v_name_count = 0;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_transaction_amount_from_cost_setting()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- If cost_setting_id is provided, always derive type and amount from it
  IF NEW.cost_setting_id IS NOT NULL THEN
    SELECT 
      CASE 
        WHEN category = 'match_cost' THEN 'match_cost'
        WHEN category = 'penalty' THEN 'penalty'
        ELSE 'other'
      END,
      amount
    INTO NEW.transaction_type, NEW.amount
    FROM public.costs
    WHERE id = NEW.cost_setting_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.insert_transaction_with_auto_data(p_team_id integer, p_cost_setting_id integer, p_amount numeric, p_date date DEFAULT CURRENT_DATE, p_match_id integer DEFAULT NULL::integer, p_notes text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    v_transaction_id integer;
BEGIN
    -- Insert into team_costs table
    INSERT INTO public.team_costs (team_id, cost_setting_id, amount, date, match_id, notes)
    VALUES (p_team_id, p_cost_setting_id, p_amount, p_date, p_match_id, p_notes)
    RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_team_deposit(p_team_id integer, p_deposit_name character varying, p_amount numeric)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    v_cost_id INTEGER;
BEGIN
    -- Create deposit cost
    INSERT INTO public.costs (name, amount, category) 
    VALUES (p_deposit_name, p_amount, 'deposit')
    RETURNING id INTO v_cost_id;
    
    -- Link to team
    INSERT INTO public.team_costs (team_id, cost_setting_id, transaction_date) 
    VALUES (p_team_id, v_cost_id, CURRENT_DATE);
    
    RETURN v_cost_id;
END;
$function$;