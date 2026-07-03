-- Herstel: acting_organization_id op user_sessions + sessie-functies.
-- Oorzaak: 20260630260000 verwees naar de kolom vóór 20260630230000 op remote was toegepast.

ALTER TABLE public.user_sessions
  ADD COLUMN IF NOT EXISTS acting_organization_id integer
  REFERENCES public.organizations(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.user_sessions.acting_organization_id IS
  'SuperAdmin (user_id=-1): actieve tenant voor admin-RPC''s en RLS-context.';

-- SuperAdmin zonder gekozen tenant: default Harelbeke (org 1) voor sessie-context.
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
  SELECT
    -1,
    'admin'::text,
    'SuperAdmin'::text,
    ARRAY[]::integer[],
    COALESCE(us.acting_organization_id, 1)
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
  'Validates user_sessions token; SuperAdmin org uit acting_organization_id (default 1).';

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
      COALESCE(v_organization_id, 1)
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

-- SuperAdmin: platform-brede reads in session-RPC's (geen tenant-filter op data).
CREATE OR REPLACE FUNCTION public.get_teams_for_session(
  p_session_token uuid,
  p_team_id integer DEFAULT NULL
)
RETURNS TABLE(
  team_id integer,
  team_name text,
  contact_person text,
  contact_phone text,
  contact_email text,
  club_colors text,
  preferred_play_moments jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_team_ids integer[];
  v_org_id integer;
BEGIN
  IF p_session_token IS NULL THEN
    RETURN;
  END IF;

  SELECT s.user_id, s.role, s.team_ids, s.organization_id
  INTO v_user_id, v_role, v_team_ids, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL THEN
    RETURN;
  END IF;

  IF v_role = 'admin' AND v_user_id = -1 THEN
    RETURN QUERY
    SELECT
      t.team_id,
      t.team_name::text,
      t.contact_person::text,
      t.contact_phone::text,
      t.contact_email::text,
      t.club_colors::text,
      t.preferred_play_moments
    FROM public.teams t
    WHERE p_team_id IS NULL OR t.team_id = p_team_id
    ORDER BY t.team_name::text;
    RETURN;
  END IF;

  IF v_role = 'admin' THEN
    RETURN QUERY
    SELECT
      t.team_id,
      t.team_name::text,
      t.contact_person::text,
      t.contact_phone::text,
      t.contact_email::text,
      t.club_colors::text,
      t.preferred_play_moments
    FROM public.teams t
    WHERE t.organization_id = v_org_id
      AND (p_team_id IS NULL OR t.team_id = p_team_id)
    ORDER BY t.team_name::text;
    RETURN;
  END IF;

  IF v_role = 'player_manager' THEN
    IF v_team_ids IS NULL OR array_length(v_team_ids, 1) IS NULL THEN
      RETURN;
    END IF;

    RETURN QUERY
    SELECT
      t.team_id,
      t.team_name::text,
      t.contact_person::text,
      t.contact_phone::text,
      t.contact_email::text,
      t.club_colors::text,
      t.preferred_play_moments
    FROM public.teams t
    WHERE t.team_id = ANY(v_team_ids)
      AND (p_team_id IS NULL OR t.team_id = p_team_id)
    ORDER BY t.team_name::text;
    RETURN;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_teams_for_session(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_teams_for_session(uuid, integer) TO anon, authenticated;

COMMENT ON FUNCTION public.get_teams_for_session(uuid, integer) IS
  'SuperAdmin: alle teams. Org-admin: eigen tenant. Team manager: eigen ploegen.';

CREATE OR REPLACE FUNCTION public.get_players_for_session(
  p_session_token uuid,
  p_team_id integer DEFAULT NULL
)
RETURNS TABLE(
  player_id integer,
  first_name character varying,
  last_name character varying,
  birth_date date,
  team_id integer,
  yellow_cards integer,
  red_cards integer,
  suspended_matches_remaining integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_team_ids integer[];
  v_org_id integer;
BEGIN
  SELECT s.user_id, s.role, s.team_ids, s.organization_id
  INTO v_user_id, v_role, v_team_ids, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL THEN
    RETURN;
  END IF;

  IF v_role = 'admin' AND v_user_id = -1 THEN
    RETURN QUERY
    SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id,
           COALESCE(p.yellow_cards, 0), COALESCE(p.red_cards, 0),
           COALESCE(p.suspended_matches_remaining, 0)
    FROM public.players p
    WHERE p_team_id IS NULL OR p.team_id = p_team_id
    ORDER BY p.last_name, p.first_name;
    RETURN;
  END IF;

  IF v_role = 'admin' THEN
    RETURN QUERY
    SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id,
           COALESCE(p.yellow_cards, 0), COALESCE(p.red_cards, 0),
           COALESCE(p.suspended_matches_remaining, 0)
    FROM public.players p
    WHERE p.organization_id = v_org_id
      AND (p_team_id IS NULL OR p.team_id = p_team_id)
    ORDER BY p.last_name, p.first_name;
    RETURN;
  END IF;

  IF v_role = 'player_manager' THEN
    IF p_team_id IS NOT NULL AND NOT (p_team_id = ANY(v_team_ids)) THEN
      RETURN;
    END IF;
    RETURN QUERY
    SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id,
           COALESCE(p.yellow_cards, 0), COALESCE(p.red_cards, 0),
           COALESCE(p.suspended_matches_remaining, 0)
    FROM public.players p
    WHERE p.team_id = ANY(v_team_ids)
      AND (p_team_id IS NULL OR p.team_id = p_team_id)
    ORDER BY p.last_name, p.first_name;
    RETURN;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_players_for_session(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_players_for_session(uuid, integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_referees_for_session(
  p_session_token uuid,
  p_user_id integer DEFAULT NULL
)
RETURNS TABLE(user_id integer, username text)
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

  IF v_role IS NULL OR v_role NOT IN ('admin', 'referee') THEN
    RETURN;
  END IF;

  IF v_role = 'admin' AND v_user_id = -1 THEN
    RETURN QUERY
    SELECT u.user_id, u.username::text
    FROM public.users u
    WHERE u.role::text = 'referee'
      AND (p_user_id IS NULL OR u.user_id = p_user_id)
    ORDER BY u.username::text;
    RETURN;
  END IF;

  IF v_role = 'admin' THEN
    RETURN QUERY
    SELECT u.user_id, u.username::text
    FROM public.users u
    WHERE u.role::text = 'referee'
      AND u.organization_id = v_org_id
      AND (p_user_id IS NULL OR u.user_id = p_user_id)
    ORDER BY u.username::text;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT u.user_id, u.username::text
  FROM public.users u
  WHERE u.role::text = 'referee'
    AND u.organization_id = v_org_id
    AND (p_user_id IS NULL OR u.user_id = p_user_id)
  ORDER BY u.username::text;
END;
$$;

REVOKE ALL ON FUNCTION public.get_referees_for_session(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_referees_for_session(uuid, integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_matches_for_session(
  p_session_token uuid,
  p_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS SETOF public.matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_team_ids integer[];
  v_org_id integer;
BEGIN
  SELECT s.user_id, s.role, s.team_ids, s.organization_id
  INTO v_user_id, v_role, v_team_ids, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL THEN
    RETURN;
  END IF;

  IF v_role = 'admin' AND v_user_id = -1 THEN
    RETURN QUERY
    SELECT m.*
    FROM public.matches m
    WHERE
      (NOT (p_filters ? 'is_cup_match') OR m.is_cup_match = (p_filters->>'is_cup_match')::boolean)
      AND (NOT (p_filters ? 'match_id') OR m.match_id = (p_filters->>'match_id')::integer)
      AND (NOT (p_filters ? 'unique_number') OR m.unique_number = p_filters->>'unique_number')
    ORDER BY m.match_date;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT m.*
  FROM public.matches m
  WHERE
    (NOT (p_filters ? 'is_cup_match') OR m.is_cup_match = (p_filters->>'is_cup_match')::boolean)
    AND (NOT (p_filters ? 'match_id') OR m.match_id = (p_filters->>'match_id')::integer)
    AND (NOT (p_filters ? 'unique_number') OR m.unique_number = p_filters->>'unique_number')
    AND (
      (v_role = 'admin' AND m.organization_id = v_org_id)
      OR (v_role IN ('player_manager', 'referee') AND (
        m.home_team_id = ANY(COALESCE(v_team_ids, ARRAY[]::integer[]))
        OR m.away_team_id = ANY(COALESCE(v_team_ids, ARRAY[]::integer[]))
      ))
    )
  ORDER BY m.match_date;
END;
$$;

REVOKE ALL ON FUNCTION public.get_matches_for_session(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_matches_for_session(uuid, jsonb) TO anon, authenticated;
