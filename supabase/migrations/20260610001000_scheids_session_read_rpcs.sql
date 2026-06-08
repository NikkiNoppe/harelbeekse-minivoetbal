-- Scheidsrechter read RPCs: session token required, no referees_public.

-- ---------------------------------------------------------------------------
-- get_referees_for_session
-- ---------------------------------------------------------------------------
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
  v_role text;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role NOT IN ('admin', 'referee') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT u.user_id, u.username::text
  FROM public.users u
  WHERE u.role::text = 'referee'
    AND (p_user_id IS NULL OR u.user_id = p_user_id)
  ORDER BY u.username::text;
END;
$$;

REVOKE ALL ON FUNCTION public.get_referees_for_session(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_referees_for_session(uuid, integer) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_scheids_schedule_for_session
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_scheids_schedule_for_session(
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
  assigned_referee_id integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_year integer;
  v_month_num integer;
  v_next_month text;
BEGIN
  IF p_month IS NULL OR p_month !~ '^\d{4}-\d{2}$' THEN
    RETURN;
  END IF;

  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role NOT IN ('admin', 'referee') THEN
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
    m.assigned_referee_id
  FROM public.matches m
  LEFT JOIN public.teams_public ht ON ht.team_id = m.home_team_id
  LEFT JOIN public.teams_public at ON at.team_id = m.away_team_id
  WHERE m.match_date >= (p_month || '-01')::timestamptz
    AND m.match_date < (v_next_month || '-01')::timestamptz
  ORDER BY m.match_date ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_scheids_schedule_for_session(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_scheids_schedule_for_session(uuid, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_referee_assignments_for_session
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_referee_assignments_for_session(
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
  v_role text;
  v_user_id integer;
  v_year integer;
  v_month_num integer;
  v_next_month text;
BEGIN
  SELECT s.user_id, s.role INTO v_user_id, v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL THEN
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
    LEFT JOIN public.teams_public ht ON ht.team_id = m.home_team_id
    LEFT JOIN public.teams_public at ON at.team_id = m.away_team_id
    WHERE rm.referee_id = v_user_id
      AND rm.assigned_at IS NOT NULL
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
  LEFT JOIN public.teams_public ht ON ht.team_id = m.home_team_id
  LEFT JOIN public.teams_public at ON at.team_id = m.away_team_id
  WHERE rm.assigned_at IS NOT NULL
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

REVOKE ALL ON FUNCTION public.get_referee_assignments_for_session(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_referee_assignments_for_session(uuid, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_referee_availability_for_session
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_referee_availability_for_session(
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
  v_role text;
  v_user_id integer;
BEGIN
  IF p_poll_month IS NULL THEN
    RETURN;
  END IF;

  SELECT s.user_id, s.role INTO v_user_id, v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL THEN
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
      AND rm.referee_id = v_user_id
      AND rm.is_available IS NOT NULL;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_referee_availability_for_session(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_referee_availability_for_session(uuid, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_available_referees_for_match (session-gated, admin only)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_available_referees_for_match(integer);

CREATE OR REPLACE FUNCTION public.get_available_referees_for_match(
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
  v_role text;
  v_match_date date;
  v_poll_month text;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR p_match_id IS NULL THEN
    RETURN;
  END IF;

  SELECT DATE(m.match_date), to_char(m.match_date, 'YYYY-MM')
  INTO v_match_date, v_poll_month
  FROM public.matches m
  WHERE m.match_id = p_match_id;

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
    AND (
      rm.match_id = p_match_id
      OR (rm.match_id IS NULL AND rm.poll_month = v_poll_month)
    )
  )
  WHERE u.role::text = 'referee'
  ORDER BY u.username::text;
END;
$$;

REVOKE ALL ON FUNCTION public.get_available_referees_for_match(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_available_referees_for_match(uuid, integer) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_scheids_assignment_stats_for_session
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_scheids_assignment_stats_for_session(
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
  v_role text;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    u.user_id,
    u.username::text,
    COUNT(rm.id)::integer
  FROM public.users u
  LEFT JOIN public.referee_matches rm ON rm.referee_id = u.user_id AND rm.assigned_at IS NOT NULL
  LEFT JOIN public.matches m ON m.match_id = rm.match_id
  WHERE u.role::text = 'referee'
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

REVOKE ALL ON FUNCTION public.get_scheids_assignment_stats_for_session(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_scheids_assignment_stats_for_session(uuid, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_scheids_availability_stats_for_session
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_scheids_availability_stats_for_session(
  p_session_token uuid,
  p_poll_month text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_total_referees integer;
  v_responded_count integer;
  v_available_by_date jsonb;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR p_poll_month IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*)::integer INTO v_total_referees
  FROM public.users u
  WHERE u.role::text = 'referee';

  SELECT COUNT(DISTINCT rm.referee_id)::integer INTO v_responded_count
  FROM public.referee_matches rm
  WHERE rm.poll_month = p_poll_month
    AND rm.is_available IS NOT NULL;

  SELECT COALESCE(
    jsonb_object_agg(sub.poll_group_id, sub.cnt),
    '{}'::jsonb
  ) INTO v_available_by_date
  FROM (
    SELECT rm.poll_group_id::text, COUNT(*)::integer AS cnt
    FROM public.referee_matches rm
    WHERE rm.poll_month = p_poll_month
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

REVOKE ALL ON FUNCTION public.get_scheids_availability_stats_for_session(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_scheids_availability_stats_for_session(uuid, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_scheids_poll_overview_for_session
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_scheids_poll_overview_for_session(
  p_session_token uuid,
  p_poll_id integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_poll record;
  v_match_dates_count integer;
  v_referees_responded integer;
  v_referees_total integer;
  v_matches_assigned integer;
  v_matches_total integer;
  v_next_month text;
  v_year integer;
  v_month_num integer;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR p_poll_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_poll FROM public.monthly_polls WHERE id = p_poll_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*)::integer INTO v_match_dates_count
  FROM public.poll_match_dates pmd
  WHERE pmd.poll_id = p_poll_id;

  SELECT COUNT(DISTINCT rm.referee_id)::integer INTO v_referees_responded
  FROM public.referee_matches rm
  WHERE rm.poll_month = v_poll.poll_month
    AND rm.is_available IS NOT NULL;

  SELECT COUNT(*)::integer INTO v_referees_total
  FROM public.users u
  WHERE u.role::text = 'referee';

  SELECT COUNT(*)::integer INTO v_matches_assigned
  FROM public.referee_matches rm
  WHERE rm.poll_month = v_poll.poll_month
    AND rm.assigned_at IS NOT NULL;

  v_year := split_part(v_poll.poll_month, '-', 1)::integer;
  v_month_num := split_part(v_poll.poll_month, '-', 2)::integer;
  v_next_month := CASE
    WHEN v_month_num = 12 THEN (v_year + 1)::text || '-01'
    ELSE v_year::text || '-' || lpad((v_month_num + 1)::text, 2, '0')
  END;

  SELECT COUNT(*)::integer INTO v_matches_total
  FROM public.matches m
  WHERE m.match_date >= (v_poll.poll_month || '-01')::timestamptz
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

REVOKE ALL ON FUNCTION public.get_scheids_poll_overview_for_session(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_scheids_poll_overview_for_session(uuid, integer) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_scheids_workload_stats_for_session (auto-suggest)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_scheids_workload_stats_for_session(
  p_session_token uuid,
  p_poll_month text
)
RETURNS TABLE(referee_id integer, month_count integer, season_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_year integer;
  v_month_num integer;
  v_season_start text;
  v_season_end text;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS DISTINCT FROM 'admin' OR p_poll_month IS NULL THEN
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
  GROUP BY rm.referee_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_scheids_workload_stats_for_session(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_scheids_workload_stats_for_session(uuid, text) TO anon, authenticated;
