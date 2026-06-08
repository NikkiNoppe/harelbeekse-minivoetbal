-- Shared session resolution for scheidsrechter session-RPCs.
-- Not exposed to anon/authenticated; called from public SECURITY DEFINER RPCs only.

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

CREATE OR REPLACE FUNCTION private.resolve_app_session(p_session_token uuid)
RETURNS TABLE(
  user_id integer,
  role text,
  username text,
  team_ids integer[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
BEGIN
  IF p_session_token IS NULL THEN
    RETURN;
  END IF;

  -- SuperAdmin session
  RETURN QUERY
  SELECT -1, 'admin'::text, 'SuperAdmin'::text, ARRAY[]::integer[]
  FROM public.user_sessions us
  WHERE us.session_id = p_session_token
    AND us.expires_at > now()
    AND us.user_id = -1
  LIMIT 1;

  IF FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    us.user_id,
    u.role::text,
    u.username::text,
    COALESCE(
      array_agg(tu.team_id ORDER BY tu.team_id) FILTER (WHERE tu.team_id IS NOT NULL),
      ARRAY[]::integer[]
    )
  FROM public.user_sessions us
  JOIN public.users u ON u.user_id = us.user_id
  LEFT JOIN public.team_users tu ON tu.user_id = us.user_id
  WHERE us.session_id = p_session_token
    AND us.expires_at > now()
  GROUP BY us.user_id, u.role::text, u.username::text;
END;
$$;

REVOKE ALL ON FUNCTION private.resolve_app_session(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.resolve_app_session(uuid) TO postgres, service_role;

COMMENT ON FUNCTION private.resolve_app_session(uuid) IS
  'Validates user_sessions token; returns role/username/teams. Internal helper for session-RPCs.';
