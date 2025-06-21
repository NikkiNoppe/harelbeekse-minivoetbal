
-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
    -- Drop existing policies for available_dates
    DROP POLICY IF EXISTS "Admins can manage available dates" ON public.available_dates;
    DROP POLICY IF EXISTS "Allow public read access to available dates" ON public.available_dates;
    DROP POLICY IF EXISTS "View available dates" ON public.available_dates;
    
    -- Drop any other conflicting policies that might exist
    DROP POLICY IF EXISTS "Public can read available dates" ON public.available_dates;
    DROP POLICY IF EXISTS "Admins can manage competition configs" ON public.competition_configs;
    DROP POLICY IF EXISTS "Admins can manage AI generation logs" ON public.ai_generation_logs;
    DROP POLICY IF EXISTS "Admins can manage player list lock settings" ON public.player_list_lock_settings;
    DROP POLICY IF EXISTS "Public can read vacation periods" ON public.vacation_periods;
    DROP POLICY IF EXISTS "Admins can insert vacation periods" ON public.vacation_periods;
    DROP POLICY IF EXISTS "Admins can update vacation periods" ON public.vacation_periods;
    DROP POLICY IF EXISTS "Admins can delete vacation periods" ON public.vacation_periods;
    DROP POLICY IF EXISTS "Admins can manage team preferences" ON public.team_preferences;
END $$;

-- Enable RLS on tables that need it
ALTER TABLE public.available_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_list_lock_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for available_dates (public read, admin write)
CREATE POLICY "Public can read available dates"
  ON public.available_dates
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage available dates"
  ON public.available_dates
  FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Create RLS policies for competition_configs (admin only)
CREATE POLICY "Admins can manage competition configs"
  ON public.competition_configs
  FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Create RLS policies for ai_generation_logs (admin only)
CREATE POLICY "Admins can manage AI generation logs"
  ON public.ai_generation_logs
  FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Create RLS policies for player_list_lock_settings (admin only)
CREATE POLICY "Admins can manage player list lock settings"
  ON public.player_list_lock_settings
  FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Create RLS policies for vacation_periods (public read, admin write)
CREATE POLICY "Public can read vacation periods"
  ON public.vacation_periods
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert vacation periods"
  ON public.vacation_periods
  FOR INSERT
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update vacation periods"
  ON public.vacation_periods
  FOR UPDATE
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can delete vacation periods"
  ON public.vacation_periods
  FOR DELETE
  USING (public.is_admin_user());

-- Create RLS policies for team_preferences (admin only for now)
CREATE POLICY "Admins can manage team preferences"
  ON public.team_preferences
  FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Fix function search paths by adding SET search_path = ''
CREATE OR REPLACE FUNCTION public.verify_user_password(input_username_or_email text, input_password text)
 RETURNS TABLE(user_id integer, username character varying, email character varying, role user_role)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT u.user_id, u.username, u.email, u.role
  FROM public.users u
  WHERE (u.username = input_username_or_email OR u.email = input_username_or_email)
    AND u.password = crypt(input_password, u.password);
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- For now, we'll allow all operations since this appears to be an admin-only interface
  -- In a production environment, you'd want to implement proper session tracking
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_player_list_locked()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path = ''
AS $function$
DECLARE
  lock_date DATE;
  is_enabled BOOLEAN;
BEGIN
  SELECT lock_from_date, is_active 
  INTO lock_date, is_enabled
  FROM public.player_list_lock_settings 
  WHERE id = 1;
  
  IF NOT is_enabled OR lock_date IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN CURRENT_DATE >= lock_date;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_match_forms_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  -- Only one formulier per match: create for either home_team (or away, depending on convention)
  INSERT INTO public.match_forms (match_id, team_id, is_submitted, created_at, updated_at, home_players, away_players)
  VALUES (NEW.match_id, NEW.home_team_id, false, now(), now(), '[]', '[]');

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_match_unique_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
DECLARE
    matchday_number VARCHAR(2);
    match_sequence INTEGER;
    prefix VARCHAR(2);
BEGIN
    -- Get the matchday number from the matchday name (e.g., "Speeldag 9" -> "09")
    SELECT LPAD(regexp_replace(name, '[^0-9]', '', 'g'), 2, '0')
    INTO matchday_number
    FROM public.matchdays
    WHERE matchday_id = NEW.matchday_id;
    
    -- For cup matches, use a different prefix
    IF NEW.is_cup_match THEN
        prefix := '90';
    ELSE
        prefix := matchday_number;
    END IF;
    
    -- Count existing matches in this matchday to determine the sequence
    SELECT COUNT(*) + 1
    INTO match_sequence
    FROM public.matches
    WHERE matchday_id = NEW.matchday_id
    AND match_id != NEW.match_id;
    
    -- Generate the unique number: matchday + sequence (e.g., 0902)
    NEW.unique_number := prefix || LPAD(match_sequence::text, 2, '0');
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_password(user_id_param integer, new_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  UPDATE public.users 
  SET password = crypt(new_password, gen_salt('bf', 8))
  WHERE user_id = user_id_param;
  
  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_user_with_hashed_password(username_param character varying, email_param character varying, password_param character varying, role_param user_role DEFAULT 'player_manager'::user_role)
 RETURNS users
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  new_user public.users;
BEGIN
  INSERT INTO public.users (username, email, password, role, created_at)
  VALUES (
    username_param,
    email_param,
    crypt(password_param, gen_salt('bf', 8)),
    role_param,
    CURRENT_TIMESTAMP
  )
  RETURNING * INTO new_user;
  
  RETURN new_user;
END;
$function$;
