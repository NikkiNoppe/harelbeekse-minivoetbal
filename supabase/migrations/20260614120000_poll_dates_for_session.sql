CREATE OR REPLACE FUNCTION public.get_poll_dates_for_session(
  p_session_token uuid,
  p_poll_id integer
)
RETURNS TABLE(
  id integer,
  poll_id integer,
  match_date date,
  location text,
  time_slot character varying,
  match_count integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT s.role INTO v_role FROM private.resolve_app_session(p_session_token) s LIMIT 1;
  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT pmd.*
  FROM public.poll_match_dates pmd
  WHERE pmd.poll_id = p_poll_id
  ORDER BY pmd.match_date ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_poll_dates_for_session(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_poll_dates_for_session(uuid, integer) TO anon, authenticated;
