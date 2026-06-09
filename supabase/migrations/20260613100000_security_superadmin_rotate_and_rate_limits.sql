-- P0: Invalidate known default superadmin password, rate-limit auth endpoints, remove security test user.

-- =============================================================================
-- 1) auth_rate_limits (service_role only)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  rate_key text PRIMARY KEY,
  attempt_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all client access on auth rate limits" ON public.auth_rate_limits;
CREATE POLICY "Deny all client access on auth rate limits"
ON public.auth_rate_limits
AS RESTRICTIVE
FOR ALL
TO public
USING (false)
WITH CHECK (false);

REVOKE ALL ON TABLE public.auth_rate_limits FROM anon, authenticated;
GRANT ALL ON TABLE public.auth_rate_limits TO service_role;

-- Returns TRUE when the request is allowed; FALSE when rate-limited.
CREATE OR REPLACE FUNCTION private.consume_auth_rate_limit(
  p_key text,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_row public.auth_rate_limits%ROWTYPE;
BEGIN
  IF p_key IS NULL OR trim(p_key) = '' THEN
    RETURN true;
  END IF;

  SELECT * INTO v_row
  FROM public.auth_rate_limits
  WHERE rate_key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.auth_rate_limits (rate_key, attempt_count, window_start)
    VALUES (p_key, 1, now());
    RETURN true;
  END IF;

  IF v_row.window_start < now() - make_interval(mins => p_window_minutes) THEN
    UPDATE public.auth_rate_limits
    SET attempt_count = 1, window_start = now()
    WHERE rate_key = p_key;
    RETURN true;
  END IF;

  IF v_row.attempt_count >= p_max_attempts THEN
    RETURN false;
  END IF;

  UPDATE public.auth_rate_limits
  SET attempt_count = attempt_count + 1
  WHERE rate_key = p_key;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION private.clear_auth_rate_limit(p_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
BEGIN
  DELETE FROM public.auth_rate_limits WHERE rate_key = p_key;
END;
$$;

REVOKE ALL ON FUNCTION private.consume_auth_rate_limit(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.clear_auth_rate_limit(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.consume_auth_rate_limit(text, integer, integer) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION private.clear_auth_rate_limit(text) TO postgres, service_role;

-- Service-role helper for edge functions (password reset rate limit).
CREATE OR REPLACE FUNCTION public.check_email_rate_limit(
  p_email text,
  p_action text DEFAULT 'password_reset',
  p_max_attempts integer DEFAULT 3,
  p_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_key text;
BEGIN
  v_key := lower(trim(p_action)) || ':' || lower(trim(COALESCE(p_email, '')));
  RETURN private.consume_auth_rate_limit(v_key, p_max_attempts, p_window_minutes);
END;
$$;

REVOKE ALL ON FUNCTION public.check_email_rate_limit(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_email_rate_limit(text, text, integer, integer) TO service_role;

-- =============================================================================
-- 2) Rotate superadmin password (invalidates known default admin1987)
-- =============================================================================
CREATE OR REPLACE FUNCTION private.set_super_admin_password(p_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'private'
AS $$
BEGIN
  IF p_password IS NULL OR length(trim(p_password)) < 12 THEN
    RAISE EXCEPTION 'Superadmin password must be at least 12 characters';
  END IF;

  INSERT INTO public.application_settings (setting_category, setting_name, setting_value)
  VALUES (
    'security',
    'super_admin_password_hash',
    to_jsonb(extensions.crypt(trim(p_password), extensions.gen_salt('bf'))::text)
  )
  ON CONFLICT (setting_category, setting_name)
  DO UPDATE SET setting_value = EXCLUDED.setting_value;
END;
$$;

REVOKE ALL ON FUNCTION private.set_super_admin_password(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.set_super_admin_password(text) TO postgres, service_role;

DO $$
DECLARE
  v_new_pw text := encode(gen_random_bytes(16), 'hex');
BEGIN
  PERFORM private.set_super_admin_password(v_new_pw);
  RAISE NOTICE 'SuperAdmin password rotated. Store this one-time password securely: %', v_new_pw;
END;
$$;

-- =============================================================================
-- 3) login_user / login_super_admin with rate limiting
-- =============================================================================
CREATE OR REPLACE FUNCTION public.login_user(
  input_username_or_email text,
  input_password text
)
RETURNS TABLE(
  user_id integer,
  username character varying,
  email character varying,
  role text,
  session_token uuid,
  team_ids integer[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'private'
AS $$
DECLARE
  v_user record;
  v_token uuid;
  v_team_ids integer[];
  v_team_ids_text text;
  v_rate_key text;
BEGIN
  v_rate_key := 'login_user:' || lower(trim(COALESCE(input_username_or_email, '')));
  IF NOT private.consume_auth_rate_limit(v_rate_key, 5, 15) THEN
    RETURN;
  END IF;

  SELECT u.user_id, u.username, u.email, u.role::text
  INTO v_user
  FROM public.users u
  WHERE (u.username = input_username_or_email OR u.email = input_username_or_email)
    AND u.password = extensions.crypt(input_password, u.password);

  IF NOT FOUND THEN
    RETURN;
  END IF;

  PERFORM private.clear_auth_rate_limit(v_rate_key);

  v_token := gen_random_uuid();
  INSERT INTO public.user_sessions (session_id, user_id, expires_at)
  VALUES (v_token, v_user.user_id, now() + interval '24 hours');

  SELECT array_agg(tu.team_id ORDER BY tu.team_id) INTO v_team_ids
  FROM public.team_users tu
  WHERE tu.user_id = v_user.user_id;

  v_team_ids_text := COALESCE(array_to_string(v_team_ids, ','), '');
  PERFORM public.apply_app_user_context(v_user.role, v_user.user_id, v_team_ids_text, v_user.username::text);

  RETURN QUERY
  SELECT v_user.user_id, v_user.username, v_user.email, v_user.role, v_token, v_team_ids;
END;
$$;

CREATE OR REPLACE FUNCTION public.login_super_admin(p_password text)
RETURNS TABLE(session_token uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'private'
AS $$
DECLARE
  v_hash text;
  v_token uuid;
BEGIN
  IF NOT private.consume_auth_rate_limit('login_super_admin', 5, 15) THEN
    RETURN;
  END IF;

  SELECT s.setting_value #>> '{}' INTO v_hash
  FROM public.application_settings s
  WHERE s.setting_category = 'security'
    AND s.setting_name = 'super_admin_password_hash'
  LIMIT 1;

  IF v_hash IS NULL OR extensions.crypt(p_password, v_hash) <> v_hash THEN
    RETURN;
  END IF;

  PERFORM private.clear_auth_rate_limit('login_super_admin');

  v_token := gen_random_uuid();
  INSERT INTO public.user_sessions (session_id, user_id, expires_at)
  VALUES (v_token, -1, now() + interval '24 hours');

  PERFORM public.apply_app_user_context('admin', -1, '', 'SuperAdmin');

  RETURN QUERY SELECT v_token;
END;
$$;

-- =============================================================================
-- 4) Remove security penetration-test user if present
-- =============================================================================
DELETE FROM public.team_users WHERE user_id = 40;
DELETE FROM public.user_sessions WHERE user_id = 40;
DELETE FROM public.password_reset_tokens WHERE user_id = 40;
DELETE FROM public.users WHERE user_id = 40 AND username = 'security-test-delete-me';
