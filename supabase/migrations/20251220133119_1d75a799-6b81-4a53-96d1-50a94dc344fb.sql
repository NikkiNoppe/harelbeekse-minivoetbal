-- 1. Fix get_current_user_role() to fail-safe (return empty string instead of 'admin')
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
BEGIN
  -- Get role from session context
  SELECT current_setting('app.current_user_role', true) INTO user_role;
  
  IF user_role IS NOT NULL AND user_role != '' THEN
    RETURN user_role;
  END IF;
  
  -- SECURITY FIX: Fail-safe to no access when no context is set
  -- Previously returned 'admin' which was a privilege escalation risk
  RETURN '';
END;
$function$;

-- 2. Add policy for authenticated users to read their own row in users table
CREATE POLICY "Users can read their own data"
ON public.users
FOR SELECT
USING (
  user_id = (current_setting('app.current_user_id', true))::integer
);

-- 3. Secure matches_with_poll_info view by conditionally hiding referee availability
-- Drop and recreate the view with conditional visibility
DROP VIEW IF EXISTS public.matches_with_poll_info;

CREATE VIEW public.matches_with_poll_info AS
SELECT 
  m.match_id,
  m.home_team_id,
  m.away_team_id,
  m.match_date,
  m.is_cup_match,
  m.unique_number,
  m.location,
  m.speeldag,
  m.home_players,
  m.away_players,
  m.home_score,
  m.away_score,
  m.referee,
  m.referee_notes,
  m.is_submitted,
  m.is_locked,
  m.is_playoff_match,
  m.poll_group_id,
  m.assigned_referee_id,
  m.poll_month,
  CASE WHEN m.poll_group_id IS NOT NULL THEN true ELSE false END AS has_poll_data,
  -- Only expose referee availability to admins or the referee themselves
  CASE 
    WHEN get_current_user_role() = 'admin' THEN ra.is_available
    WHEN get_current_user_role() = 'referee' 
      AND ra.user_id = (current_setting('app.current_user_id', true))::integer THEN ra.is_available
    ELSE NULL
  END AS referee_available_for_poll
FROM public.matches m
LEFT JOIN public.referee_availability ra 
  ON m.poll_group_id = ra.poll_group_id 
  AND m.assigned_referee_id = ra.user_id;