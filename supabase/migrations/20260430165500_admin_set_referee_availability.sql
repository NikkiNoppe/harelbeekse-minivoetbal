-- Allow admins to mark referee availability through a single SECURITY DEFINER RPC.
-- Direct REST writes cannot rely on set_current_user_context because that context
-- is scoped to the request that sets it.

CREATE OR REPLACE FUNCTION public.admin_set_referee_availability(
  p_admin_user_id integer,
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
SET search_path = public
AS $$
DECLARE
  v_admin_role public.user_role;
BEGIN
  SELECT role
  INTO v_admin_role
  FROM public.users
  WHERE user_id = p_admin_user_id;

  IF v_admin_role IS DISTINCT FROM 'admin'::public.user_role THEN
    RAISE EXCEPTION 'Only admins can update referee availability';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.users
    WHERE user_id = p_referee_id
      AND role = 'referee'::public.user_role
  ) THEN
    RAISE EXCEPTION 'Referee not found';
  END IF;

  IF p_is_available IS NULL THEN
    DELETE FROM public.referee_availability
    WHERE user_id = p_referee_id
      AND poll_group_id = p_poll_group_id
      AND poll_month = p_poll_month;

    RETURN true;
  END IF;

  INSERT INTO public.referee_availability (
    user_id,
    match_id,
    poll_group_id,
    poll_month,
    is_available,
    notes,
    updated_at
  )
  VALUES (
    p_referee_id,
    p_match_id,
    p_poll_group_id,
    p_poll_month,
    p_is_available,
    p_notes,
    now()
  )
  ON CONFLICT (user_id, poll_group_id, poll_month)
  DO UPDATE SET
    match_id = EXCLUDED.match_id,
    is_available = EXCLUDED.is_available,
    notes = EXCLUDED.notes,
    updated_at = now();

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_referee_availability(integer, integer, integer, text, text, boolean, text)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_set_referee_availability(integer, integer, integer, text, text, boolean, text)
TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.admin_get_referee_availability(
  p_admin_user_id integer,
  p_poll_month text
)
RETURNS TABLE(
  user_id integer,
  match_id integer,
  poll_group_id text,
  is_available boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_role public.user_role;
BEGIN
  SELECT role
  INTO v_admin_role
  FROM public.users
  WHERE users.user_id = p_admin_user_id;

  IF v_admin_role IS DISTINCT FROM 'admin'::public.user_role THEN
    RAISE EXCEPTION 'Only admins can read referee availability';
  END IF;

  RETURN QUERY
  SELECT
    ra.user_id,
    ra.match_id,
    ra.poll_group_id::text,
    ra.is_available
  FROM public.referee_availability ra
  WHERE ra.poll_month = p_poll_month;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_referee_availability(integer, text)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_get_referee_availability(integer, text)
TO authenticated, anon;
