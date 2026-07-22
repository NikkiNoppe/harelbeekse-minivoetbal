-- Fix: referee_matches.organization_id is NOT NULL; admin availability upserts
-- must set organization_id from the session (incl. SuperAdmin acting org).

CREATE OR REPLACE FUNCTION private.admin_set_referee_availability(
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
  v_org_id integer;
BEGIN
  SELECT s.role, s.organization_id
  INTO v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL THEN
    RAISE EXCEPTION 'Only admins can update referee availability';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.user_id = p_referee_id
      AND u.role::text = 'referee'
      AND u.organization_id = v_org_id
  ) THEN
    RAISE EXCEPTION 'Referee not found';
  END IF;

  IF p_match_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.matches m
    WHERE m.match_id = p_match_id
      AND m.organization_id = v_org_id
  ) THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF p_is_available IS NULL THEN
    UPDATE public.referee_matches
    SET is_available = NULL
    WHERE referee_id = p_referee_id
      AND organization_id = v_org_id
      AND (
        (p_match_id IS NOT NULL AND match_id = p_match_id)
        OR (
          p_match_id IS NULL
          AND poll_group_id = p_poll_group_id
          AND poll_month = p_poll_month
        )
      );

    DELETE FROM public.referee_matches
    WHERE referee_id = p_referee_id
      AND organization_id = v_org_id
      AND is_available IS NULL
      AND assigned_at IS NULL
      AND (
        (p_match_id IS NOT NULL AND match_id = p_match_id)
        OR (
          p_match_id IS NULL
          AND poll_group_id = p_poll_group_id
          AND poll_month = p_poll_month
        )
      );

    RETURN true;
  END IF;

  IF p_match_id IS NOT NULL THEN
    INSERT INTO public.referee_matches (
      organization_id,
      referee_id,
      match_id,
      poll_group_id,
      poll_month,
      is_available
    ) VALUES (
      v_org_id,
      p_referee_id,
      p_match_id,
      p_poll_group_id,
      p_poll_month,
      p_is_available
    )
    ON CONFLICT (referee_id, match_id) WHERE match_id IS NOT NULL
    DO UPDATE SET
      poll_group_id = EXCLUDED.poll_group_id,
      poll_month = EXCLUDED.poll_month,
      is_available = EXCLUDED.is_available,
      organization_id = EXCLUDED.organization_id;
  ELSE
    INSERT INTO public.referee_matches (
      organization_id,
      referee_id,
      match_id,
      poll_group_id,
      poll_month,
      is_available
    ) VALUES (
      v_org_id,
      p_referee_id,
      NULL,
      p_poll_group_id,
      p_poll_month,
      p_is_available
    )
    ON CONFLICT (referee_id, poll_group_id, poll_month)
      WHERE match_id IS NULL AND poll_group_id IS NOT NULL
    DO UPDATE SET
      is_available = EXCLUDED.is_available,
      organization_id = EXCLUDED.organization_id;
  END IF;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION private.admin_set_referee_availability(
  uuid, integer, integer, text, text, boolean, text
) IS
  'Admin zet scheids-beschikbaarheid; organization_id uit sessie (SuperAdmin acting org).';

-- Self-service pad: zelfde NOT NULL organization_id-fix
CREATE OR REPLACE FUNCTION private.upsert_referee_availability_for_session(
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
  v_org_id integer;
BEGIN
  SELECT s.user_id, s.role, s.organization_id
  INTO v_user_id, v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'referee' OR v_user_id IS NULL OR v_org_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_match_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.matches m
    WHERE m.match_id = p_match_id
      AND m.organization_id = v_org_id
  ) THEN
    RETURN false;
  END IF;

  IF p_is_available IS NULL THEN
    UPDATE public.referee_matches
    SET is_available = NULL
    WHERE referee_id = v_user_id
      AND organization_id = v_org_id
      AND (
        (p_match_id IS NOT NULL AND match_id = p_match_id)
        OR (
          p_match_id IS NULL
          AND poll_group_id = p_poll_group_id
          AND poll_month = p_poll_month
        )
      );

    DELETE FROM public.referee_matches
    WHERE referee_id = v_user_id
      AND organization_id = v_org_id
      AND is_available IS NULL
      AND assigned_at IS NULL
      AND (
        (p_match_id IS NOT NULL AND match_id = p_match_id)
        OR (
          p_match_id IS NULL
          AND poll_group_id = p_poll_group_id
          AND poll_month = p_poll_month
        )
      );

    RETURN true;
  END IF;

  IF p_match_id IS NOT NULL THEN
    INSERT INTO public.referee_matches (
      organization_id,
      referee_id,
      match_id,
      poll_group_id,
      poll_month,
      is_available
    ) VALUES (
      v_org_id,
      v_user_id,
      p_match_id,
      p_poll_group_id,
      p_poll_month,
      p_is_available
    )
    ON CONFLICT (referee_id, match_id) WHERE match_id IS NOT NULL
    DO UPDATE SET
      poll_group_id = EXCLUDED.poll_group_id,
      poll_month = EXCLUDED.poll_month,
      is_available = EXCLUDED.is_available,
      organization_id = EXCLUDED.organization_id;
  ELSE
    INSERT INTO public.referee_matches (
      organization_id,
      referee_id,
      match_id,
      poll_group_id,
      poll_month,
      is_available
    ) VALUES (
      v_org_id,
      v_user_id,
      NULL,
      p_poll_group_id,
      p_poll_month,
      p_is_available
    )
    ON CONFLICT (referee_id, poll_group_id, poll_month)
      WHERE match_id IS NULL AND poll_group_id IS NOT NULL
    DO UPDATE SET
      is_available = EXCLUDED.is_available,
      organization_id = EXCLUDED.organization_id;
  END IF;

  RETURN true;
END;
$$;
