-- Gebruikersbeheer: tenant-isolatie op organization_id (SuperAdmin via acting_organization_id in sessie).

DROP FUNCTION IF EXISTS public.get_all_users_for_admin(uuid);

CREATE OR REPLACE FUNCTION public.get_all_users_for_admin(p_session_token uuid)
RETURNS TABLE(
  user_id integer,
  username character varying,
  email character varying,
  role text,
  organization_id integer,
  team_users jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_org_id integer;
BEGIN
  SELECT s.user_id, s.role, s.organization_id
  INTO v_user_id, v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    u.user_id,
    u.username,
    u.email,
    u.role::text,
    u.organization_id,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object('team_id', tu.team_id, 'team_name', t.team_name))
        FROM public.team_users tu
        JOIN public.teams t ON t.team_id = tu.team_id
        WHERE tu.user_id = u.user_id
          AND t.organization_id = v_org_id
      ),
      '[]'::jsonb
    ) AS team_users
  FROM public.users u
  WHERE u.organization_id = v_org_id
  ORDER BY u.username;
END;
$$;

REVOKE ALL ON FUNCTION public.get_all_users_for_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_user_for_session(
  p_session_token uuid,
  p_user_id integer,
  p_username text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_role public.user_role DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_org_id integer;
  v_rows integer;
BEGIN
  SELECT s.user_id, s.role, s.organization_id
  INTO v_user_id, v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role <> 'admin' OR v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins');
  END IF;

  UPDATE public.users
  SET
    username = COALESCE(p_username, username),
    email = COALESCE(p_email, email),
    role = COALESCE(p_role, role)
  WHERE user_id = p_user_id
    AND organization_id = v_org_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN jsonb_build_object('success', v_rows > 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user_for_session(
  p_session_token uuid,
  p_user_id integer
)
RETURNS jsonb
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

  IF v_role IS NULL OR v_role <> 'admin' OR v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins');
  END IF;
  IF p_user_id = -1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'SuperAdmin kan niet verwijderd worden');
  END IF;

  DELETE FROM public.team_users tu
  USING public.teams t
  WHERE tu.user_id = p_user_id
    AND t.team_id = tu.team_id
    AND t.organization_id = v_org_id;

  DELETE FROM public.users u
  WHERE u.user_id = p_user_id
    AND u.organization_id = v_org_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

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
  v_org_id integer;
BEGIN
  SELECT s.role, s.organization_id
  INTO v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role <> 'admin' OR v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins');
  END IF;

  IF p_operation = 'assign' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.users u WHERE u.user_id = p_user_id AND u.organization_id = v_org_id
    ) OR NOT EXISTS (
      SELECT 1 FROM public.teams t WHERE t.team_id = p_team_id AND t.organization_id = v_org_id
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Gebruiker of team hoort niet bij deze organisatie');
    END IF;
    DELETE FROM public.team_users WHERE user_id = p_user_id;
    INSERT INTO public.team_users (user_id, team_id) VALUES (p_user_id, p_team_id);
    RETURN jsonb_build_object('success', true);
  ELSIF p_operation = 'assign_many' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.users u WHERE u.user_id = p_user_id AND u.organization_id = v_org_id
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Gebruiker hoort niet bij deze organisatie');
    END IF;
    DELETE FROM public.team_users WHERE user_id = p_user_id;
    IF p_team_ids IS NOT NULL AND array_length(p_team_ids, 1) > 0 THEN
      INSERT INTO public.team_users (user_id, team_id)
      SELECT p_user_id, t.team_id
      FROM public.teams t
      WHERE t.team_id = ANY(p_team_ids)
        AND t.organization_id = v_org_id;
    END IF;
    RETURN jsonb_build_object('success', true);
  ELSIF p_operation = 'remove' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.users u WHERE u.user_id = p_user_id AND u.organization_id = v_org_id
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Gebruiker hoort niet bij deze organisatie');
    END IF;
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
      JOIN public.users u ON u.user_id = tu.user_id
      WHERE t.organization_id = v_org_id
        AND u.organization_id = v_org_id
    );
  END IF;
  RETURN jsonb_build_object('success', false, 'error', 'Onbekende operatie');
END;
$$;

REVOKE ALL ON FUNCTION public.update_user_for_session(uuid, integer, text, text, public.user_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_user_for_session(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.manage_team_user_for_session(uuid, text, integer, integer, integer[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_user_for_session(uuid, integer, text, text, public.user_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_for_session(uuid, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.manage_team_user_for_session(uuid, text, integer, integer, integer[]) TO anon, authenticated;
