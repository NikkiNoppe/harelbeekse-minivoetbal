-- team_users.organization_id is NOT NULL; inserts zonder org faalden na multi-tenant migratie.

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
    DELETE FROM public.team_users tu
    USING public.teams t
    WHERE tu.user_id = p_user_id
      AND t.team_id = tu.team_id
      AND t.organization_id = v_org_id;
    INSERT INTO public.team_users (organization_id, user_id, team_id)
    VALUES (v_org_id, p_user_id, p_team_id);
    RETURN jsonb_build_object('success', true);
  ELSIF p_operation = 'assign_many' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.users u WHERE u.user_id = p_user_id AND u.organization_id = v_org_id
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Gebruiker hoort niet bij deze organisatie');
    END IF;
    DELETE FROM public.team_users tu
    USING public.teams t
    WHERE tu.user_id = p_user_id
      AND t.team_id = tu.team_id
      AND t.organization_id = v_org_id;
    IF p_team_ids IS NOT NULL AND array_length(p_team_ids, 1) > 0 THEN
      INSERT INTO public.team_users (organization_id, user_id, team_id)
      SELECT v_org_id, p_user_id, t.team_id
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
    DELETE FROM public.team_users tu
    USING public.teams t
    WHERE tu.user_id = p_user_id
      AND t.team_id = tu.team_id
      AND t.organization_id = v_org_id;
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

REVOKE ALL ON FUNCTION public.manage_team_user_for_session(uuid, text, integer, integer, integer[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_team_user_for_session(uuid, text, integer, integer, integer[]) TO anon, authenticated;
