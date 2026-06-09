-- Session-RPC expansion for Security Advisor hardening (phases B–D).

-- =============================================================================
-- manage_application_settings_for_session
-- =============================================================================
CREATE OR REPLACE FUNCTION public.manage_application_settings_for_session(
  p_session_token uuid,
  p_operation text,
  p_category text DEFAULT NULL,
  p_id integer DEFAULT NULL,
  p_setting_name text DEFAULT NULL,
  p_setting_value jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_new_id integer;
  v_rows integer;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role <> 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins');
  END IF;

  IF p_operation = 'list' THEN
    RETURN (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'setting_category', a.setting_category,
          'setting_name', a.setting_name,
          'setting_value', a.setting_value,
          'updated_at', a.updated_at
        ) ORDER BY a.id DESC
      ), '[]'::jsonb)
      FROM public.application_settings a
      WHERE p_category IS NULL OR a.setting_category = p_category
    );
  ELSIF p_operation = 'insert' THEN
    INSERT INTO public.application_settings (setting_category, setting_name, setting_value, updated_at)
    VALUES (p_category, p_setting_name, p_setting_value, now())
    RETURNING id INTO v_new_id;
    RETURN jsonb_build_object('success', true, 'id', v_new_id);
  ELSIF p_operation = 'update' THEN
    UPDATE public.application_settings
    SET
      setting_value = COALESCE(p_setting_value, setting_value),
      setting_name = COALESCE(p_setting_name, setting_name),
      updated_at = now()
    WHERE id = p_id
      AND (p_category IS NULL OR setting_category = p_category);
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Instelling niet gevonden');
    END IF;
    RETURN jsonb_build_object('success', true);
  ELSIF p_operation = 'delete' THEN
    DELETE FROM public.application_settings
    WHERE id = p_id
      AND (p_category IS NULL OR setting_category = p_category);
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Instelling niet gevonden');
    END IF;
    RETURN jsonb_build_object('success', true);
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Onbekende operatie');
END;
$$;

REVOKE ALL ON FUNCTION public.manage_application_settings_for_session(uuid, text, text, integer, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_application_settings_for_session(uuid, text, text, integer, text, jsonb) TO anon, authenticated;

-- =============================================================================
-- bulk_manage_matches_for_session (admin competition/cup bulk ops)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.bulk_manage_matches_for_session(
  p_session_token uuid,
  p_operation text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_rows integer;
  v_item jsonb;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role <> 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins');
  END IF;

  IF p_operation = 'insert' THEN
    IF jsonb_typeof(p_payload) <> 'array' THEN
      RETURN jsonb_build_object('success', false, 'error', 'payload moet een array zijn');
    END IF;
    FOR v_item IN SELECT value FROM jsonb_array_elements(p_payload)
    LOOP
      INSERT INTO public.matches (
        unique_number, speeldag, home_team_id, away_team_id, match_date, location,
        is_cup_match, is_submitted, is_locked, home_score, away_score
      ) VALUES (
        v_item->>'unique_number',
        v_item->>'speeldag',
        (v_item->>'home_team_id')::integer,
        NULLIF(v_item->>'away_team_id', '')::integer,
        (v_item->>'match_date')::timestamptz,
        v_item->>'location',
        COALESCE((v_item->>'is_cup_match')::boolean, false),
        COALESCE((v_item->>'is_submitted')::boolean, false),
        COALESCE((v_item->>'is_locked')::boolean, false),
        NULLIF(v_item->>'home_score', '')::integer,
        NULLIF(v_item->>'away_score', '')::integer
      );
    END LOOP;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'inserted', v_rows);

  ELSIF p_operation = 'delete_by_unique_numbers' THEN
    DELETE FROM public.matches m
    WHERE m.unique_number = ANY(
      SELECT jsonb_array_elements_text(COALESCE(p_payload->'unique_numbers', '[]'::jsonb))
    )
    AND m.is_cup_match = COALESCE((p_payload->>'is_cup_match')::boolean, false);
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'deleted', v_rows);

  ELSIF p_operation = 'delete_by_match_ids' THEN
    DELETE FROM public.matches m
    WHERE m.match_id = ANY(
      SELECT (jsonb_array_elements_text(COALESCE(p_payload->'match_ids', '[]'::jsonb)))::integer
    );
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'deleted', v_rows);

  ELSIF p_operation = 'delete_competition' THEN
    DELETE FROM public.matches WHERE is_cup_match = false;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'deleted', v_rows);

  ELSIF p_operation = 'delete_cup' THEN
    DELETE FROM public.matches WHERE is_cup_match = true;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'deleted', v_rows);
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Onbekende operatie');
END;
$$;

REVOKE ALL ON FUNCTION public.bulk_manage_matches_for_session(uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bulk_manage_matches_for_session(uuid, text, jsonb) TO anon, authenticated;

-- =============================================================================
-- get_team_recipients_for_session
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_team_recipients_for_session(
  p_session_token uuid,
  p_team_ids integer[]
)
RETURNS TABLE(
  team_id integer,
  team_name text,
  email text,
  username text,
  source text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_team_ids integer[];
BEGIN
  SELECT s.role, s.team_ids INTO v_role, v_team_ids
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL THEN
    RETURN;
  END IF;

  IF v_role = 'player_manager' THEN
    p_team_ids := ARRAY(
      SELECT unnest(p_team_ids)
      INTERSECT
      SELECT unnest(COALESCE(v_team_ids, ARRAY[]::integer[]))
    );
    IF array_length(p_team_ids, 1) IS NULL THEN
      RETURN;
    END IF;
  ELSIF v_role NOT IN ('admin', 'referee') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT t.team_id, t.team_name::text, trim(t.contact_email)::text,
         COALESCE(NULLIF(trim(t.contact_person), ''), 'Team contact')::text, 'contact'::text
  FROM public.teams t
  WHERE t.team_id = ANY(p_team_ids)
    AND t.contact_email IS NOT NULL
    AND length(trim(t.contact_email)) > 0;

  IF v_role = 'admin' THEN
    RETURN QUERY
    SELECT t.team_id, t.team_name::text, trim(u.email)::text, u.username::text, 'manager'::text
    FROM public.team_users tu
    JOIN public.teams t ON t.team_id = tu.team_id
    JOIN public.users u ON u.user_id = tu.user_id
    WHERE tu.team_id = ANY(p_team_ids)
      AND u.email IS NOT NULL
      AND length(trim(u.email)) > 0;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_team_recipients_for_session(uuid, integer[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_recipients_for_session(uuid, integer[]) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_team_recipients(integer[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_recipients(integer[]) TO postgres, service_role;

-- =============================================================================
-- get_user_profile_for_session
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_user_profile_for_session(p_session_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_username text;
  v_team_ids integer[];
  v_user record;
BEGIN
  SELECT s.user_id, s.role, s.username, s.team_ids
  INTO v_user_id, v_role, v_username, v_team_ids
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT u.user_id, u.username, u.email, u.role::text
  INTO v_user
  FROM public.users u
  WHERE u.user_id = v_user_id;

  RETURN jsonb_build_object(
    'user_id', v_user.user_id,
    'username', v_user.username,
    'email', v_user.email,
    'role', v_user.role,
    'teams', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'team_id', t.team_id,
        'team_name', t.team_name,
        'club_colors', t.club_colors,
        'contact_person', t.contact_person,
        'contact_email', t.contact_email,
        'contact_phone', t.contact_phone
      ) ORDER BY t.team_name), '[]'::jsonb)
      FROM public.teams t
      WHERE v_role = 'admin' OR t.team_id = ANY(COALESCE(v_team_ids, ARRAY[]::integer[]))
    ),
    'team_users', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'team_id', tu.team_id,
        'team_name', t.team_name
      ) ORDER BY t.team_name), '[]'::jsonb)
      FROM public.team_users tu
      JOIN public.teams t ON t.team_id = tu.team_id
      WHERE tu.user_id = v_user_id
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_profile_for_session(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_profile_for_session(uuid) TO anon, authenticated;

-- =============================================================================
-- get_team_balance_for_session
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_team_balance_for_session(
  p_session_token uuid,
  p_team_id integer
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_team_ids integer[];
BEGIN
  SELECT s.role, s.team_ids INTO v_role, v_team_ids
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_role <> 'admin' AND (v_team_ids IS NULL OR NOT (p_team_id = ANY(v_team_ids))) THEN
    RETURN NULL;
  END IF;

  RETURN public.calculate_team_balance_updated(p_team_id);
END;
$$;

REVOKE ALL ON FUNCTION public.get_team_balance_for_session(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_balance_for_session(uuid, integer) TO anon, authenticated;

-- =============================================================================
-- manage_cost_settings_for_session
-- =============================================================================
CREATE OR REPLACE FUNCTION public.manage_cost_settings_for_session(
  p_session_token uuid,
  p_operation text,
  p_id integer DEFAULT NULL,
  p_name text DEFAULT NULL,
  p_amount numeric DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_cascade_amount boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_rows integer;
  v_new_id integer;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role <> 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins');
  END IF;

  IF p_operation = 'insert' THEN
    INSERT INTO public.costs (name, amount, category)
    VALUES (p_name, p_amount, p_category)
    RETURNING id INTO v_new_id;
    RETURN jsonb_build_object('success', true, 'id', v_new_id);
  ELSIF p_operation = 'update' THEN
    UPDATE public.costs
    SET
      name = COALESCE(p_name, name),
      amount = COALESCE(p_amount, amount),
      category = COALESCE(p_category, category)
    WHERE id = p_id;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Tarief niet gevonden');
    END IF;
    IF p_cascade_amount AND p_amount IS NOT NULL THEN
      UPDATE public.team_costs SET amount = p_amount WHERE cost_setting_id = p_id;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      RETURN jsonb_build_object('success', true, 'updated_transactions', v_rows);
    END IF;
    RETURN jsonb_build_object('success', true);
  ELSIF p_operation = 'delete' THEN
    DELETE FROM public.costs WHERE id = p_id;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Tarief niet gevonden');
    END IF;
    RETURN jsonb_build_object('success', true);
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Onbekende operatie');
END;
$$;

REVOKE ALL ON FUNCTION public.manage_cost_settings_for_session(uuid, text, integer, text, numeric, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_cost_settings_for_session(uuid, text, integer, text, numeric, text, boolean) TO anon, authenticated;

-- =============================================================================
-- manage_poll_for_session
-- =============================================================================
CREATE OR REPLACE FUNCTION public.manage_poll_for_session(
  p_session_token uuid,
  p_operation text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_poll_id integer;
  v_poll_month text;
  v_status text;
  v_rows integer;
  v_item jsonb;
BEGIN
  SELECT s.role INTO v_role
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role <> 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins');
  END IF;

  IF p_operation = 'create' THEN
    IF EXISTS (SELECT 1 FROM public.monthly_polls mp WHERE mp.poll_month = p_payload->>'poll_month') THEN
      RETURN jsonb_build_object('success', false, 'error', 'Poll bestaat al');
    END IF;
    INSERT INTO public.monthly_polls (poll_month, deadline, status, created_by, notes)
    VALUES (
      p_payload->>'poll_month',
      NULLIF(p_payload->>'deadline', '')::timestamptz,
      COALESCE(p_payload->>'status', 'draft'),
      (p_payload->>'created_by')::integer,
      p_payload->>'notes'
    )
    RETURNING id, poll_month INTO v_poll_id, v_poll_month;

    IF p_payload ? 'match_dates' AND jsonb_typeof(p_payload->'match_dates') = 'array' THEN
      FOR v_item IN SELECT value FROM jsonb_array_elements(p_payload->'match_dates')
      LOOP
        INSERT INTO public.poll_match_dates (poll_id, match_date, location, time_slot, match_count)
        VALUES (
          v_poll_id,
          (v_item->>'match_date')::timestamptz,
          v_item->>'location',
          v_item->>'time_slot',
          COALESCE((v_item->>'match_count')::integer, 2)
        );
      END LOOP;
    END IF;
    RETURN jsonb_build_object('success', true, 'poll_id', v_poll_id);

  ELSIF p_operation = 'update' THEN
    v_poll_id := (p_payload->>'poll_id')::integer;
    UPDATE public.monthly_polls
    SET
      deadline = CASE WHEN p_payload ? 'deadline' THEN NULLIF(p_payload->>'deadline', '')::timestamptz ELSE deadline END,
      status = COALESCE(p_payload->>'status', status),
      notes = COALESCE(p_payload->>'notes', notes),
      updated_at = now()
    WHERE id = v_poll_id;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN jsonb_build_object('success', v_rows > 0);

  ELSIF p_operation = 'add_match_date' THEN
    INSERT INTO public.poll_match_dates (poll_id, match_date, location, time_slot, match_count)
    VALUES (
      (p_payload->>'poll_id')::integer,
      (p_payload->>'match_date')::timestamptz,
      p_payload->>'location',
      p_payload->>'time_slot',
      COALESCE((p_payload->>'match_count')::integer, 2)
    );
    RETURN jsonb_build_object('success', true);

  ELSIF p_operation = 'remove_match_date' THEN
    DELETE FROM public.poll_match_dates WHERE id = (p_payload->>'match_date_id')::integer;
    RETURN jsonb_build_object('success', true);

  ELSIF p_operation = 'delete' THEN
    SELECT mp.id, mp.status, mp.poll_month INTO v_poll_id, v_status, v_poll_month
    FROM public.monthly_polls mp WHERE mp.id = (p_payload->>'poll_id')::integer;
    IF v_poll_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Poll niet gevonden');
    END IF;
    IF v_status NOT IN ('draft', 'closed') THEN
      RETURN jsonb_build_object('success', false, 'error', 'Alleen concept of gesloten polls');
    END IF;
    DELETE FROM public.poll_match_dates WHERE poll_id = v_poll_id;
    UPDATE public.referee_matches SET is_available = NULL WHERE poll_month = v_poll_month;
    DELETE FROM public.referee_matches
    WHERE poll_month = v_poll_month AND is_available IS NULL AND assigned_at IS NULL;
    DELETE FROM public.monthly_polls WHERE id = v_poll_id;
    RETURN jsonb_build_object('success', true);
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Onbekende operatie');
END;
$$;

REVOKE ALL ON FUNCTION public.manage_poll_for_session(uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_poll_for_session(uuid, text, jsonb) TO anon, authenticated;

-- =============================================================================
-- manage_referee_matches_for_session
-- =============================================================================
CREATE OR REPLACE FUNCTION public.manage_referee_matches_for_session(
  p_session_token uuid,
  p_operation text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
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
    RETURN jsonb_build_object('success', false, 'error', 'Geen sessie');
  END IF;

  IF p_operation = 'get_availability' THEN
    IF v_role = 'admin' THEN
      v_user_id := COALESCE((p_payload->>'referee_id')::integer, v_user_id);
    ELSIF v_role = 'referee' THEN
      v_user_id := v_user_id;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Geen toegang');
    END IF;
    RETURN (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'match_id', rm.match_id,
        'is_available', rm.is_available,
        'poll_group_id', rm.poll_group_id,
        'poll_month', rm.poll_month
      )), '[]'::jsonb)
      FROM public.referee_matches rm
      WHERE rm.referee_id = v_user_id
        AND (
          (p_payload ? 'match_ids' AND rm.match_id = ANY(
            SELECT (jsonb_array_elements_text(p_payload->'match_ids'))::integer
          ))
          OR (p_payload ? 'poll_month' AND rm.poll_month = p_payload->>'poll_month')
        )
    );
  ELSIF p_operation = 'upsert_availability' THEN
    IF v_role = 'referee' THEN
      v_user_id := v_user_id;
    ELSIF v_role = 'admin' THEN
      v_user_id := COALESCE((p_payload->>'referee_id')::integer, v_user_id);
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Geen toegang');
    END IF;

    INSERT INTO public.referee_matches (referee_id, match_id, poll_group_id, poll_month, is_available)
    VALUES (
      v_user_id,
      NULLIF(p_payload->>'match_id', '')::integer,
      NULLIF(p_payload->>'poll_group_id', ''),
      p_payload->>'poll_month',
      (p_payload->>'is_available')::boolean
    )
    ON CONFLICT (referee_id, poll_group_id, poll_month) DO UPDATE
      SET is_available = EXCLUDED.is_available
    WHERE p_payload ? 'poll_group_id' AND p_payload->>'poll_group_id' IS NOT NULL;

    IF p_payload ? 'match_id' AND p_payload->>'match_id' IS NOT NULL THEN
      INSERT INTO public.referee_matches (referee_id, match_id, poll_month, is_available, poll_group_id)
      VALUES (
        v_user_id,
        (p_payload->>'match_id')::integer,
        p_payload->>'poll_month',
        (p_payload->>'is_available')::boolean,
        NULL
      )
      ON CONFLICT (referee_id, match_id) DO UPDATE
        SET is_available = EXCLUDED.is_available, poll_month = EXCLUDED.poll_month;
    END IF;

    RETURN jsonb_build_object('success', true);
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Onbekende operatie');
END;
$$;

REVOKE ALL ON FUNCTION public.manage_referee_matches_for_session(uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_referee_matches_for_session(uuid, text, jsonb) TO anon, authenticated;

-- =============================================================================
-- User admin session RPCs
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_user_for_session(
  p_session_token uuid,
  p_user_id integer,
  p_username text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_role public.user_role DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
  v_rows integer;
BEGIN
  SELECT s.role INTO v_role FROM private.resolve_app_session(p_session_token) s LIMIT 1;
  IF v_role IS NULL OR v_role <> 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins');
  END IF;

  UPDATE public.users
  SET
    username = COALESCE(p_username, username),
    email = COALESCE(p_email, email),
    role = COALESCE(p_role, role)
  WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN jsonb_build_object('success', v_rows > 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user_for_session(
  p_session_token uuid,
  p_user_id integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT s.role INTO v_role FROM private.resolve_app_session(p_session_token) s LIMIT 1;
  IF v_role IS NULL OR v_role <> 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins');
  END IF;
  IF p_user_id = -1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'SuperAdmin kan niet verwijderd worden');
  END IF;
  DELETE FROM public.team_users WHERE user_id = p_user_id;
  DELETE FROM public.users WHERE user_id = p_user_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_team_user_for_session(
  p_session_token uuid,
  p_operation text,
  p_user_id integer,
  p_team_id integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT s.role INTO v_role FROM private.resolve_app_session(p_session_token) s LIMIT 1;
  IF v_role IS NULL OR v_role <> 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins');
  END IF;

  IF p_operation = 'assign' THEN
    DELETE FROM public.team_users WHERE user_id = p_user_id;
    INSERT INTO public.team_users (user_id, team_id) VALUES (p_user_id, p_team_id);
    RETURN jsonb_build_object('success', true);
  ELSIF p_operation = 'remove' THEN
    DELETE FROM public.team_users WHERE user_id = p_user_id;
    RETURN jsonb_build_object('success', true);
  ELSIF p_operation = 'list' THEN
    RETURN (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'user_id', tu.user_id,
        'team_id', tu.team_id,
        'team_name', t.team_name
      ) ORDER BY t.team_name), '[]'::jsonb)
      FROM public.team_users tu
      JOIN public.teams t ON t.team_id = tu.team_id
    );
  END IF;
  RETURN jsonb_build_object('success', false, 'error', 'Onbekende operatie');
END;
$$;

REVOKE ALL ON FUNCTION public.update_user_for_session(uuid, integer, text, text, public.user_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_user_for_session(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.manage_team_user_for_session(uuid, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_user_for_session(uuid, integer, text, text, public.user_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_for_session(uuid, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.manage_team_user_for_session(uuid, text, integer, integer) TO anon, authenticated;

-- =============================================================================
-- get_matches_for_session (admin/manager reads replacing direct .from matches)
-- =============================================================================
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
  v_role text;
  v_team_ids integer[];
BEGIN
  SELECT s.role, s.team_ids INTO v_role, v_team_ids
  FROM private.resolve_app_session(p_session_token) s LIMIT 1;

  IF v_role IS NULL THEN
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
      v_role = 'admin'
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
