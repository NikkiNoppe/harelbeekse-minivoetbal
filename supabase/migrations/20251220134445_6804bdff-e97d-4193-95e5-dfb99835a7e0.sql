-- ============================================================
-- SECURITY HARDENING MIGRATION
-- 1. Fix set_current_user_context() to validate from database
-- 2. Add explicit search_path to vulnerable SECURITY DEFINER functions
-- ============================================================

-- 1. CRITICAL FIX: Harden set_current_user_context()
-- Instead of trusting client-provided role/team_ids, fetch from database
CREATE OR REPLACE FUNCTION public.set_current_user_context(
  p_user_id integer, 
  p_role text, 
  p_team_ids text DEFAULT ''::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  actual_role text;
  actual_team_ids text;
BEGIN
  -- SECURITY: Fetch the ACTUAL role from the database, ignore client-provided p_role
  SELECT role::text INTO actual_role 
  FROM public.users 
  WHERE user_id = p_user_id;
  
  -- If user not found, set empty context (fail-safe)
  IF actual_role IS NULL THEN
    PERFORM set_config('app.current_user_role', '', false);
    PERFORM set_config('app.current_user_id', '', false);
    PERFORM set_config('app.current_user_team_ids', '', false);
    RETURN;
  END IF;
  
  -- SECURITY: Fetch the ACTUAL team IDs from the database, ignore client-provided p_team_ids
  SELECT string_agg(team_id::text, ',') INTO actual_team_ids
  FROM public.team_users
  WHERE user_id = p_user_id;
  
  -- Set context with SERVER-VALIDATED values only
  PERFORM set_config('app.current_user_role', actual_role, false);
  PERFORM set_config('app.current_user_id', p_user_id::text, false);
  
  IF actual_team_ids IS NOT NULL AND actual_team_ids != '' THEN
    PERFORM set_config('app.current_user_team_ids', actual_team_ids, false);
  ELSE
    PERFORM set_config('app.current_user_team_ids', '', false);
  END IF;
END;
$function$;

-- 2. Fix insert_transaction_with_auto_data (6-param version) - add search_path
CREATE OR REPLACE FUNCTION public.insert_transaction_with_auto_data(
  p_team_id integer, 
  p_cost_setting_id integer DEFAULT NULL::integer, 
  p_transaction_type character varying DEFAULT NULL::character varying, 
  p_amount numeric DEFAULT NULL::numeric, 
  p_description text DEFAULT NULL::text, 
  p_match_id integer DEFAULT NULL::integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_transaction_id INTEGER;
  derived_type VARCHAR(50);
  derived_amount DECIMAL(10,2);
BEGIN
  -- Determine transaction type and amount
  IF p_cost_setting_id IS NOT NULL THEN
    -- Get type and amount from costs
    SELECT 
      CASE 
        WHEN category = 'match_cost' THEN 'match_cost'
        WHEN category = 'penalty' THEN 'penalty'
        ELSE 'other'
      END,
      amount
    INTO derived_type, derived_amount
    FROM costs 
    WHERE id = p_cost_setting_id AND is_active = true;
  ELSE
    -- Use provided values
    derived_type := p_transaction_type;
    derived_amount := p_amount;
  END IF;
  
  -- Insert the transaction
  INSERT INTO team_transactions (
    team_id,
    transaction_type,
    amount,
    description,
    cost_setting_id,
    match_id,
    transaction_date
  ) VALUES (
    p_team_id,
    derived_type,
    derived_amount,
    p_description,
    p_cost_setting_id,
    p_match_id,
    CURRENT_DATE
  ) RETURNING id INTO new_transaction_id;
  
  RETURN new_transaction_id;
END;
$function$;

-- 3. Fix log_cost_setting_change (4-param version) - add search_path
CREATE OR REPLACE FUNCTION public.log_cost_setting_change(
  p_cost_setting_id integer, 
  p_old_amount numeric, 
  p_new_amount numeric, 
  p_user_id integer DEFAULT NULL::integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.cost_setting_audit_log (
    cost_setting_id,
    old_amount,
    new_amount,
    affected_transactions_count,
    changed_at,
    changed_by
  ) 
  SELECT 
    p_cost_setting_id,
    p_old_amount,
    p_new_amount,
    (SELECT COUNT(*) FROM public.team_transactions WHERE cost_setting_id = p_cost_setting_id),
    NOW(),
    p_user_id;
END;
$function$;

-- 4. Fix validate_player_data (5-param version) - add search_path
CREATE OR REPLACE FUNCTION public.validate_player_data(
  p_first_name character varying, 
  p_last_name character varying, 
  p_birth_date date, 
  p_team_id integer, 
  p_exclude_player_id integer DEFAULT NULL::integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_player_count INTEGER;
BEGIN
  -- Check if player already exists in the same team
  SELECT COUNT(*) INTO existing_player_count
  FROM public.players
  WHERE team_id = p_team_id
    AND first_name = p_first_name
    AND last_name = p_last_name
    AND birth_date = p_birth_date
    AND (p_exclude_player_id IS NULL OR player_id != p_exclude_player_id);
  
  RETURN existing_player_count = 0;
END;
$function$;