
-- SECURITY DEFINER function to assign a referee to a match
-- This bypasses RLS connection pooling issues by handling authorization atomically
CREATE OR REPLACE FUNCTION public.assign_referee_to_match(
  p_user_id integer,
  p_match_id integer,
  p_referee_id integer,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
  v_has_conflict BOOLEAN;
  v_assignment_id INTEGER;
  v_referee_username TEXT;
BEGIN
  -- 1. Verify caller is admin
  SELECT role::text INTO v_role FROM users WHERE user_id = p_user_id;
  
  IF v_role IS NULL OR v_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen scheidsrechters toewijzen');
  END IF;
  
  -- 2. Check for conflicts (referee already assigned on same day)
  v_has_conflict := public.check_referee_conflict(p_referee_id, p_match_id);
  
  IF v_has_conflict THEN
    RETURN jsonb_build_object('success', false, 'error', 'Scheidsrechter is al toegewezen aan een andere wedstrijd op deze dag');
  END IF;
  
  -- 3. Insert assignment
  INSERT INTO public.referee_assignments (match_id, referee_id, assigned_by, status, notes)
  VALUES (p_match_id, p_referee_id, p_user_id, 'pending', p_notes)
  RETURNING id INTO v_assignment_id;
  
  -- 4. Update legacy referee fields in matches table
  SELECT username INTO v_referee_username FROM public.users WHERE user_id = p_referee_id;
  
  IF v_referee_username IS NOT NULL THEN
    UPDATE public.matches
    SET assigned_referee_id = p_referee_id,
        referee = v_referee_username
    WHERE match_id = p_match_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'assignment_id', v_assignment_id,
    'message', 'Scheidsrechter succesvol toegewezen'
  );
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wedstrijd heeft al een scheidsrechter toegewezen');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Onverwachte fout: ' || SQLERRM);
END;
$$;

-- SECURITY DEFINER function to remove a referee assignment
CREATE OR REPLACE FUNCTION public.remove_referee_assignment(
  p_user_id integer,
  p_assignment_id integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
  v_match_id INTEGER;
BEGIN
  -- 1. Verify caller is admin
  SELECT role::text INTO v_role FROM users WHERE user_id = p_user_id;
  
  IF v_role IS NULL OR v_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen toewijzingen verwijderen');
  END IF;
  
  -- 2. Get match_id before deleting
  SELECT match_id INTO v_match_id FROM public.referee_assignments WHERE id = p_assignment_id;
  
  IF v_match_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Toewijzing niet gevonden');
  END IF;
  
  -- 3. Delete assignment
  DELETE FROM public.referee_assignments WHERE id = p_assignment_id;
  
  -- 4. Clear legacy referee fields
  UPDATE public.matches
  SET assigned_referee_id = NULL, referee = NULL
  WHERE match_id = v_match_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Toewijzing verwijderd');
END;
$$;
