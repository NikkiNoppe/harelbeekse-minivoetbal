-- =============================================================================
-- Multi-tenant RLS: organization_id in sessie-context + tenant-isolatie op policies
-- profiles-view op users (organization_id per gebruiker)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT NULLIF(current_setting('app.current_organization_id', true), '')::integer;
$$;

REVOKE ALL ON FUNCTION public.get_current_user_organization_id() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_organization_id() TO postgres, service_role;

COMMENT ON FUNCTION public.get_current_user_organization_id() IS
  'Actieve organization_id uit app.current_organization_id (gezet bij login/sessie-RPC).';

CREATE OR REPLACE FUNCTION public.can_access_organization(p_organization_id integer)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
  v_user_id integer;
  v_user_org integer;
BEGIN
  IF p_organization_id IS NULL THEN
    RETURN false;
  END IF;

  v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::integer;
  v_role := NULLIF(current_setting('app.current_user_role', true), '');

  -- SuperAdmin: platform-brede toegang
  IF v_user_id = -1 AND v_role = 'admin' THEN
    RETURN true;
  END IF;

  -- Ingelogde gebruiker: alleen eigen organisatie
  IF v_role IS NOT NULL AND v_role <> '' THEN
    v_user_org := NULLIF(current_setting('app.current_organization_id', true), '')::integer;
    RETURN p_organization_id = v_user_org;
  END IF;

  -- Anon zonder sessie: alleen default-publieke tenant (tot host/slug-resolver actief is)
  RETURN p_organization_id = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.can_access_organization(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_organization(integer) TO postgres, service_role;

COMMENT ON FUNCTION public.can_access_organization(integer) IS
  'RLS helper: SuperAdmin = alle orgs; ingelogd = eigen org; anon = org 1 (publiek).';

-- ---------------------------------------------------------------------------
-- 2. Sessie-context (organization_id)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clear_app_user_context()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM set_config('app.current_user_role', '', true);
  PERFORM set_config('app.current_user_id', '', true);
  PERFORM set_config('app.current_user_team_ids', '', true);
  PERFORM set_config('app.current_user_username', '', true);
  PERFORM set_config('app.current_organization_id', '', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_app_user_context(
  p_role text,
  p_user_id integer,
  p_team_ids text,
  p_username text DEFAULT '',
  p_organization_id integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_organization_id integer := p_organization_id;
BEGIN
  IF v_organization_id IS NULL AND p_user_id IS NOT NULL AND p_user_id > 0 THEN
    SELECT u.organization_id
    INTO v_organization_id
    FROM public.users u
    WHERE u.user_id = p_user_id;
  END IF;

  PERFORM public.clear_app_user_context();
  PERFORM set_config('app.current_user_role', COALESCE(p_role, ''), true);
  PERFORM set_config('app.current_user_id', COALESCE(p_user_id::text, ''), true);
  PERFORM set_config('app.current_user_team_ids', COALESCE(p_team_ids, ''), true);
  PERFORM set_config('app.current_user_username', COALESCE(p_username, ''), true);
  PERFORM set_config(
    'app.current_organization_id',
    COALESCE(v_organization_id::text, ''),
    true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_app_user_context(text, integer, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_app_user_context(text, integer, text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_app_user_context(text, integer, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_app_user_context(text, integer, text, text, integer) TO service_role;

-- resolve_app_session: organization_id teruggeven
DROP FUNCTION IF EXISTS private.resolve_app_session(uuid);

CREATE OR REPLACE FUNCTION private.resolve_app_session(p_session_token uuid)
RETURNS TABLE(
  user_id integer,
  role text,
  username text,
  team_ids integer[],
  organization_id integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
BEGIN
  IF p_session_token IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT -1, 'admin'::text, 'SuperAdmin'::text, ARRAY[]::integer[], NULL::integer
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
    ),
    u.organization_id
  FROM public.user_sessions us
  JOIN public.users u ON u.user_id = us.user_id
  LEFT JOIN public.team_users tu ON tu.user_id = us.user_id
  WHERE us.session_id = p_session_token
    AND us.expires_at > now()
  GROUP BY us.user_id, u.role::text, u.username::text, u.organization_id;
END;
$$;

REVOKE ALL ON FUNCTION private.resolve_app_session(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.resolve_app_session(uuid) TO postgres, service_role;

COMMENT ON FUNCTION private.resolve_app_session(uuid) IS
  'Validates user_sessions token; returns role/username/teams/organization_id. Internal helper for session-RPCs.';

-- login_user (rate-limited versie) + organization_id in context
DROP FUNCTION IF EXISTS public.login_user(text, text);

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

  SELECT us.user_id INTO v_user_id
  FROM public.user_sessions us
  WHERE us.session_id = p_session_token
    AND us.expires_at > now();

  IF NOT FOUND THEN
    PERFORM public.clear_app_user_context();
    RETURN false;
  END IF;

  IF v_user_id = -1 THEN
    PERFORM public.apply_app_user_context('admin', -1, '', 'SuperAdmin', NULL);
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

-- create_user_for_session: organization_id van admin-sessie
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

  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  INSERT INTO public.users (username, email, password, role, organization_id)
  VALUES (
    username_param,
    email_param,
    extensions.crypt(password_param, extensions.gen_salt('bf', 8)),
    role_param,
    COALESCE(v_org_id, 1)
  )
  RETURNING * INTO new_user;

  RETURN new_user;
END;
$$;

REVOKE ALL ON FUNCTION public.login_user(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.login_user(text, text) TO anon, authenticated;

COMMENT ON COLUMN public.users.organization_id IS
  'Tenant / organisatie van deze gebruiker (profiel).';

-- ---------------------------------------------------------------------------
-- 3. profiles-view (organization_id per user; bron = users)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.profiles
WITH (security_invoker = true)
AS
SELECT
  user_id,
  username,
  email,
  role,
  organization_id,
  auth_uid
FROM public.users;

COMMENT ON VIEW public.profiles IS
  'Gebruikersprofiel incl. organization_id. RLS via onderliggende users-tabel.';

GRANT SELECT ON public.profiles TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. RLS policies: tenant-check op organization_id
-- ---------------------------------------------------------------------------

-- users
DROP POLICY IF EXISTS "Read users by role" ON public.users;
CREATE POLICY "Read users by role"
ON public.users
FOR SELECT
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (
    (SELECT get_current_user_role()) = 'admin'
    OR user_id = (SELECT current_setting('app.current_user_id', true))::integer
    OR (
      (SELECT get_current_user_role()) IS NOT NULL
      AND (SELECT get_current_user_role()) <> ''
      AND role = 'referee'::user_role
    )
  )
);

DROP POLICY IF EXISTS "Manage users as admin" ON public.users;
CREATE POLICY "Manage users as admin"
ON public.users
FOR INSERT
TO public
WITH CHECK (
  (SELECT public.can_access_organization(organization_id))
  AND (SELECT get_current_user_role()) = 'admin'
);

DROP POLICY IF EXISTS "Update users as admin" ON public.users;
CREATE POLICY "Update users as admin"
ON public.users
FOR UPDATE
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (SELECT get_current_user_role()) = 'admin'
)
WITH CHECK (
  (SELECT public.can_access_organization(organization_id))
  AND (SELECT get_current_user_role()) = 'admin'
);

DROP POLICY IF EXISTS "Delete users as admin" ON public.users;
CREATE POLICY "Delete users as admin"
ON public.users
FOR DELETE
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (SELECT get_current_user_role()) = 'admin'
);

-- teams
DROP POLICY IF EXISTS "Read teams by role" ON public.teams;
CREATE POLICY "Read teams by role"
ON public.teams
FOR SELECT
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (
    (SELECT get_current_user_role()) = 'admin'
    OR (SELECT get_current_user_role()) = 'referee'
    OR (SELECT get_current_user_role()) = 'player_manager'
    OR EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.auth_uid = (SELECT auth.uid())
        AND u.role = 'admin'::public.user_role
        AND u.organization_id = teams.organization_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.users u
      JOIN public.team_users tu ON tu.user_id = u.user_id
      WHERE u.auth_uid = (SELECT auth.uid())
        AND tu.team_id = teams.team_id
        AND u.organization_id = teams.organization_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.auth_uid = (SELECT auth.uid())
        AND u.role = 'referee'::public.user_role
        AND u.organization_id = teams.organization_id
    )
  )
);

DROP POLICY IF EXISTS "Admins can create teams" ON public.teams;
CREATE POLICY "Admins can create teams"
ON public.teams
FOR INSERT
TO public
WITH CHECK (
  (SELECT public.can_access_organization(organization_id))
  AND (SELECT get_current_user_role()) = 'admin'
);

DROP POLICY IF EXISTS "Team managers and admins can update teams" ON public.teams;
CREATE POLICY "Team managers and admins can update teams"
ON public.teams
FOR UPDATE
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (
    (SELECT get_current_user_role()) = 'admin'
    OR team_id = ANY (get_current_user_team_ids())
  )
)
WITH CHECK ((SELECT public.can_access_organization(organization_id)));

DROP POLICY IF EXISTS "Admins can delete teams" ON public.teams;
CREATE POLICY "Admins can delete teams"
ON public.teams
FOR DELETE
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (SELECT get_current_user_role()) = 'admin'
);

-- matches
DROP POLICY IF EXISTS "Read matches by role" ON public.matches;
CREATE POLICY "Read matches by role"
ON public.matches
FOR SELECT
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (
    (SELECT get_current_user_role()) = 'admin'
    OR (
      (SELECT get_current_user_role()) = 'player_manager'
      AND (
        home_team_id = ANY (get_current_user_team_ids())
        OR away_team_id = ANY (get_current_user_team_ids())
      )
    )
    OR (
      (SELECT get_current_user_role()) = 'referee'
      AND (
        assigned_referee_id = NULLIF((SELECT current_setting('app.current_user_id', true)), '')::integer
        OR (
          referee IS NOT NULL
          AND referee <> ''
          AND referee = COALESCE(NULLIF((SELECT current_setting('app.current_user_username', true)), ''), '')
        )
      )
    )
  )
);

DROP POLICY IF EXISTS "Update matches by role" ON public.matches;
CREATE POLICY "Update matches by role"
ON public.matches
FOR UPDATE
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (
    (SELECT get_current_user_role()) = 'admin'
    OR (
      (SELECT get_current_user_role()) = 'player_manager'
      AND (
        home_team_id = ANY (get_current_user_team_ids())
        OR away_team_id = ANY (get_current_user_team_ids())
      )
    )
  )
)
WITH CHECK (
  (SELECT public.can_access_organization(organization_id))
  AND (
    (SELECT get_current_user_role()) = 'admin'
    OR (
      (SELECT get_current_user_role()) = 'player_manager'
      AND (
        home_team_id = ANY (get_current_user_team_ids())
        OR away_team_id = ANY (get_current_user_team_ids())
      )
    )
  )
);

DROP POLICY IF EXISTS "Insert matches as admin" ON public.matches;
CREATE POLICY "Insert matches as admin"
ON public.matches
FOR INSERT
TO public
WITH CHECK (
  (SELECT public.can_access_organization(organization_id))
  AND (SELECT get_current_user_role()) = 'admin'
);

DROP POLICY IF EXISTS "Delete matches as admin" ON public.matches;
CREATE POLICY "Delete matches as admin"
ON public.matches
FOR DELETE
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (SELECT get_current_user_role()) = 'admin'
);

-- players
DROP POLICY IF EXISTS "Read players by role" ON public.players;
CREATE POLICY "Read players by role"
ON public.players
FOR SELECT
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (
    (SELECT get_current_user_role()) = 'admin'
    OR (
      (SELECT get_current_user_role()) = 'player_manager'
      AND team_id = ANY (get_current_user_team_ids())
    )
    OR can_read_player_for_match(team_id)
  )
);

DROP POLICY IF EXISTS "Insert players by role" ON public.players;
CREATE POLICY "Insert players by role"
ON public.players
FOR INSERT
TO public
WITH CHECK (
  (SELECT public.can_access_organization(organization_id))
  AND (
    (SELECT get_current_user_role()) = 'admin'
    OR (
      (SELECT get_current_user_role()) = 'player_manager'
      AND team_id = ANY (get_current_user_team_ids())
    )
  )
);

DROP POLICY IF EXISTS "Update players by role" ON public.players;
CREATE POLICY "Update players by role"
ON public.players
FOR UPDATE
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (
    (SELECT get_current_user_role()) = 'admin'
    OR (
      (SELECT get_current_user_role()) = 'player_manager'
      AND team_id = ANY (get_current_user_team_ids())
    )
  )
)
WITH CHECK (
  (SELECT public.can_access_organization(organization_id))
  AND (
    (SELECT get_current_user_role()) = 'admin'
    OR (
      (SELECT get_current_user_role()) = 'player_manager'
      AND team_id = ANY (get_current_user_team_ids())
    )
  )
);

DROP POLICY IF EXISTS "Delete players by role" ON public.players;
CREATE POLICY "Delete players by role"
ON public.players
FOR DELETE
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (
    (SELECT get_current_user_role()) = 'admin'
    OR (
      (SELECT get_current_user_role()) = 'player_manager'
      AND team_id = ANY (get_current_user_team_ids())
    )
  )
);

-- team_users
DROP POLICY IF EXISTS "Read team_users by role" ON public.team_users;
CREATE POLICY "Read team_users by role"
ON public.team_users
FOR SELECT
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (
    (SELECT get_current_user_role()) = 'admin'
    OR (
      (SELECT get_current_user_role()) = 'player_manager'
      AND user_id = (SELECT current_setting('app.current_user_id', true))::integer
    )
  )
);

DROP POLICY IF EXISTS "Admins can insert team_users" ON public.team_users;
CREATE POLICY "Admins can insert team_users"
ON public.team_users
FOR INSERT
TO public
WITH CHECK (
  (SELECT public.can_access_organization(organization_id))
  AND (SELECT get_current_user_role()) = 'admin'
);

DROP POLICY IF EXISTS "Admins can update team_users" ON public.team_users;
CREATE POLICY "Admins can update team_users"
ON public.team_users
FOR UPDATE
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (SELECT get_current_user_role()) = 'admin'
)
WITH CHECK ((SELECT public.can_access_organization(organization_id)));

DROP POLICY IF EXISTS "Admins can delete team_users" ON public.team_users;
CREATE POLICY "Admins can delete team_users"
ON public.team_users
FOR DELETE
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (SELECT get_current_user_role()) = 'admin'
);

-- team_costs
DROP POLICY IF EXISTS "Manage team_costs by role" ON public.team_costs;
CREATE POLICY "Manage team_costs by role"
ON public.team_costs
FOR ALL
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (
    pg_trigger_depth() > 0
    OR (SELECT auth.role()) = 'service_role'
    OR (SELECT get_current_user_role()) = 'admin'
    OR (
      (SELECT get_current_user_role()) = 'player_manager'
      AND team_id = ANY (get_current_user_team_ids())
    )
  )
)
WITH CHECK (
  (SELECT public.can_access_organization(organization_id))
  AND (
    pg_trigger_depth() > 0
    OR (SELECT auth.role()) = 'service_role'
    OR (SELECT get_current_user_role()) = 'admin'
    OR (
      (SELECT get_current_user_role()) = 'referee'
      AND match_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM matches m
        JOIN users u ON u.user_id = (SELECT current_setting('app.current_user_id', true))::integer
        WHERE m.match_id = team_costs.match_id
          AND m.organization_id = team_costs.organization_id
          AND u.organization_id = team_costs.organization_id
          AND (
            m.assigned_referee_id = u.user_id
            OR m.referee = u.username::text
          )
      )
    )
  )
);

-- costs
DROP POLICY IF EXISTS "costs_public_read_final" ON public.costs;
CREATE POLICY "costs_public_read_final"
ON public.costs
FOR SELECT
TO public
USING ((SELECT public.can_access_organization(organization_id)));

DROP POLICY IF EXISTS "Insert costs as admin" ON public.costs;
CREATE POLICY "Insert costs as admin"
ON public.costs
FOR INSERT
TO public
WITH CHECK (
  (SELECT public.can_access_organization(organization_id))
  AND (SELECT get_current_user_role()) = 'admin'
);

DROP POLICY IF EXISTS "Update costs as admin" ON public.costs;
CREATE POLICY "Update costs as admin"
ON public.costs
FOR UPDATE
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (SELECT get_current_user_role()) = 'admin'
)
WITH CHECK ((SELECT public.can_access_organization(organization_id)));

DROP POLICY IF EXISTS "Delete costs as admin" ON public.costs;
CREATE POLICY "Delete costs as admin"
ON public.costs
FOR DELETE
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (SELECT get_current_user_role()) = 'admin'
);

-- application_settings
DROP POLICY IF EXISTS "Read application settings by role and category" ON public.application_settings;
CREATE POLICY "Read application settings by role and category"
ON public.application_settings
FOR SELECT
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (
    (SELECT is_admin_user())
    OR setting_category::text = 'admin_notifications'
    OR setting_category::text = 'blog_posts'
    OR setting_category::text = 'match_form_settings'
    OR setting_category::text = 'player_list_lock'
    OR setting_category::text = 'referee_polls'
    OR setting_category::text = ANY (ARRAY['season_data', 'priority_order'])
    OR setting_category::text = 'season_archives'
    OR setting_category::text = 'tab_visibility'
    OR setting_category::text = 'theme_colors'
    OR (
      setting_category::text = 'admin_messages'
      AND (SELECT get_current_user_role()) = ANY (ARRAY['admin', 'player_manager', 'referee'])
    )
    OR (
      setting_category::text = 'suspension_rules'
      AND (SELECT get_current_user_role()) = 'player_manager'
    )
    OR (
      setting_category::text = 'automatic_suspension_overrides'
      AND (SELECT get_current_user_role()) = 'player_manager'
      AND split_part(setting_name::text, ':', 1)::integer IN (
        SELECT players.player_id
        FROM players
        WHERE players.team_id = ANY (get_current_user_team_ids())
          AND players.organization_id = application_settings.organization_id
      )
    )
    OR (
      setting_category::text = 'manual_suspensions'
      AND (SELECT get_current_user_role()) = 'player_manager'
      AND setting_name::integer IN (
        SELECT players.player_id
        FROM players
        WHERE players.team_id = ANY (get_current_user_team_ids())
          AND players.organization_id = application_settings.organization_id
      )
    )
  )
);

DROP POLICY IF EXISTS "Write application settings as admin" ON public.application_settings;
CREATE POLICY "Write application settings as admin"
ON public.application_settings
FOR INSERT
TO public
WITH CHECK (
  (SELECT public.can_access_organization(organization_id))
  AND (SELECT is_admin_user())
);

DROP POLICY IF EXISTS "Update application settings as admin" ON public.application_settings;
CREATE POLICY "Update application settings as admin"
ON public.application_settings
FOR UPDATE
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (SELECT is_admin_user())
)
WITH CHECK ((SELECT public.can_access_organization(organization_id)));

DROP POLICY IF EXISTS "Delete application settings as admin" ON public.application_settings;
CREATE POLICY "Delete application settings as admin"
ON public.application_settings
FOR DELETE
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (SELECT is_admin_user())
);

-- referee_matches
DROP POLICY IF EXISTS "Read referee_matches by role" ON public.referee_matches;
CREATE POLICY "Read referee_matches by role"
ON public.referee_matches
FOR SELECT
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (
    (SELECT get_current_user_role()) = 'admin'
    OR referee_id = (SELECT current_setting('app.current_user_id', true))::integer
  )
);

DROP POLICY IF EXISTS "Insert referee_matches by role" ON public.referee_matches;
CREATE POLICY "Insert referee_matches by role"
ON public.referee_matches
FOR INSERT
TO public
WITH CHECK (
  (SELECT public.can_access_organization(organization_id))
  AND (
    (SELECT get_current_user_role()) = 'admin'
    OR referee_id = (SELECT current_setting('app.current_user_id', true))::integer
  )
);

DROP POLICY IF EXISTS "Update referee_matches by role" ON public.referee_matches;
CREATE POLICY "Update referee_matches by role"
ON public.referee_matches
FOR UPDATE
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (
    (SELECT get_current_user_role()) = 'admin'
    OR (
      referee_id = (SELECT current_setting('app.current_user_id', true))::integer
      AND (SELECT get_current_user_role()) = 'referee'
    )
  )
)
WITH CHECK (
  (SELECT public.can_access_organization(organization_id))
  AND (
    (SELECT get_current_user_role()) = 'admin'
    OR (
      referee_id = (SELECT current_setting('app.current_user_id', true))::integer
      AND (SELECT get_current_user_role()) = 'referee'
    )
  )
);

DROP POLICY IF EXISTS "Delete referee_matches by role" ON public.referee_matches;
CREATE POLICY "Delete referee_matches by role"
ON public.referee_matches
FOR DELETE
TO public
USING (
  (SELECT public.can_access_organization(organization_id))
  AND (SELECT get_current_user_role()) = 'admin'
);
