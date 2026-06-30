-- SuperAdmin: kies actieve tenant (organization_id) per sessie.

ALTER TABLE public.user_sessions
  ADD COLUMN IF NOT EXISTS acting_organization_id integer
  REFERENCES public.organizations(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.user_sessions.acting_organization_id IS
  'SuperAdmin (user_id=-1): actieve tenant voor admin-RPC''s en RLS-context.';

CREATE OR REPLACE FUNCTION public.set_super_admin_acting_organization(
  p_session_token uuid,
  p_organization_id integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_org_exists boolean;
BEGIN
  IF p_session_token IS NULL OR p_organization_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT us.user_id INTO v_user_id
  FROM public.user_sessions us
  WHERE us.session_id = p_session_token
    AND us.expires_at > now();

  IF NOT FOUND OR v_user_id <> -1 THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.organizations o WHERE o.id = p_organization_id
  ) INTO v_org_exists;

  IF NOT v_org_exists THEN
    RETURN false;
  END IF;

  UPDATE public.user_sessions
  SET acting_organization_id = p_organization_id
  WHERE session_id = p_session_token;

  PERFORM public.apply_app_user_context(
    'admin',
    -1,
    '',
    'SuperAdmin',
    p_organization_id
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.set_super_admin_acting_organization(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_super_admin_acting_organization(uuid, integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.restore_user_session(p_session_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_username text;
  v_team_ids text;
  v_organization_id integer;
BEGIN
  IF p_session_token IS NULL THEN
    PERFORM public.clear_app_user_context();
    RETURN false;
  END IF;

  SELECT us.user_id, us.acting_organization_id
  INTO v_user_id, v_organization_id
  FROM public.user_sessions us
  WHERE us.session_id = p_session_token
    AND us.expires_at > now();

  IF NOT FOUND THEN
    PERFORM public.clear_app_user_context();
    RETURN false;
  END IF;

  IF v_user_id = -1 THEN
    PERFORM public.apply_app_user_context(
      'admin',
      -1,
      '',
      'SuperAdmin',
      v_organization_id
    );
    RETURN true;
  END IF;

  SELECT u.role::text, u.username::text, u.organization_id
  INTO v_role, v_username, v_organization_id
  FROM public.users u
  WHERE u.user_id = v_user_id;

  IF v_role IS NULL THEN
    PERFORM public.clear_app_user_context();
    RETURN false;
  END IF;

  SELECT string_agg(tu.team_id::text, ',' ORDER BY tu.team_id) INTO v_team_ids
  FROM public.team_users tu
  WHERE tu.user_id = v_user_id;

  PERFORM public.apply_app_user_context(
    v_role,
    v_user_id,
    COALESCE(v_team_ids, ''),
    COALESCE(v_username, ''),
    v_organization_id
  );
  RETURN true;
END;
$$;
