-- Internal session RPCs: join public.teams directly (no teams_public dependency before view drop).

-- get_matches_for_forms
DROP FUNCTION IF EXISTS public.get_matches_for_forms(uuid, integer, boolean, text, integer, text);

CREATE OR REPLACE FUNCTION public.get_matches_for_forms(
  p_session_token uuid,
  p_team_id integer DEFAULT 0,
  p_has_elevated_permissions boolean DEFAULT false,
  p_competition_type text DEFAULT NULL,
  p_referee_user_id integer DEFAULT NULL,
  p_referee_username text DEFAULT NULL
)
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
  referee text,
  referee_notes text,
  is_submitted boolean,
  is_locked boolean,
  home_players jsonb,
  away_players jsonb,
  is_cup_match boolean,
  is_playoff_match boolean,
  assigned_referee_id integer,
  poll_group_id text,
  poll_month text,
  home_team_name text,
  away_team_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
  v_user_id integer;
  v_team_ids text;
  v_username text;
BEGIN
  IF p_session_token IS NULL THEN
    RETURN;
  END IF;

  SELECT us.user_id INTO v_user_id
  FROM public.user_sessions us
  WHERE us.session_id = p_session_token
    AND us.expires_at > now()
    AND us.user_id = -1
  LIMIT 1;

  IF FOUND THEN
    v_role := 'admin';
    v_username := 'SuperAdmin';
    v_team_ids := '';
  ELSE
    SELECT us.user_id, u.role::text, u.username::text
    INTO v_user_id, v_role, v_username
    FROM public.user_sessions us
    JOIN public.users u ON u.user_id = us.user_id
    WHERE us.session_id = p_session_token
      AND us.expires_at > now()
    LIMIT 1;

    IF NOT FOUND OR v_role IS NULL OR v_role = '' THEN
      RETURN;
    END IF;

    SELECT string_agg(tu.team_id::text, ',' ORDER BY tu.team_id) INTO v_team_ids
    FROM public.team_users tu
    WHERE tu.user_id = v_user_id;
  END IF;

  PERFORM public.apply_app_user_context(
    v_role,
    v_user_id,
    COALESCE(v_team_ids, ''),
    COALESCE(v_username, '')
  );

  RETURN QUERY
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
    m.referee::text,
    m.referee_notes::text,
    m.is_submitted,
    m.is_locked,
    m.home_players,
    m.away_players,
    m.is_cup_match,
    m.is_playoff_match,
    m.assigned_referee_id,
    m.poll_group_id::text,
    m.poll_month::text,
    ht.team_name::text AS home_team_name,
    at.team_name::text AS away_team_name
  FROM public.matches m
  LEFT JOIN public.teams ht ON ht.team_id = m.home_team_id
  LEFT JOIN public.teams at ON at.team_id = m.away_team_id
  WHERE (
    CASE
      WHEN p_referee_user_id IS NOT NULL THEN
        m.assigned_referee_id = p_referee_user_id
        OR m.referee = COALESCE(p_referee_username, '')
        OR m.referee IS NULL
      WHEN p_has_elevated_permissions AND v_role IN ('admin', 'referee') THEN true
      WHEN p_team_id > 0 THEN
        m.home_team_id = p_team_id OR m.away_team_id = p_team_id
      ELSE false
    END
  )
  AND (
    p_competition_type IS NULL
    OR (p_competition_type = 'cup' AND m.is_cup_match IS TRUE)
    OR (p_competition_type = 'playoff' AND m.is_playoff_match IS TRUE)
    OR (
      p_competition_type = 'league'
      AND COALESCE(m.is_cup_match, false) IS NOT TRUE
      AND COALESCE(m.is_playoff_match, false) IS NOT TRUE
    )
  )
  ORDER BY m.match_date ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_matches_for_forms(uuid, integer, boolean, text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_matches_for_forms(uuid, integer, boolean, text, integer, text) TO anon, authenticated;

-- get_scheids_schedule_for_session
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
  LEFT JOIN public.teams ht ON ht.team_id = m.home_team_id
  LEFT JOIN public.teams at ON at.team_id = m.away_team_id
  WHERE m.match_date >= (p_month || '-01')::timestamptz
    AND m.match_date < (v_next_month || '-01')::timestamptz
  ORDER BY m.match_date ASC;
END;
$$;

-- get_referee_assignments_for_session
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
    LEFT JOIN public.teams ht ON ht.team_id = m.home_team_id
    LEFT JOIN public.teams at ON at.team_id = m.away_team_id
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
  LEFT JOIN public.teams ht ON ht.team_id = m.home_team_id
  LEFT JOIN public.teams at ON at.team_id = m.away_team_id
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

-- get_team_costs_transactions (teams join only; session logic unchanged)
CREATE OR REPLACE FUNCTION public.get_team_costs_transactions(
  p_session_token uuid,
  p_team_id integer DEFAULT NULL
)
RETURNS TABLE(
  id integer,
  team_id integer,
  cost_setting_id integer,
  match_id integer,
  amount numeric,
  transaction_date timestamptz,
  cost_name text,
  cost_category text,
  cost_default_amount numeric,
  match_unique_number text,
  match_date timestamptz,
  home_team_id integer,
  away_team_id integer,
  home_team_name text,
  away_team_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_team_ids integer[];
  v_username text;
  v_team_ids_text text;
BEGIN
  IF p_session_token IS NULL THEN
    RETURN;
  END IF;

  SELECT r.user_id, r.role, r.team_ids
  INTO v_user_id, v_role, v_team_ids
  FROM public.resolve_session_for_costs(p_session_token) r
  LIMIT 1;

  IF v_role IS NULL OR v_role = '' THEN
    RETURN;
  END IF;

  IF v_user_id = -1 THEN
    v_username := 'SuperAdmin';
  ELSE
    SELECT u.username::text INTO v_username FROM public.users u WHERE u.user_id = v_user_id;
  END IF;
  v_team_ids_text := array_to_string(v_team_ids, ',');
  PERFORM public.apply_app_user_context(v_role, v_user_id, COALESCE(v_team_ids_text, ''), COALESCE(v_username, ''));

  IF v_role = 'player_manager' THEN
    IF p_team_id IS NOT NULL AND NOT (p_team_id = ANY(v_team_ids)) THEN
      RETURN;
    END IF;
  ELSIF v_role <> 'admin' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    tc.id,
    tc.team_id,
    tc.cost_setting_id,
    tc.match_id,
    tc.amount,
    tc.transaction_date,
    c.name::text,
    c.category::text,
    c.amount,
    m.unique_number::text,
    m.match_date,
    m.home_team_id,
    m.away_team_id,
    ht.team_name::text,
    at.team_name::text
  FROM public.team_costs tc
  JOIN public.costs c ON c.id = tc.cost_setting_id
  LEFT JOIN public.matches m ON m.match_id = tc.match_id
  LEFT JOIN public.teams ht ON ht.team_id = m.home_team_id
  LEFT JOIN public.teams at ON at.team_id = m.away_team_id
  WHERE (
    v_role = 'admin'
    AND (p_team_id IS NULL OR tc.team_id = p_team_id)
  ) OR (
    v_role = 'player_manager'
    AND tc.team_id = ANY(v_team_ids)
    AND (p_team_id IS NULL OR tc.team_id = p_team_id)
  )
  ORDER BY tc.transaction_date DESC, tc.id DESC;
END;
$$;
