-- Support multiple team assignments per player_manager user.

CREATE OR REPLACE FUNCTION public.manage_team_user_for_session(
  p_session_token uuid,
  p_operation text,
  p_user_id integer,
  p_team_id integer DEFAULT NULL,
  p_team_ids integer[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT s.role INTO v_role FROM private.resolve_app_session(p_session_token) s LIMIT 1;
  IF v_role IS NULL OR v_role <> 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins');
  END IF;

  IF p_operation = 'assign' THEN
    DELETE FROM public.team_users WHERE user_id = p_user_id;
    INSERT INTO public.team_users (user_id, team_id) VALUES (p_user_id, p_team_id);
    RETURN jsonb_build_object('success', true);
  ELSIF p_operation = 'assign_many' THEN
    DELETE FROM public.team_users WHERE user_id = p_user_id;
    IF p_team_ids IS NOT NULL AND array_length(p_team_ids, 1) > 0 THEN
      INSERT INTO public.team_users (user_id, team_id)
      SELECT p_user_id, unnest(p_team_ids);
    END IF;
    RETURN jsonb_build_object('success', true);
  ELSIF p_operation = 'remove' THEN
    DELETE FROM public.team_users WHERE user_id = p_user_id;
    RETURN jsonb_build_object('success', true);
  ELSIF p_operation = 'list' THEN
    RETURN (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'user_id', tu.user_id,
        'team_id', tu.team_id,
        'team_name', t.team_name
      ) ORDER BY t.team_name), '[]'::jsonb)
      FROM public.team_users tu
      JOIN public.teams t ON t.team_id = tu.team_id
    );
  END IF;
  RETURN jsonb_build_object('success', false, 'error', 'Onbekende operatie');
END;
$$;

REVOKE ALL ON FUNCTION public.manage_team_user_for_session(uuid, text, integer, integer, integer[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_team_user_for_session(uuid, text, integer, integer, integer[]) TO anon, authenticated;
