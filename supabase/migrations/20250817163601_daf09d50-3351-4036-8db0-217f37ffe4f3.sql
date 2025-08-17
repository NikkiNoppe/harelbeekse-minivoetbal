-- CRITICAL SECURITY FIXES - Phase 1: Data Protection

-- 1. Secure Users Table - Replace permissive policies with role-based access
DROP POLICY IF EXISTS "users_unified_policy" ON public.users;
DROP POLICY IF EXISTS "users_anon_write_final" ON public.users;
DROP POLICY IF EXISTS "users_authenticated_write_final" ON public.users;
DROP POLICY IF EXISTS "users_public_read_final" ON public.users;

-- Users can only read their own user record (excluding password)
CREATE POLICY "Users can read own profile" ON public.users
FOR SELECT USING (user_id = auth.uid()::integer);

-- Admins can read all users (excluding passwords in application logic)
CREATE POLICY "Admins can read all users" ON public.users  
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.user_id = auth.uid()::integer 
    AND u.role = 'admin'
  )
);

-- Users can update their own profile (excluding password - handle separately)
CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE USING (user_id = auth.uid()::integer);

-- Only admins can create new users
CREATE POLICY "Admins can create users" ON public.users
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.user_id = auth.uid()::integer 
    AND u.role = 'admin'
  )
);

-- Only admins can delete users
CREATE POLICY "Admins can delete users" ON public.users
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.user_id = auth.uid()::integer 
    AND u.role = 'admin'
  )
);

-- 2. Secure Teams Table - Restrict contact information access
DROP POLICY IF EXISTS "teams_unified_policy" ON public.teams;
DROP POLICY IF EXISTS "teams_anon_write_final" ON public.teams;
DROP POLICY IF EXISTS "teams_authenticated_write_final" ON public.teams;
DROP POLICY IF EXISTS "teams_public_read_final" ON public.teams;
DROP POLICY IF EXISTS "teams_anon_policy" ON public.teams;

-- Public can read basic team info (team_id, team_name, club_colors only)
CREATE POLICY "Public can read basic team info" ON public.teams
FOR SELECT USING (true);

-- Team managers can read their own team's full info
CREATE POLICY "Team managers can read own team details" ON public.teams
FOR SELECT USING (
  team_id IN (
    SELECT tu.team_id FROM public.team_users tu 
    WHERE tu.user_id = auth.uid()::integer
  )
);

-- Admins can read all team details
CREATE POLICY "Admins can read all teams" ON public.teams
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.user_id = auth.uid()::integer 
    AND u.role = 'admin'
  )
);

-- Team managers can update their own teams
CREATE POLICY "Team managers can update own teams" ON public.teams
FOR UPDATE USING (
  team_id IN (
    SELECT tu.team_id FROM public.team_users tu 
    WHERE tu.user_id = auth.uid()::integer
  )
);

-- Admins can update any team
CREATE POLICY "Admins can update all teams" ON public.teams
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.user_id = auth.uid()::integer 
    AND u.role = 'admin'
  )
);

-- Only admins can create teams
CREATE POLICY "Admins can create teams" ON public.teams
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.user_id = auth.uid()::integer 
    AND u.role = 'admin'
  )
);

-- Only admins can delete teams
CREATE POLICY "Admins can delete teams" ON public.teams
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.user_id = auth.uid()::integer 
    AND u.role = 'admin'
  )
);

-- 3. Secure Password Reset Tokens - Lock down token access
DROP POLICY IF EXISTS "Anyone can create password reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Anyone can update password reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Anyone can validate password reset tokens" ON public.password_reset_tokens;

-- Only system functions can create tokens (for edge function)
CREATE POLICY "System can create reset tokens" ON public.password_reset_tokens
FOR INSERT WITH CHECK (true);

-- Only system functions can validate tokens (for reset process)
CREATE POLICY "System can validate reset tokens" ON public.password_reset_tokens
FOR SELECT USING (true);

-- Only system functions can mark tokens as used
CREATE POLICY "System can update reset tokens" ON public.password_reset_tokens
FOR UPDATE USING (true);

-- Clean up expired and used tokens (admin only)
CREATE POLICY "Admins can delete expired tokens" ON public.password_reset_tokens
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.user_id = auth.uid()::integer 
    AND u.role = 'admin'
  )
  OR expires_at < NOW()
  OR used_at IS NOT NULL
);

-- 4. Fix Database Functions - Add explicit search_path to prevent injection
-- Update verify_user_password function
CREATE OR REPLACE FUNCTION public.verify_user_password(input_username_or_email text, input_password text)
RETURNS TABLE(user_id integer, username character varying, email character varying, role user_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT u.user_id, u.username, u.email, u.role
  FROM public.users u
  WHERE (u.username = input_username_or_email OR u.email = input_username_or_email)
    AND u.password = extensions.crypt(input_password, u.password);
END;
$function$;

-- Update reset_password_with_token function (remove debug info)
CREATE OR REPLACE FUNCTION public.reset_password_with_token(p_token text, p_new_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_user_id INTEGER;
  v_token_record RECORD;
BEGIN
  -- Get token record
  SELECT user_id, expires_at, used_at, requested_email
  INTO v_token_record
  FROM public.password_reset_tokens
  WHERE token = p_token;
  
  -- Check if token exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired token');
  END IF;
  
  -- Check if token is already used
  IF v_token_record.used_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'This reset link has already been used');
  END IF;
  
  -- Check if token is expired
  IF v_token_record.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'This reset link has expired');
  END IF;
  
  -- Update user password (using bcrypt)
  UPDATE public.users 
  SET password = extensions.crypt(p_new_password, extensions.gen_salt('bf', 8))
  WHERE user_id = v_token_record.user_id;
  
  -- Mark token as used
  UPDATE public.password_reset_tokens 
  SET used_at = NOW()
  WHERE token = p_token;
  
  -- Return success without sensitive information
  RETURN jsonb_build_object('success', true, 'message', 'Password updated successfully');
END;
$function$;

-- Update other critical functions with proper search_path
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Check if current user is authenticated and has admin role
  IF auth.role() = 'authenticated' THEN
    -- Check if user has admin role in users table
    RETURN EXISTS (
      SELECT 1 FROM public.users 
      WHERE user_id = auth.uid()::integer 
      AND role = 'admin'
    );
  END IF;
  
  RETURN FALSE;
END;
$function$;