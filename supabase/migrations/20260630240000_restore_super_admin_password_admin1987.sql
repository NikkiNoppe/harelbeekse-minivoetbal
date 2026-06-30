-- Herstel SuperAdmin-login: wachtwoord admin1987 + hash-lookup compatibel met multi-tenant.
-- Oorzaak: 20260613100000 roteerde het wachtwoord weg van admin1987.

CREATE OR REPLACE FUNCTION private.set_super_admin_password(p_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'private'
AS $$
DECLARE
  v_hash jsonb := to_jsonb(
    extensions.crypt(trim(p_password), extensions.gen_salt('bf'))::text
  );
BEGIN
  IF p_password IS NULL OR length(trim(p_password)) < 8 THEN
    RAISE EXCEPTION 'Superadmin password must be at least 8 characters';
  END IF;

  UPDATE public.application_settings
  SET setting_value = v_hash
  WHERE setting_category = 'security'
    AND setting_name = 'super_admin_password_hash';

  IF NOT FOUND THEN
    INSERT INTO public.application_settings (
      organization_id,
      setting_category,
      setting_name,
      setting_value
    )
    VALUES (1, 'security', 'super_admin_password_hash', v_hash);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION private.set_super_admin_password(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.set_super_admin_password(text) TO postgres, service_role;

-- Verwijder dubbele hashes (alleen relevant na org-scoped unique index)
DELETE FROM public.application_settings a
USING public.application_settings b
WHERE a.setting_category = 'security'
  AND a.setting_name = 'super_admin_password_hash'
  AND b.setting_category = 'security'
  AND b.setting_name = 'super_admin_password_hash'
  AND a.id > b.id;

UPDATE public.application_settings
SET
  organization_id = COALESCE(organization_id, 1),
  setting_value = to_jsonb(extensions.crypt('admin1987', extensions.gen_salt('bf'))::text)
WHERE setting_category = 'security'
  AND setting_name = 'super_admin_password_hash';

INSERT INTO public.application_settings (
  organization_id,
  setting_category,
  setting_name,
  setting_value
)
SELECT
  1,
  'security',
  'super_admin_password_hash',
  to_jsonb(extensions.crypt('admin1987', extensions.gen_salt('bf'))::text)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.application_settings s
  WHERE s.setting_category = 'security'
    AND s.setting_name = 'super_admin_password_hash'
);

DELETE FROM public.auth_rate_limits
WHERE rate_key = 'login_super_admin';

CREATE OR REPLACE FUNCTION public.login_super_admin(p_password text)
RETURNS TABLE(session_token uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'private'
AS $$
DECLARE
  v_hash text;
  v_token uuid;
  v_password text := trim(COALESCE(p_password, ''));
BEGIN
  IF v_password = '' THEN
    RETURN;
  END IF;

  IF NOT private.consume_auth_rate_limit('login_super_admin', 5, 15) THEN
    RETURN;
  END IF;

  SELECT s.setting_value #>> '{}' INTO v_hash
  FROM public.application_settings s
  WHERE s.setting_category = 'security'
    AND s.setting_name = 'super_admin_password_hash'
  ORDER BY s.organization_id
  LIMIT 1;

  IF v_hash IS NULL OR extensions.crypt(v_password, v_hash) <> v_hash THEN
    RETURN;
  END IF;

  PERFORM private.clear_auth_rate_limit('login_super_admin');

  v_token := gen_random_uuid();
  INSERT INTO public.user_sessions (session_id, user_id, expires_at)
  VALUES (v_token, -1, now() + interval '24 hours');

  PERFORM public.apply_app_user_context('admin', -1, '', 'SuperAdmin', NULL);

  RETURN QUERY SELECT v_token;
END;
$$;

REVOKE ALL ON FUNCTION public.login_super_admin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.login_super_admin(text) TO anon, authenticated;

COMMENT ON FUNCTION public.login_super_admin(text) IS
  'SuperAdmin login; hash in application_settings (security/super_admin_password_hash).';
