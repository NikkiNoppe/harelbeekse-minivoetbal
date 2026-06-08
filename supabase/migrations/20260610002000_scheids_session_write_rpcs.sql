-- Scheidsrechter write RPCs: p_session_token instead of spoofable p_user_id.

-- ---------------------------------------------------------------------------
-- admin_get_referee_availability
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.admin_get_referee_availability(integer, text);

CREATE OR REPLACE FUNCTION public.admin_get_referee_availability(
  p_session_token uuid,
  p_poll_month text
)
RETURNS TABLE(user_id integer, match_id integer, poll_group_id text, is_available boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR p_poll_month IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT rm.referee_id, rm.match_id, rm.poll_group_id::text, rm.is_available
  FROM public.referee_matches rm
  WHERE rm.poll_month = p_poll_month
    AND rm.is_available IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_referee_availability(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_referee_availability(uuid, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- admin_set_referee_availability
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.admin_set_referee_availability(integer, integer, integer, text, text, boolean, text);

CREATE OR REPLACE FUNCTION public.admin_set_referee_availability(
  p_session_token uuid,
  p_referee_id integer,
  p_match_id integer,
  p_poll_group_id text,
  p_poll_month text,
  p_is_available boolean,
  p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only admins can update referee availability';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.user_id = p_referee_id AND u.role::text = 'referee'
  ) THEN
    RAISE EXCEPTION 'Referee not found';
  END IF;

  IF p_is_available IS NULL THEN
    UPDATE public.referee_matches
    SET is_available = NULL
    WHERE referee_id = p_referee_id
      AND (
        (p_match_id IS NOT NULL AND match_id = p_match_id)
        OR (p_match_id IS NULL AND poll_group_id = p_poll_group_id AND poll_month = p_poll_month)
      );

    DELETE FROM public.referee_matches
    WHERE referee_id = p_referee_id
      AND is_available IS NULL
      AND assigned_at IS NULL
      AND (
        (p_match_id IS NOT NULL AND match_id = p_match_id)
        OR (p_match_id IS NULL AND poll_group_id = p_poll_group_id AND poll_month = p_poll_month)
      );

    RETURN true;
  END IF;

  IF p_match_id IS NOT NULL THEN
    INSERT INTO public.referee_matches (
      referee_id, match_id, poll_group_id, poll_month, is_available
    ) VALUES (
      p_referee_id, p_match_id, p_poll_group_id, p_poll_month, p_is_available
    )
    ON CONFLICT (referee_id, match_id) WHERE match_id IS NOT NULL
    DO UPDATE SET
      poll_group_id = EXCLUDED.poll_group_id,
      poll_month = EXCLUDED.poll_month,
      is_available = EXCLUDED.is_available;
  ELSE
    INSERT INTO public.referee_matches (
      referee_id, match_id, poll_group_id, poll_month, is_available
    ) VALUES (
      p_referee_id, NULL, p_poll_group_id, p_poll_month, p_is_available
    )
    ON CONFLICT (referee_id, poll_group_id, poll_month) WHERE match_id IS NULL AND poll_group_id IS NOT NULL
    DO UPDATE SET is_available = EXCLUDED.is_available;
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_referee_availability(uuid, integer, integer, text, text, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_referee_availability(uuid, integer, integer, text, text, boolean, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- upsert_referee_availability_for_session (referee self-service)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_referee_availability_for_session(
  p_session_token uuid,
  p_match_id integer,
  p_poll_group_id text,
  p_poll_month text,
  p_is_available boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_user_id integer;
BEGIN
  SELECT s.user_id, s.role INTO v_user_id, v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'referee' OR v_user_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_is_available IS NULL THEN
    UPDATE public.referee_matches
    SET is_available = NULL
    WHERE referee_id = v_user_id
      AND (
        (p_match_id IS NOT NULL AND match_id = p_match_id)
        OR (p_match_id IS NULL AND poll_group_id = p_poll_group_id AND poll_month = p_poll_month)
      );

    DELETE FROM public.referee_matches
    WHERE referee_id = v_user_id
      AND is_available IS NULL
      AND assigned_at IS NULL
      AND (
        (p_match_id IS NOT NULL AND match_id = p_match_id)
        OR (p_match_id IS NULL AND poll_group_id = p_poll_group_id AND poll_month = p_poll_month)
      );

    RETURN true;
  END IF;

  IF p_match_id IS NOT NULL THEN
    INSERT INTO public.referee_matches (
      referee_id, match_id, poll_group_id, poll_month, is_available
    ) VALUES (
      v_user_id, p_match_id, p_poll_group_id, p_poll_month, p_is_available
    )
    ON CONFLICT (referee_id, match_id) WHERE match_id IS NOT NULL
    DO UPDATE SET
      poll_group_id = EXCLUDED.poll_group_id,
      poll_month = EXCLUDED.poll_month,
      is_available = EXCLUDED.is_available;
  ELSE
    INSERT INTO public.referee_matches (
      referee_id, match_id, poll_group_id, poll_month, is_available
    ) VALUES (
      v_user_id, NULL, p_poll_group_id, p_poll_month, p_is_available
    )
    ON CONFLICT (referee_id, poll_group_id, poll_month) WHERE match_id IS NULL AND poll_group_id IS NOT NULL
    DO UPDATE SET is_available = EXCLUDED.is_available;
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_referee_availability_for_session(uuid, integer, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_referee_availability_for_session(uuid, integer, text, text, boolean) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- assign_referee_to_match
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.assign_referee_to_match(integer, integer, integer, text);

CREATE OR REPLACE FUNCTION public.assign_referee_to_match(
  p_session_token uuid,
  p_match_id integer,
  p_referee_id integer,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_user_id integer;
  v_has_conflict boolean;
  v_assignment_id bigint;
  v_referee_username text;
  v_poll_month text;
BEGIN
  SELECT s.user_id, s.role INTO v_user_id, v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen scheidsrechters toewijzen');
  END IF;

  v_has_conflict := public.check_referee_conflict(p_referee_id, p_match_id);
  IF v_has_conflict THEN
    RETURN jsonb_build_object('success', false, 'error', 'Scheidsrechter is al toegewezen aan een andere wedstrijd op deze dag');
  END IF;

  SELECT to_char(match_date, 'YYYY-MM') INTO v_poll_month
  FROM public.matches WHERE match_id = p_match_id;

  INSERT INTO public.referee_matches (referee_id, match_id, assigned_by, assigned_at, poll_month)
  VALUES (p_referee_id, p_match_id, v_user_id, now(), v_poll_month)
  ON CONFLICT (referee_id, match_id) WHERE match_id IS NOT NULL
  DO UPDATE SET
    assigned_by = EXCLUDED.assigned_by,
    assigned_at = EXCLUDED.assigned_at
  RETURNING id INTO v_assignment_id;

  SELECT u.username::text INTO v_referee_username
  FROM public.users u WHERE u.user_id = p_referee_id;

  IF v_referee_username IS NOT NULL THEN
    UPDATE public.matches
    SET assigned_referee_id = p_referee_id, referee = v_referee_username
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

REVOKE ALL ON FUNCTION public.assign_referee_to_match(uuid, integer, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_referee_to_match(uuid, integer, integer, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- assign_referee_to_session
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.assign_referee_to_session(integer, integer, integer, text);

CREATE OR REPLACE FUNCTION public.assign_referee_to_session(
  p_session_token uuid,
  p_match_id integer,
  p_referee_id integer,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_user_id integer;
  v_match_date date;
  v_match_location text;
  v_has_conflict boolean;
  v_referee_username text;
  v_session_match record;
  v_assignment_count integer := 0;
  v_poll_month text;
BEGIN
  SELECT s.user_id, s.role INTO v_user_id, v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen scheidsrechters toewijzen');
  END IF;

  SELECT DATE(match_date), COALESCE(location, ''), to_char(match_date, 'YYYY-MM')
  INTO v_match_date, v_match_location, v_poll_month
  FROM public.matches WHERE match_id = p_match_id;

  IF v_match_date IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wedstrijd niet gevonden');
  END IF;

  v_has_conflict := public.check_referee_conflict(p_referee_id, p_match_id);
  IF v_has_conflict THEN
    RETURN jsonb_build_object('success', false, 'error', 'Scheidsrechter is al toegewezen op een andere locatie op deze dag');
  END IF;

  SELECT u.username::text INTO v_referee_username
  FROM public.users u WHERE u.user_id = p_referee_id;

  FOR v_session_match IN
    SELECT m.match_id FROM public.matches m
    WHERE DATE(m.match_date) = v_match_date
      AND COALESCE(m.location, '') = v_match_location
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.referee_matches rm
      WHERE rm.match_id = v_session_match.match_id
        AND rm.assigned_at IS NOT NULL
    ) THEN
      INSERT INTO public.referee_matches (referee_id, match_id, assigned_by, assigned_at, poll_month)
      VALUES (p_referee_id, v_session_match.match_id, v_user_id, now(), v_poll_month)
      ON CONFLICT (referee_id, match_id) WHERE match_id IS NOT NULL
      DO UPDATE SET
        assigned_by = EXCLUDED.assigned_by,
        assigned_at = EXCLUDED.assigned_at;

      UPDATE public.matches
      SET assigned_referee_id = p_referee_id, referee = v_referee_username
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
$$;

REVOKE ALL ON FUNCTION public.assign_referee_to_session(uuid, integer, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_referee_to_session(uuid, integer, integer, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- remove_referee_assignment
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.remove_referee_assignment(integer, integer);

CREATE OR REPLACE FUNCTION public.remove_referee_assignment(
  p_session_token uuid,
  p_assignment_id integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_match_id integer;
  v_has_availability boolean;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen toewijzingen verwijderen');
  END IF;

  SELECT rm.match_id, (rm.is_available IS NOT NULL)
  INTO v_match_id, v_has_availability
  FROM public.referee_matches rm
  WHERE rm.id = p_assignment_id;

  IF v_match_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Toewijzing niet gevonden');
  END IF;

  IF v_has_availability THEN
    UPDATE public.referee_matches
    SET assigned_by = NULL, assigned_at = NULL
    WHERE id = p_assignment_id;
  ELSE
    DELETE FROM public.referee_matches WHERE id = p_assignment_id;
  END IF;

  UPDATE public.matches
  SET assigned_referee_id = NULL, referee = NULL
  WHERE match_id = v_match_id;

  RETURN jsonb_build_object('success', true, 'message', 'Toewijzing verwijderd');
END;
$$;

REVOKE ALL ON FUNCTION public.remove_referee_assignment(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_referee_assignment(uuid, integer) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- remove_referee_from_session
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.remove_referee_from_session(integer, integer);

CREATE OR REPLACE FUNCTION public.remove_referee_from_session(
  p_session_token uuid,
  p_match_id integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_match_date date;
  v_match_location text;
  v_removed_count integer := 0;
  v_session_match record;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen toewijzingen verwijderen');
  END IF;

  SELECT DATE(match_date), COALESCE(location, '')
  INTO v_match_date, v_match_location
  FROM public.matches WHERE match_id = p_match_id;

  IF v_match_date IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wedstrijd niet gevonden');
  END IF;

  FOR v_session_match IN
    SELECT m.match_id FROM public.matches m
    WHERE DATE(m.match_date) = v_match_date
      AND COALESCE(m.location, '') = v_match_location
  LOOP
    UPDATE public.referee_matches
    SET assigned_by = NULL, assigned_at = NULL
    WHERE match_id = v_session_match.match_id
      AND assigned_at IS NOT NULL;

    DELETE FROM public.referee_matches
    WHERE match_id = v_session_match.match_id
      AND is_available IS NULL
      AND assigned_at IS NULL;

    UPDATE public.matches
    SET assigned_referee_id = NULL, referee = NULL
    WHERE match_id = v_session_match.match_id;

    v_removed_count := v_removed_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'removed_count', v_removed_count,
    'message', format('%s toewijzing(en) verwijderd', v_removed_count)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.remove_referee_from_session(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_referee_from_session(uuid, integer) TO anon, authenticated;
