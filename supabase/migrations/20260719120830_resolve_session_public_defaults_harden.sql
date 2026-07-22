-- Fase 3: fail-closed tenant defaults (geen stille Harelbeke-fallback).

-- 1) SuperAdmin: alleen sessies mét acting_organization_id (geen COALESCE → 1)
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
    us.acting_organization_id
  FROM public.user_sessions us
  WHERE us.session_id = p_session_token
    AND us.expires_at > now()
    AND us.user_id = -1
    AND us.acting_organization_id IS NOT NULL
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

COMMENT ON FUNCTION private.resolve_app_session(uuid) IS
  'Validates user_sessions token; SuperAdmin vereist acting_organization_id (geen default org 1).';

-- 2) SuperAdmin RLS helper: alleen acting org
CREATE OR REPLACE FUNCTION public.can_access_organization(p_organization_id integer)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
  v_user_org integer;
BEGIN
  IF p_organization_id IS NULL THEN
    RETURN false;
  END IF;

  v_role := NULLIF(current_setting('app.current_user_role', true), '');

  IF v_role IS NOT NULL AND v_role <> '' THEN
    v_user_org := NULLIF(current_setting('app.current_organization_id', true), '')::integer;
    RETURN v_user_org IS NOT NULL AND p_organization_id = v_user_org;
  END IF;

  RETURN false;
END;
$$;

COMMENT ON FUNCTION public.can_access_organization(integer) IS
  'Tenant-check via app.current_organization_id. SuperAdmin = acting org. Anon = false.';

-- 3) Publieke schedule RPC's: geen DEFAULT 1
DROP FUNCTION IF EXISTS public.get_public_matches(integer);
CREATE FUNCTION public.get_public_matches(p_organization_id integer)
RETURNS TABLE(
  match_id integer,
  unique_number text,
  match_date timestamptz,
  location text,
  speeldag text,
  home_team_id integer,
  away_team_id integer,
  home_score integer,
  away_score integer,
  home_position integer,
  away_position integer,
  referee text,
  is_submitted boolean,
  is_locked boolean,
  is_cup_match boolean,
  is_playoff_match boolean,
  is_playoff_finalized boolean,
  playoff_type text,
  home_team_name text,
  away_team_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    m.match_id,
    m.unique_number::text,
    m.match_date,
    m.location::text,
    m.speeldag::text,
    m.home_team_id,
    m.away_team_id,
    m.home_score,
    m.away_score,
    m.home_position,
    m.away_position,
    m.referee::text,
    m.is_submitted,
    m.is_locked,
    m.is_cup_match,
    m.is_playoff_match,
    m.is_playoff_finalized,
    m.playoff_type::text,
    ht.team_name::text AS home_team_name,
    at.team_name::text AS away_team_name
  FROM public.matches m
  LEFT JOIN public.teams ht ON ht.team_id = m.home_team_id
  LEFT JOIN public.teams at ON at.team_id = m.away_team_id
  WHERE p_organization_id IS NOT NULL
    AND m.organization_id = p_organization_id
  ORDER BY m.match_date ASC;
$$;

DROP FUNCTION IF EXISTS public.get_public_teams(integer);
CREATE FUNCTION public.get_public_teams(p_organization_id integer)
RETURNS TABLE(
  team_id integer,
  team_name text,
  club_colors text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    t.team_id,
    t.team_name::text,
    t.club_colors::text
  FROM public.teams t
  WHERE p_organization_id IS NOT NULL
    AND t.organization_id = p_organization_id
  ORDER BY t.team_name ASC;
$$;

REVOKE ALL ON FUNCTION public.get_public_matches(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_teams(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_matches(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_teams(integer) TO anon, authenticated;

-- 4) Settings: geen DEFAULT 1; behoud allowlist + blog visibility
DROP FUNCTION IF EXISTS public.get_public_application_settings(text[], integer);
CREATE FUNCTION public.get_public_application_settings(
  p_categories text[] DEFAULT NULL,
  p_organization_id integer DEFAULT NULL
)
RETURNS TABLE(
  id integer,
  setting_category text,
  setting_name text,
  setting_value jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    s.id,
    s.setting_category::text,
    s.setting_name::text,
    s.setting_value
  FROM public.application_settings s
  WHERE p_organization_id IS NOT NULL
    AND s.organization_id = p_organization_id
    AND s.setting_category = ANY(
      COALESCE(
        p_categories,
        ARRAY[
          'theme_colors',
          'tab_visibility',
          'season_data',
          'priority_order',
          'blog_posts',
          'player_list_lock',
          'match_form_settings',
          'season_archives',
          'referee_polls',
          'admin_notifications'
        ]::text[]
      )
    )
    AND s.setting_category <> 'security'
    AND (
      s.setting_category <> 'blog_posts'
      OR (
        COALESCE((s.setting_value->>'published')::boolean, false) = true
        AND (
          NULLIF(TRIM(s.setting_value->>'visible_from'), '') IS NULL
          OR (NULLIF(TRIM(s.setting_value->>'visible_from'), ''))::date <= CURRENT_DATE
        )
        AND (
          NULLIF(TRIM(s.setting_value->>'visible_until'), '') IS NULL
          OR (NULLIF(TRIM(s.setting_value->>'visible_until'), ''))::date >= CURRENT_DATE
        )
      )
    );
$$;

REVOKE ALL ON FUNCTION public.get_public_application_settings(text[], integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_application_settings(text[], integer) TO anon, authenticated;

-- 5) Player list lock: drop org-loze overload; integer-param zonder default
DROP FUNCTION IF EXISTS public.is_player_list_locked();
DROP FUNCTION IF EXISTS public.is_player_list_locked(integer);
CREATE FUNCTION public.is_player_list_locked(p_organization_id integer)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  lock_from date;
  lock_until date;
  is_enabled boolean;
  setting_data jsonb;
BEGIN
  IF p_organization_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT setting_value
  INTO setting_data
  FROM public.application_settings
  WHERE organization_id = p_organization_id
    AND setting_category = 'player_list_lock'
    AND setting_name = 'global_lock'
  LIMIT 1;

  IF setting_data IS NULL THEN
    RETURN false;
  END IF;

  is_enabled := COALESCE((setting_data->>'lock_enabled')::boolean, true);
  IF NOT is_enabled THEN
    RETURN false;
  END IF;

  lock_from := NULLIF(setting_data->>'lock_from_date', '')::date;
  lock_until := NULLIF(setting_data->>'lock_until_date', '')::date;

  IF lock_from IS NULL AND lock_until IS NULL THEN
    RETURN false;
  END IF;

  IF lock_from IS NOT NULL AND CURRENT_DATE < lock_from THEN
    RETURN false;
  END IF;

  IF lock_until IS NOT NULL AND CURRENT_DATE > lock_until THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.is_player_list_locked(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_player_list_locked(integer) TO anon, authenticated;
