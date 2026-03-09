
-- 1. Update check_referee_conflict to exclude matches at the same location on the same day
-- (same date+location = same session, not a conflict)
CREATE OR REPLACE FUNCTION public.check_referee_conflict(p_referee_id integer, p_match_id integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_match_date DATE;
  v_match_location TEXT;
  v_has_conflict BOOLEAN;
BEGIN
  -- Get date AND location of the target match
  SELECT DATE(match_date), COALESCE(location, '') INTO v_match_date, v_match_location
  FROM public.matches
  WHERE match_id = p_match_id;
  
  -- Check if referee has a match on same day at a DIFFERENT location
  SELECT EXISTS (
    SELECT 1 
    FROM public.referee_assignments ra
    JOIN public.matches m ON ra.match_id = m.match_id
    WHERE ra.referee_id = p_referee_id
    AND DATE(m.match_date) = v_match_date
    AND COALESCE(m.location, '') != v_match_location
    AND ra.match_id != p_match_id
    AND ra.status NOT IN ('declined', 'cancelled')
  ) INTO v_has_conflict;
  
  RETURN v_has_conflict;
END;
$function$;

-- 2. Create assign_referee_to_session: assigns to ALL matches at same date+location
CREATE OR REPLACE FUNCTION public.assign_referee_to_session(
  p_user_id integer, 
  p_match_id integer, 
  p_referee_id integer, 
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT;
  v_match_date DATE;
  v_match_location TEXT;
  v_has_conflict BOOLEAN;
  v_referee_username TEXT;
  v_session_match RECORD;
  v_assignment_count INTEGER := 0;
BEGIN
  -- 1. Verify caller is admin
  SELECT role::text INTO v_role FROM users WHERE user_id = p_user_id;
  IF v_role IS NULL OR v_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen scheidsrechters toewijzen');
  END IF;

  -- 2. Get session info (date + location) from the clicked match
  SELECT DATE(match_date), COALESCE(location, '')
  INTO v_match_date, v_match_location
  FROM matches WHERE match_id = p_match_id;

  IF v_match_date IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wedstrijd niet gevonden');
  END IF;

  -- 3. Check for conflicts at a DIFFERENT location on the same day
  v_has_conflict := public.check_referee_conflict(p_referee_id, p_match_id);
  IF v_has_conflict THEN
    RETURN jsonb_build_object('success', false, 'error', 'Scheidsrechter is al toegewezen op een andere locatie op deze dag');
  END IF;

  -- 4. Get referee username
  SELECT username INTO v_referee_username FROM users WHERE user_id = p_referee_id;

  -- 5. Assign to ALL matches in this session (same date + same location)
  FOR v_session_match IN
    SELECT match_id FROM matches
    WHERE DATE(match_date) = v_match_date
    AND COALESCE(location, '') = v_match_location
  LOOP
    -- Skip if already assigned
    IF NOT EXISTS (SELECT 1 FROM referee_assignments WHERE match_id = v_session_match.match_id) THEN
      INSERT INTO referee_assignments (match_id, referee_id, assigned_by, status, notes)
      VALUES (v_session_match.match_id, p_referee_id, p_user_id, 'pending', p_notes);
      
      -- Update legacy fields
      UPDATE matches
      SET assigned_referee_id = p_referee_id,
          referee = v_referee_username
      WHERE match_id = v_session_match.match_id;
      
      v_assignment_count := v_assignment_count + 1;
    END IF;
  END LOOP;

  IF v_assignment_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alle wedstrijden in deze sessie zijn al toegewezen');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'assignments_created', v_assignment_count,
    'message', format('Scheidsrechter toegewezen aan %s wedstrijd(en)', v_assignment_count)
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wedstrijd heeft al een scheidsrechter toegewezen');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Onverwachte fout: ' || SQLERRM);
END;
$function$;

-- 3. Create remove_referee_from_session: removes from ALL matches at same date+location
CREATE OR REPLACE FUNCTION public.remove_referee_from_session(
  p_user_id integer,
  p_match_id integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT;
  v_match_date DATE;
  v_match_location TEXT;
  v_removed_count INTEGER := 0;
  v_session_match RECORD;
BEGIN
  -- 1. Verify caller is admin
  SELECT role::text INTO v_role FROM users WHERE user_id = p_user_id;
  IF v_role IS NULL OR v_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen toewijzingen verwijderen');
  END IF;

  -- 2. Get session info from the match
  SELECT DATE(match_date), COALESCE(location, '')
  INTO v_match_date, v_match_location
  FROM matches WHERE match_id = p_match_id;

  IF v_match_date IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wedstrijd niet gevonden');
  END IF;

  -- 3. Remove all assignments for matches in this session
  FOR v_session_match IN
    SELECT m.match_id FROM matches m
    WHERE DATE(m.match_date) = v_match_date
    AND COALESCE(m.location, '') = v_match_location
  LOOP
    DELETE FROM referee_assignments WHERE match_id = v_session_match.match_id;
    
    UPDATE matches
    SET assigned_referee_id = NULL, referee = NULL
    WHERE match_id = v_session_match.match_id;
    
    v_removed_count := v_removed_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'removed_count', v_removed_count, 'message', format('%s toewijzing(en) verwijderd', v_removed_count));
END;
$function$;
