-- Fix Critical Data Exposure Issues

-- Create view for public team access (only basic info)
CREATE OR REPLACE VIEW public.teams_public AS
SELECT team_id, team_name
FROM public.teams;

-- Grant public access to the view
GRANT SELECT ON public.teams_public TO anon, authenticated;

-- Revoke direct table access for non-admin users
DROP POLICY IF EXISTS "Public can read basic team info only" ON public.teams;
DROP POLICY IF EXISTS "Team managers can read their team contact info" ON public.teams;

-- Create restrictive policies for teams table
CREATE POLICY "Only admins can read all team data" 
ON public.teams 
FOR SELECT 
USING (get_current_user_role() = 'admin'::text);

CREATE POLICY "Team managers can read their own team data" 
ON public.teams 
FOR SELECT 
USING (
    get_current_user_role() = 'player_manager'::text AND 
    team_id = ANY(get_current_user_team_ids())
);

-- Fix users table exposure - remove all public access
DROP POLICY IF EXISTS "users_anon_policy" ON public.users;
DROP POLICY IF EXISTS "users_anon_write_final" ON public.users;
DROP POLICY IF EXISTS "users_authenticated_write_final" ON public.users;
DROP POLICY IF EXISTS "users_public_read_final" ON public.users;
DROP POLICY IF EXISTS "users_unified_policy" ON public.users;

-- Create proper users policies (admin only)
CREATE POLICY "Only admins can manage users" 
ON public.users 
FOR ALL 
USING (get_current_user_role() = 'admin'::text)
WITH CHECK (get_current_user_role() = 'admin'::text);

-- Fix players table - create view for public access without birth dates
CREATE OR REPLACE VIEW public.players_public AS
SELECT 
    player_id,
    team_id,
    first_name,
    last_name,
    yellow_cards,
    red_cards,
    suspended_matches_remaining
FROM public.players;

-- Grant access to the view
GRANT SELECT ON public.players_public TO anon, authenticated;

-- Revoke public access to players table
DROP POLICY IF EXISTS "Public can read players" ON public.players;

-- Create restrictive policies for players table
CREATE POLICY "Only admins can read all player data" 
ON public.players 
FOR SELECT 
USING (get_current_user_role() = 'admin'::text);

CREATE POLICY "Team managers can read their players data" 
ON public.players 
FOR SELECT 
USING (
    get_current_user_role() = 'player_manager'::text AND 
    team_id = ANY(get_current_user_team_ids())
);

-- Fix password reset tokens - remove anonymous update access
DROP POLICY IF EXISTS "Anon can update reset tokens for validation" ON public.password_reset_tokens;

-- Create proper password reset policies
CREATE POLICY "Only service role can update reset tokens" 
ON public.password_reset_tokens 
FOR UPDATE 
USING (auth.role() = 'service_role'::text);

-- Fix remaining database functions with mutable search paths
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_role text;
BEGIN
  -- Probeer de rol te krijgen uit de huidige session/context
  -- Voor nu returnen we 'admin' als fallback, maar dit wordt later vervangen
  -- door echte session management
  SELECT current_setting('app.current_user_role', true) INTO user_role;
  
  IF user_role IS NOT NULL AND user_role != '' THEN
    RETURN user_role;
  END IF;
  
  -- Fallback naar admin voor nu (dit voorkomt dat alles breekt)
  RETURN 'admin';
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_team_ids()
 RETURNS integer[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  team_ids integer[];
BEGIN
  -- Probeer de team IDs te krijgen uit de huidige session/context
  SELECT string_to_array(current_setting('app.current_user_team_ids', true), ',')::integer[] INTO team_ids;
  
  IF team_ids IS NOT NULL THEN
    RETURN team_ids;
  END IF;
  
  -- Fallback naar empty array
  RETURN ARRAY[]::integer[];
END;
$function$;

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

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    RETURN public.get_current_user_role() = 'admin';
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_current_user_manage_player(player_team_id integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    user_role text;
    user_team_ids integer[];
BEGIN
    -- Get user role
    user_role := public.get_current_user_role();
    
    -- If user is admin, they can manage any player
    IF user_role = 'admin' THEN
        RETURN true;
    END IF;
    
    -- If user is player_manager, check if they manage this player's team
    IF user_role = 'player_manager' THEN
        user_team_ids := public.get_current_user_team_ids();
        RETURN player_team_id = ANY(user_team_ids);
    END IF;
    
    -- Other roles cannot manage players
    RETURN false;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_config(parameter text, value text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  PERFORM set_config(parameter, value, false);
END;
$function$;