-- Gebruikersnaam uniek per organisatie (zelfde username mag in Harelbeke én Kuurne).

DROP INDEX IF EXISTS public.users_username_key;

CREATE UNIQUE INDEX IF NOT EXISTS users_organization_id_username_key
  ON public.users (organization_id, username);

COMMENT ON INDEX public.users_organization_id_username_key IS
  'Gebruikersnaam uniek binnen één tenant; platform-brede users_username_key is verwijderd.';

-- login_user: filter op organization_id van de actieve site
DROP FUNCTION IF EXISTS public.login_user(text, text);

CREATE OR REPLACE FUNCTION public.login_user(
  input_username_or_email text,
  input_password text,
  p_organization_id integer DEFAULT NULL
)
RETURNS TABLE(
  user_id integer,
  username character varying,
  email character varying,
  role text,
  session_token uuid,
  team_ids integer[],
  organization_id integer
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

  SELECT u.user_id, u.username, u.email, u.role::text, u.organization_id
  INTO v_user
  FROM public.users u
  WHERE (u.username = input_username_or_email OR u.email = input_username_or_email)
    AND u.password = extensions.crypt(input_password, u.password)
    AND (
      p_organization_id IS NULL
      OR u.organization_id = p_organization_id
    );

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
  PERFORM public.apply_app_user_context(
    v_user.role,
    v_user.user_id,
    v_team_ids_text,
    v_user.username::text,
    v_user.organization_id
  );

  RETURN QUERY
  SELECT
    v_user.user_id,
    v_user.username,
    v_user.email,
    v_user.role,
    v_token,
    v_team_ids,
    v_user.organization_id;
END;
$$;

REVOKE ALL ON FUNCTION public.login_user(text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.login_user(text, text, integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_user_for_session(
  p_session_token uuid,
  username_param character varying,
  email_param character varying,
  password_param character varying,
  role_param public.user_role DEFAULT 'player_manager'::public.user_role
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'private'
AS $$
DECLARE
  v_role text;
  v_org_id integer;
  new_user public.users;
BEGIN
  SELECT s.role, s.organization_id
  INTO v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.organization_id = v_org_id
      AND lower(u.username::text) = lower(trim(username_param::text))
  ) THEN
    RAISE EXCEPTION 'Gebruikersnaam bestaat al in deze organisatie'
      USING ERRCODE = 'unique_violation';
  END IF;

  INSERT INTO public.users (username, email, password, role, organization_id)
  VALUES (
    trim(username_param),
    email_param,
    extensions.crypt(password_param, extensions.gen_salt('bf', 8)),
    role_param,
    v_org_id
  )
  RETURNING * INTO new_user;

  RETURN new_user;
END;
$$;

REVOKE ALL ON FUNCTION public.create_user_for_session(uuid, character varying, character varying, character varying, public.user_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_user_for_session(uuid, character varying, character varying, character varying, public.user_role) TO anon, authenticated;
