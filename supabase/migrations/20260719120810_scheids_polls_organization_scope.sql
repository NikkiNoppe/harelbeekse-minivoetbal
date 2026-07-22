-- Scheids/poll session-RPC's: altijd scopen op organization_id uit sessie
-- (SuperAdmin = acting_organization_id). Geen user_id = -1 bypass.
-- Bodies in private.*; public.* blijven thin invoker wrappers
-- (behalve get_referees_for_session: public DEFINER → terug naar thin wrapper).

-- =============================================================================
-- 1. get_scheids_schedule_for_session
-- =============================================================================
CREATE OR REPLACE FUNCTION private.get_scheids_schedule_for_session(
  p_session_token uuid,
  p_month text
)
RETURNS TABLE(
  match_id integer,
  match_date timestamptz,
  location text,
  home_team_id integer,
  away_team_id integer,
  home_team_name text,
  away_team_name text,
  assigned_referee_id integer,
  poll_group_id text,
  referee text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_team_ids integer[];
  v_username text;
  v_org_id integer;
  v_year integer;
  v_month_num integer;
  v_next_month text;
BEGIN
  IF p_month IS NULL OR p_month !~ '^\d{4}-\d{2}$' THEN
    RETURN;
  END IF;

  SELECT s.user_id, s.role, s.team_ids, s.username, s.organization_id
  INTO v_user_id, v_role, v_team_ids, v_username, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_org_id IS NULL OR v_role NOT IN ('admin', 'referee') THEN
    RETURN;
  END IF;

  v_year := split_part(p_month, '-', 1)::integer;
  v_month_num := split_part(p_month, '-', 2)::integer;
  v_next_month := CASE
    WHEN v_month_num = 12 THEN (v_year + 1)::text || '-01'
    ELSE v_year::text || '-' || lpad((v_month_num + 1)::text, 2, '0')
  END;

  RETURN QUERY
  SELECT
    m.match_id,
    m.match_date,
    m.location::text,
    m.home_team_id,
    m.away_team_id,
    ht.team_name::text,
    at.team_name::text,
    m.assigned_referee_id,
    m.poll_group_id::text,
    m.referee::text
  FROM public.matches m
  LEFT JOIN public.teams ht ON ht.team_id = m.home_team_id
  LEFT JOIN public.teams at ON at.team_id = m.away_team_id
  WHERE m.organization_id = v_org_id
    AND m.match_date >= (p_month || '-01')::timestamptz
    AND m.match_date < (v_next_month || '-01')::timestamptz
  ORDER BY m.match_date ASC;
END;
$$;

-- =============================================================================
-- 2. get_referees_for_session (private + public thin wrapper)
-- =============================================================================
CREATE OR REPLACE FUNCTION private.get_referees_for_session(
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
  v_team_ids integer[];
  v_username text;
  v_org_id integer;
BEGIN
  SELECT s.user_id, s.role, s.team_ids, s.username, s.organization_id
  INTO v_user_id, v_role, v_team_ids, v_username, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_org_id IS NULL OR v_role NOT IN ('admin', 'referee') THEN
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

-- public was SECURITY DEFINER (ensure_super_admin) with SuperAdmin all-org bypass;
-- restore thin invoker wrapper → private.
CREATE OR REPLACE FUNCTION public.get_referees_for_session(
  p_session_token uuid,
  p_user_id integer DEFAULT NULL
)
RETURNS TABLE(user_id integer, username text)
LANGUAGE sql
SET search_path TO 'public', 'private'
AS $$
  SELECT * FROM private.get_referees_for_session($1, $2);
$$;

REVOKE ALL ON FUNCTION public.get_referees_for_session(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_referees_for_session(uuid, integer) TO anon, authenticated;

-- =============================================================================
-- 3. get_referee_assignments_for_session
-- =============================================================================
CREATE OR REPLACE FUNCTION private.get_referee_assignments_for_session(
  p_session_token uuid,
  p_month text DEFAULT NULL
)
RETURNS TABLE(
  id bigint,
  match_id integer,
  referee_id integer,
  assigned_by integer,
  assigned_at timestamptz,
  match_date timestamptz,
  location text,
  home_team_name text,
  away_team_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_team_ids integer[];
  v_username text;
  v_org_id integer;
BEGIN
  SELECT s.user_id, s.role, s.team_ids, s.username, s.organization_id
  INTO v_user_id, v_role, v_team_ids, v_username, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_org_id IS NULL THEN
    RETURN;
  END IF;

  IF v_role = 'referee' THEN
    RETURN QUERY
    SELECT
      rm.id,
      rm.match_id,
      rm.referee_id,
      rm.assigned_by,
      rm.assigned_at,
      m.match_date,
      m.location::text,
      ht.team_name::text,
      at.team_name::text
    FROM public.referee_matches rm
    JOIN public.matches m ON m.match_id = rm.match_id
    LEFT JOIN public.teams ht ON ht.team_id = m.home_team_id
    LEFT JOIN public.teams at ON at.team_id = m.away_team_id
    WHERE rm.referee_id = v_user_id
      AND rm.assigned_at IS NOT NULL
      AND m.organization_id = v_org_id
      AND rm.organization_id = v_org_id
      AND (
        p_month IS NULL
        OR (
          m.match_date >= (p_month || '-01')::timestamptz
          AND m.match_date < (
            CASE
              WHEN split_part(p_month, '-', 2)::integer = 12 THEN
                (split_part(p_month, '-', 1)::integer + 1)::text || '-01'
              ELSE
                split_part(p_month, '-', 1) || '-' ||
                lpad((split_part(p_month, '-', 2)::integer + 1)::text, 2, '0')
            END || '-01'
          )::timestamptz
        )
      )
    ORDER BY rm.assigned_at DESC;
    RETURN;
  END IF;

  IF v_role <> 'admin' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    rm.id,
    rm.match_id,
    rm.referee_id,
    rm.assigned_by,
    rm.assigned_at,
    m.match_date,
    m.location::text,
    ht.team_name::text,
    at.team_name::text
  FROM public.referee_matches rm
  JOIN public.matches m ON m.match_id = rm.match_id
  LEFT JOIN public.teams ht ON ht.team_id = m.home_team_id
  LEFT JOIN public.teams at ON at.team_id = m.away_team_id
  WHERE rm.assigned_at IS NOT NULL
    AND m.organization_id = v_org_id
    AND rm.organization_id = v_org_id
    AND (
      p_month IS NULL
      OR (
        m.match_date >= (p_month || '-01')::timestamptz
        AND m.match_date < (
          CASE
            WHEN split_part(p_month, '-', 2)::integer = 12 THEN
              (split_part(p_month, '-', 1)::integer + 1)::text || '-01'
            ELSE
              split_part(p_month, '-', 1) || '-' ||
              lpad((split_part(p_month, '-', 2)::integer + 1)::text, 2, '0')
          END || '-01'
        )::timestamptz
      )
    )
  ORDER BY rm.assigned_at DESC;
END;
$$;

-- =============================================================================
-- 4. get_referee_availability_for_session
-- =============================================================================
CREATE OR REPLACE FUNCTION private.get_referee_availability_for_session(
  p_session_token uuid,
  p_poll_month text
)
RETURNS TABLE(
  user_id integer,
  match_id integer,
  poll_group_id text,
  is_available boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_team_ids integer[];
  v_username text;
  v_org_id integer;
BEGIN
  IF p_poll_month IS NULL THEN
    RETURN;
  END IF;

  SELECT s.user_id, s.role, s.team_ids, s.username, s.organization_id
  INTO v_user_id, v_role, v_team_ids, v_username, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_org_id IS NULL THEN
    RETURN;
  END IF;

  IF v_role = 'admin' THEN
    RETURN QUERY
    SELECT
      rm.referee_id,
      rm.match_id,
      rm.poll_group_id::text,
      rm.is_available
    FROM public.referee_matches rm
    WHERE rm.poll_month = p_poll_month
      AND rm.organization_id = v_org_id
      AND rm.is_available IS NOT NULL;
    RETURN;
  END IF;

  IF v_role = 'referee' THEN
    RETURN QUERY
    SELECT
      rm.referee_id,
      rm.match_id,
      rm.poll_group_id::text,
      rm.is_available
    FROM public.referee_matches rm
    WHERE rm.poll_month = p_poll_month
      AND rm.organization_id = v_org_id
      AND rm.referee_id = v_user_id
      AND rm.is_available IS NOT NULL;
  END IF;
END;
$$;

-- =============================================================================
-- 5. get_available_referees_for_match
-- =============================================================================
CREATE OR REPLACE FUNCTION private.get_available_referees_for_match(
  p_session_token uuid,
  p_match_id integer
)
RETURNS TABLE(
  user_id integer,
  username text,
  is_available boolean,
  has_conflict boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_team_ids integer[];
  v_username text;
  v_org_id integer;
  v_match_date date;
  v_poll_month text;
BEGIN
  SELECT s.user_id, s.role, s.team_ids, s.username, s.organization_id
  INTO v_user_id, v_role, v_team_ids, v_username, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL OR p_match_id IS NULL THEN
    RETURN;
  END IF;

  SELECT DATE(m.match_date), to_char(m.match_date, 'YYYY-MM')
  INTO v_match_date, v_poll_month
  FROM public.matches m
  WHERE m.match_id = p_match_id
    AND m.organization_id = v_org_id;

  IF v_match_date IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    u.user_id,
    u.username::text,
    COALESCE(rm.is_available, false),
    public.check_referee_conflict(u.user_id, p_match_id)
  FROM public.users u
  LEFT JOIN public.referee_matches rm ON (
    rm.referee_id = u.user_id
    AND rm.organization_id = v_org_id
    AND (
      rm.match_id = p_match_id
      OR (rm.match_id IS NULL AND rm.poll_month = v_poll_month)
    )
  )
  WHERE u.role::text = 'referee'
    AND u.organization_id = v_org_id
  ORDER BY u.username::text;
END;
$$;

-- =============================================================================
-- 6. get_scheids_assignment_stats_for_session
-- =============================================================================
CREATE OR REPLACE FUNCTION private.get_scheids_assignment_stats_for_session(
  p_session_token uuid,
  p_month text DEFAULT NULL
)
RETURNS TABLE(
  referee_id integer,
  referee_name text,
  total_assignments integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_team_ids integer[];
  v_username text;
  v_org_id integer;
BEGIN
  SELECT s.user_id, s.role, s.team_ids, s.username, s.organization_id
  INTO v_user_id, v_role, v_team_ids, v_username, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    u.user_id,
    u.username::text,
    COUNT(rm.id)::integer
  FROM public.users u
  LEFT JOIN public.referee_matches rm
    ON rm.referee_id = u.user_id
    AND rm.assigned_at IS NOT NULL
    AND rm.organization_id = v_org_id
  LEFT JOIN public.matches m
    ON m.match_id = rm.match_id
    AND m.organization_id = v_org_id
  WHERE u.role::text = 'referee'
    AND u.organization_id = v_org_id
    AND (
      p_month IS NULL
      OR m.match_id IS NULL
      OR (
        m.match_date >= (p_month || '-01')::timestamptz
        AND m.match_date < (
          CASE
            WHEN split_part(p_month, '-', 2)::integer = 12 THEN
              (split_part(p_month, '-', 1)::integer + 1)::text || '-01'
            ELSE
              split_part(p_month, '-', 1) || '-' ||
              lpad((split_part(p_month, '-', 2)::integer + 1)::text, 2, '0')
          END || '-01'
        )::timestamptz
      )
    )
  GROUP BY u.user_id, u.username::text
  ORDER BY u.username::text;
END;
$$;

-- =============================================================================
-- 7. get_scheids_availability_stats_for_session
-- =============================================================================
CREATE OR REPLACE FUNCTION private.get_scheids_availability_stats_for_session(
  p_session_token uuid,
  p_poll_month text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_team_ids integer[];
  v_username text;
  v_org_id integer;
  v_total_referees integer;
  v_responded_count integer;
  v_available_by_date jsonb;
BEGIN
  SELECT s.user_id, s.role, s.team_ids, s.username, s.organization_id
  INTO v_user_id, v_role, v_team_ids, v_username, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL OR p_poll_month IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*)::integer INTO v_total_referees
  FROM public.users u
  WHERE u.role::text = 'referee'
    AND u.organization_id = v_org_id;

  SELECT COUNT(DISTINCT rm.referee_id)::integer INTO v_responded_count
  FROM public.referee_matches rm
  WHERE rm.poll_month = p_poll_month
    AND rm.organization_id = v_org_id
    AND rm.is_available IS NOT NULL;

  SELECT COALESCE(
    jsonb_object_agg(sub.poll_group_id, sub.cnt),
    '{}'::jsonb
  ) INTO v_available_by_date
  FROM (
    SELECT rm.poll_group_id::text, COUNT(*)::integer AS cnt
    FROM public.referee_matches rm
    WHERE rm.poll_month = p_poll_month
      AND rm.organization_id = v_org_id
      AND rm.is_available IS TRUE
      AND rm.poll_group_id IS NOT NULL
    GROUP BY rm.poll_group_id
  ) sub;

  RETURN jsonb_build_object(
    'total_referees', v_total_referees,
    'responded_count', v_responded_count,
    'available_by_date', COALESCE(v_available_by_date, '{}'::jsonb)
  );
END;
$$;

-- =============================================================================
-- 8. get_scheids_poll_overview_for_session
--    monthly_polls kan ontbreken op remote → NULL i.p.v. runtime-fout
-- =============================================================================
CREATE OR REPLACE FUNCTION private.get_scheids_poll_overview_for_session(
  p_session_token uuid,
  p_poll_id integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_team_ids integer[];
  v_username text;
  v_org_id integer;
  v_poll record;
  v_match_dates_count integer;
  v_referees_responded integer;
  v_referees_total integer;
  v_matches_assigned integer;
  v_matches_total integer;
  v_next_month text;
  v_year integer;
  v_month_num integer;
  v_has_org_col boolean;
BEGIN
  SELECT s.user_id, s.role, s.team_ids, s.username, s.organization_id
  INTO v_user_id, v_role, v_team_ids, v_username, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL OR p_poll_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF to_regclass('public.monthly_polls') IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'monthly_polls'
      AND column_name = 'organization_id'
  ) INTO v_has_org_col;

  IF v_has_org_col THEN
    EXECUTE
      'SELECT * FROM public.monthly_polls WHERE id = $1 AND organization_id = $2'
      INTO v_poll
      USING p_poll_id, v_org_id;
  ELSE
    EXECUTE
      'SELECT * FROM public.monthly_polls WHERE id = $1'
      INTO v_poll
      USING p_poll_id;
  END IF;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF to_regclass('public.poll_match_dates') IS NOT NULL THEN
    SELECT COUNT(*)::integer INTO v_match_dates_count
    FROM public.poll_match_dates pmd
    WHERE pmd.poll_id = p_poll_id;
  ELSE
    v_match_dates_count := 0;
  END IF;

  SELECT COUNT(DISTINCT rm.referee_id)::integer INTO v_referees_responded
  FROM public.referee_matches rm
  WHERE rm.poll_month = v_poll.poll_month
    AND rm.organization_id = v_org_id
    AND rm.is_available IS NOT NULL;

  SELECT COUNT(*)::integer INTO v_referees_total
  FROM public.users u
  WHERE u.role::text = 'referee'
    AND u.organization_id = v_org_id;

  SELECT COUNT(*)::integer INTO v_matches_assigned
  FROM public.referee_matches rm
  WHERE rm.poll_month = v_poll.poll_month
    AND rm.organization_id = v_org_id
    AND rm.assigned_at IS NOT NULL;

  v_year := split_part(v_poll.poll_month, '-', 1)::integer;
  v_month_num := split_part(v_poll.poll_month, '-', 2)::integer;
  v_next_month := CASE
    WHEN v_month_num = 12 THEN (v_year + 1)::text || '-01'
    ELSE v_year::text || '-' || lpad((v_month_num + 1)::text, 2, '0')
  END;

  SELECT COUNT(*)::integer INTO v_matches_total
  FROM public.matches m
  WHERE m.organization_id = v_org_id
    AND m.match_date >= (v_poll.poll_month || '-01')::timestamptz
    AND m.match_date < (v_next_month || '-01')::timestamptz;

  RETURN jsonb_build_object(
    'poll_id', v_poll.id,
    'poll_month', v_poll.poll_month,
    'deadline', v_poll.deadline,
    'status', v_poll.status,
    'created_by', v_poll.created_by,
    'created_at', v_poll.created_at,
    'updated_at', v_poll.updated_at,
    'notes', v_poll.notes,
    'match_dates_count', v_match_dates_count,
    'referees_responded', v_referees_responded,
    'referees_total', v_referees_total,
    'matches_assigned', v_matches_assigned,
    'matches_total', v_matches_total
  );
END;
$$;

-- =============================================================================
-- 9. get_scheids_workload_stats_for_session
-- =============================================================================
CREATE OR REPLACE FUNCTION private.get_scheids_workload_stats_for_session(
  p_session_token uuid,
  p_poll_month text
)
RETURNS TABLE(referee_id integer, month_count integer, season_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_team_ids integer[];
  v_username text;
  v_org_id integer;
  v_year integer;
  v_month_num integer;
  v_season_start text;
  v_season_end text;
BEGIN
  SELECT s.user_id, s.role, s.team_ids, s.username, s.organization_id
  INTO v_user_id, v_role, v_team_ids, v_username, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL OR p_poll_month IS NULL THEN
    RETURN;
  END IF;

  v_year := split_part(p_poll_month, '-', 1)::integer;
  v_month_num := split_part(p_poll_month, '-', 2)::integer;
  v_season_start := CASE
    WHEN v_month_num >= 8 THEN v_year::text || '-08-01'
    ELSE (v_year - 1)::text || '-08-01'
  END;
  v_season_end := CASE
    WHEN v_month_num >= 8 THEN (v_year + 1)::text || '-08-01'
    ELSE v_year::text || '-08-01'
  END;

  RETURN QUERY
  SELECT
    rm.referee_id,
    COUNT(*) FILTER (
      WHERE to_char(m.match_date, 'YYYY-MM') = p_poll_month
    )::integer,
    COUNT(*) FILTER (
      WHERE m.match_date >= v_season_start::timestamptz
        AND m.match_date < v_season_end::timestamptz
    )::integer
  FROM public.referee_matches rm
  JOIN public.matches m ON m.match_id = rm.match_id
  WHERE rm.assigned_at IS NOT NULL
    AND m.organization_id = v_org_id
    AND rm.organization_id = v_org_id
  GROUP BY rm.referee_id;
END;
$$;

-- =============================================================================
-- 10. get_monthly_polls_for_session
--     Tabel ontbreekt op remote → lege resultset (geen runtime-fout)
-- =============================================================================
CREATE OR REPLACE FUNCTION private.get_monthly_polls_for_session(
  p_session_token uuid
)
RETURNS TABLE(
  id integer,
  poll_month text,
  deadline timestamptz,
  status text,
  created_by integer,
  created_at timestamptz,
  updated_at timestamptz,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_team_ids integer[];
  v_username text;
  v_org_id integer;
  v_has_org_col boolean;
BEGIN
  SELECT s.user_id, s.role, s.team_ids, s.username, s.organization_id
  INTO v_user_id, v_role, v_team_ids, v_username, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL THEN
    RETURN;
  END IF;

  IF to_regclass('public.monthly_polls') IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'monthly_polls'
      AND column_name = 'organization_id'
  ) INTO v_has_org_col;

  IF v_has_org_col THEN
    RETURN QUERY EXECUTE
      $q$
      SELECT
        mp.id,
        mp.poll_month::text,
        mp.deadline,
        mp.status::text,
        mp.created_by,
        mp.created_at,
        mp.updated_at,
        mp.notes::text
      FROM public.monthly_polls mp
      WHERE mp.organization_id = $1
      ORDER BY mp.poll_month DESC
      $q$
      USING v_org_id;
  ELSE
    -- Legacy tabel zonder organization_id: geen cross-tenant filter mogelijk.
    RETURN QUERY EXECUTE
      $q$
      SELECT
        mp.id,
        mp.poll_month::text,
        mp.deadline,
        mp.status::text,
        mp.created_by,
        mp.created_at,
        mp.updated_at,
        mp.notes::text
      FROM public.monthly_polls mp
      ORDER BY mp.poll_month DESC
      $q$;
  END IF;
END;
$$;

-- =============================================================================
-- 11. get_poll_match_dates_for_session
--     Ontbrekende poll-tabellen → fallback op matches van actieve org
-- =============================================================================
CREATE OR REPLACE FUNCTION private.get_poll_match_dates_for_session(
  p_session_token uuid,
  p_poll_month text
)
RETURNS TABLE(match_date date, location text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_team_ids integer[];
  v_username text;
  v_org_id integer;
  v_poll_id integer;
  v_has_org_col boolean;
BEGIN
  SELECT s.user_id, s.role, s.team_ids, s.username, s.organization_id
  INTO v_user_id, v_role, v_team_ids, v_username, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL THEN
    RETURN;
  END IF;

  IF to_regclass('public.monthly_polls') IS NULL
     OR to_regclass('public.poll_match_dates') IS NULL THEN
    -- Fallback: unieke speeldagen/locaties uit wedstrijden van deze org
    RETURN QUERY
    SELECT DISTINCT DATE(m.match_date), m.location::text
    FROM public.matches m
    WHERE m.organization_id = v_org_id
      AND to_char(m.match_date, 'YYYY-MM') = p_poll_month
    ORDER BY 1, 2;
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'monthly_polls'
      AND column_name = 'organization_id'
  ) INTO v_has_org_col;

  IF v_has_org_col THEN
    EXECUTE
      'SELECT mp.id FROM public.monthly_polls mp WHERE mp.poll_month = $1 AND mp.organization_id = $2 LIMIT 1'
      INTO v_poll_id
      USING p_poll_month, v_org_id;
  ELSE
    EXECUTE
      'SELECT mp.id FROM public.monthly_polls mp WHERE mp.poll_month = $1 LIMIT 1'
      INTO v_poll_id
      USING p_poll_month;
  END IF;

  IF v_poll_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT pmd.match_date::date, pmd.location::text
  FROM public.poll_match_dates pmd
  WHERE pmd.poll_id = v_poll_id;
END;
$$;

-- =============================================================================
-- 12. assign_referee_to_match
-- =============================================================================
CREATE OR REPLACE FUNCTION private.assign_referee_to_match(
  p_session_token uuid,
  p_match_id integer,
  p_referee_id integer,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_team_ids integer[];
  v_username text;
  v_org_id integer;
  v_has_conflict boolean;
  v_assignment_id bigint;
  v_referee_username text;
  v_poll_month text;
BEGIN
  SELECT s.user_id, s.role, s.team_ids, s.username, s.organization_id
  INTO v_user_id, v_role, v_team_ids, v_username, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen scheidsrechters toewijzen');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.match_id = p_match_id AND m.organization_id = v_org_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wedstrijd niet gevonden');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.user_id = p_referee_id
      AND u.role::text = 'referee'
      AND u.organization_id = v_org_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Scheidsrechter niet gevonden');
  END IF;

  v_has_conflict := public.check_referee_conflict(p_referee_id, p_match_id);
  IF v_has_conflict THEN
    RETURN jsonb_build_object('success', false, 'error', 'Scheidsrechter is al toegewezen aan een andere wedstrijd op deze dag');
  END IF;

  SELECT to_char(match_date, 'YYYY-MM') INTO v_poll_month
  FROM public.matches
  WHERE match_id = p_match_id
    AND organization_id = v_org_id;

  INSERT INTO public.referee_matches (
    referee_id, match_id, assigned_by, assigned_at, poll_month, organization_id
  )
  VALUES (p_referee_id, p_match_id, v_user_id, now(), v_poll_month, v_org_id)
  ON CONFLICT (referee_id, match_id) WHERE match_id IS NOT NULL
  DO UPDATE SET
    assigned_by = EXCLUDED.assigned_by,
    assigned_at = EXCLUDED.assigned_at,
    organization_id = EXCLUDED.organization_id
  RETURNING id INTO v_assignment_id;

  SELECT u.username::text INTO v_referee_username
  FROM public.users u
  WHERE u.user_id = p_referee_id
    AND u.organization_id = v_org_id;

  IF v_referee_username IS NOT NULL THEN
    UPDATE public.matches
    SET assigned_referee_id = p_referee_id, referee = v_referee_username
    WHERE match_id = p_match_id
      AND organization_id = v_org_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'assignment_id', v_assignment_id,
    'message', 'Scheidsrechter succesvol toegewezen'
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wedstrijd heeft al een scheidsrechter toegewezen');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Onverwachte fout: ' || SQLERRM);
END;
$$;

-- =============================================================================
-- 13. assign_referee_to_session
-- =============================================================================
CREATE OR REPLACE FUNCTION private.assign_referee_to_session(
  p_session_token uuid,
  p_match_id integer,
  p_referee_id integer,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_team_ids integer[];
  v_username text;
  v_org_id integer;
  v_match_date date;
  v_match_location text;
  v_has_conflict boolean;
  v_referee_username text;
  v_session_match record;
  v_assignment_count integer := 0;
  v_poll_month text;
BEGIN
  SELECT s.user_id, s.role, s.team_ids, s.username, s.organization_id
  INTO v_user_id, v_role, v_team_ids, v_username, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen scheidsrechters toewijzen');
  END IF;

  SELECT DATE(match_date), COALESCE(location, ''), to_char(match_date, 'YYYY-MM')
  INTO v_match_date, v_match_location, v_poll_month
  FROM public.matches
  WHERE match_id = p_match_id
    AND organization_id = v_org_id;

  IF v_match_date IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wedstrijd niet gevonden');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.user_id = p_referee_id
      AND u.role::text = 'referee'
      AND u.organization_id = v_org_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Scheidsrechter niet gevonden');
  END IF;

  v_has_conflict := public.check_referee_conflict(p_referee_id, p_match_id);
  IF v_has_conflict THEN
    RETURN jsonb_build_object('success', false, 'error', 'Scheidsrechter is al toegewezen op een andere locatie op deze dag');
  END IF;

  SELECT u.username::text INTO v_referee_username
  FROM public.users u
  WHERE u.user_id = p_referee_id
    AND u.organization_id = v_org_id;

  FOR v_session_match IN
    SELECT m.match_id
    FROM public.matches m
    WHERE DATE(m.match_date) = v_match_date
      AND COALESCE(m.location, '') = v_match_location
      AND m.organization_id = v_org_id
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.referee_matches rm
      WHERE rm.match_id = v_session_match.match_id
        AND rm.organization_id = v_org_id
        AND rm.assigned_at IS NOT NULL
    ) THEN
      INSERT INTO public.referee_matches (
        referee_id, match_id, assigned_by, assigned_at, poll_month, organization_id
      )
      VALUES (p_referee_id, v_session_match.match_id, v_user_id, now(), v_poll_month, v_org_id)
      ON CONFLICT (referee_id, match_id) WHERE match_id IS NOT NULL
      DO UPDATE SET
        assigned_by = EXCLUDED.assigned_by,
        assigned_at = EXCLUDED.assigned_at,
        organization_id = EXCLUDED.organization_id;

      UPDATE public.matches
      SET assigned_referee_id = p_referee_id, referee = v_referee_username
      WHERE match_id = v_session_match.match_id
        AND organization_id = v_org_id;

      v_assignment_count := v_assignment_count + 1;
    END IF;
  END LOOP;

  IF v_assignment_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alle wedstrijden in deze sessie zijn al toegewezen');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'assignments_created', v_assignment_count,
    'message', format('Scheidsrechter toegewezen aan %s wedstrijd(en)', v_assignment_count)
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wedstrijd heeft al een scheidsrechter toegewezen');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Onverwachte fout: ' || SQLERRM);
END;
$$;

COMMENT ON FUNCTION private.get_referees_for_session(uuid, integer) IS
  'Scheidsrechters van actieve organization_id (geen SuperAdmin all-org bypass).';
COMMENT ON FUNCTION private.get_scheids_schedule_for_session(uuid, text) IS
  'Scheidsrooster gescoped op matches.organization_id uit sessie.';
COMMENT ON FUNCTION private.assign_referee_to_match(uuid, integer, integer, text) IS
  'Wijs scheids toe; match + referee moeten tot actieve organization_id behoren.';
