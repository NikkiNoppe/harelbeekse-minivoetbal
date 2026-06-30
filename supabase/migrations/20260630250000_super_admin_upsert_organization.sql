-- SuperAdmin: organisaties (Harelbeke/Kuurne/…) lezen en bijwerken.

CREATE OR REPLACE FUNCTION private.assert_super_admin_session(p_session_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id integer;
BEGIN
  IF p_session_token IS NULL THEN
    RETURN false;
  END IF;

  SELECT us.user_id INTO v_user_id
  FROM public.user_sessions us
  WHERE us.session_id = p_session_token
    AND us.expires_at > now();

  RETURN FOUND AND v_user_id = -1;
END;
$$;

REVOKE ALL ON FUNCTION private.assert_super_admin_session(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.assert_super_admin_session(uuid) TO postgres, service_role;

CREATE OR REPLACE FUNCTION public.upsert_organization_for_super_admin(
  p_session_token uuid,
  p_organization_id integer,
  p_name text,
  p_slug text,
  p_branding_settings jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_slug text := lower(trim(COALESCE(p_slug, '')));
  v_name text := trim(COALESCE(p_name, ''));
  v_conflict_id integer;
BEGIN
  IF NOT private.assert_super_admin_session(p_session_token) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen SuperAdmin');
  END IF;

  IF p_organization_id IS NULL OR p_organization_id < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ongeldig organization_id');
  END IF;

  IF v_slug = '' OR v_name = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Naam en slug zijn verplicht');
  END IF;

  SELECT o.id INTO v_conflict_id
  FROM public.organizations o
  WHERE o.slug = v_slug
    AND o.id <> p_organization_id
  LIMIT 1;

  IF v_conflict_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Slug "%s" is al in gebruik (id=%s)', v_slug, v_conflict_id)
    );
  END IF;

  INSERT INTO public.organizations (id, name, slug, branding_settings)
  VALUES (
    p_organization_id,
    v_name,
    v_slug,
    COALESCE(p_branding_settings, '{}'::jsonb)
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    branding_settings = EXCLUDED.branding_settings;

  RETURN jsonb_build_object(
    'success', true,
    'id', p_organization_id,
    'slug', v_slug
  );
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_organization_for_super_admin(uuid, integer, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_organization_for_super_admin(uuid, integer, text, text, jsonb) TO anon, authenticated;

COMMENT ON FUNCTION public.upsert_organization_for_super_admin(uuid, integer, text, text, jsonb) IS
  'SuperAdmin: aanmaken of bijwerken van organizations (branding, content, links).';
