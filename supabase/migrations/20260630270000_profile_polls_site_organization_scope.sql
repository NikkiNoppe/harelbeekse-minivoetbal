-- Profile polls: scope op actieve site-organisatie (hostname), niet alleen sessie-org.
-- Voorkomt dat Harelbeke-polls zichtbaar zijn op de Kuurne-site (ook SuperAdmin / race vóór logout).

CREATE OR REPLACE FUNCTION private.resolve_profile_poll_organization(
  p_session_token uuid,
  p_organization_id integer,
  OUT user_id integer,
  OUT role text,
  OUT username text,
  OUT scoped_organization_id integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_session_org_id integer;
BEGIN
  SELECT s.user_id, s.role, s.username, s.organization_id
  INTO user_id, role, username, v_session_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF role IS NULL THEN
    scoped_organization_id := NULL;
    RETURN;
  END IF;

  IF p_organization_id IS NULL
    OR v_session_org_id IS NULL
    OR v_session_org_id <> p_organization_id
  THEN
    scoped_organization_id := NULL;
    RETURN;
  END IF;

  scoped_organization_id := p_organization_id;
END;
$$;

REVOKE ALL ON FUNCTION private.resolve_profile_poll_organization(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.resolve_profile_poll_organization(uuid, integer) TO postgres, service_role;

DROP FUNCTION IF EXISTS public.get_profile_polls_for_session(uuid);

CREATE OR REPLACE FUNCTION public.get_profile_polls_for_session(
  p_session_token uuid,
  p_organization_id integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_username text;
  v_org_id integer;
  v_result jsonb := '[]'::jsonb;
  v_row record;
  v_poll_id integer;
  v_poll_setting_name text;
  v_opt record;
  v_sv jsonb;
  v_responses jsonb;
  v_my_response jsonb;
  v_is_active boolean;
  v_eligible jsonb;
  v_responded jsonb;
  v_pending jsonb;
  v_option_counts jsonb;
  v_stats jsonb;
  v_poll jsonb;
  v_end timestamptz;
  v_status text;
  v_target_roles jsonb;
BEGIN
  SELECT r.user_id, r.role, r.username, r.scoped_organization_id
  INTO v_user_id, v_role, v_username, v_org_id
  FROM private.resolve_profile_poll_organization(p_session_token, p_organization_id) r;

  IF v_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ongeldige sessie');
  END IF;

  IF v_role NOT IN ('admin', 'player_manager', 'referee') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Geen toegang');
  END IF;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', true, 'polls', '[]'::jsonb);
  END IF;

  FOR v_row IN
    SELECT a.id, a.setting_name, a.setting_value
    FROM public.application_settings a
    WHERE a.setting_category = 'profile_polls'
      AND a.organization_id = v_org_id
    ORDER BY a.id DESC
  LOOP
    v_sv := COALESCE(v_row.setting_value, '{}'::jsonb);
    v_responses := COALESCE(v_sv->'responses', '{}'::jsonb);
    v_end := (v_sv->>'end_date')::timestamptz;
    v_status := COALESCE(v_sv->>'status', 'open');
    v_target_roles := COALESCE(v_sv->'target_roles', '[]'::jsonb);
    v_is_active := v_status = 'open' AND (v_end IS NULL OR v_end > now());

    IF v_role = 'admin' THEN
      v_poll_id := v_row.id;
      v_poll_setting_name := v_row.setting_name;

      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'user_id', u.user_id,
          'username', u.username,
          'role', u.role::text
        ) ORDER BY u.username
      ), '[]'::jsonb)
      INTO v_eligible
      FROM public.users u
      WHERE u.organization_id = v_org_id
        AND u.role::text IN (
          SELECT jsonb_array_elements_text(v_target_roles)
        );

      SELECT COALESCE(jsonb_agg(entry ORDER BY entry->>'username'), '[]'::jsonb)
      INTO v_responded
      FROM (
        SELECT jsonb_build_object(
          'user_id', (r.value->>'user_id')::integer,
          'username', r.value->>'username',
          'role', r.value->>'role',
          'option_ids', r.value->'option_ids',
          'option_labels', (
            SELECT COALESCE(jsonb_agg(opt->>'label'), '[]'::jsonb)
            FROM jsonb_array_elements(v_sv->'options') opt
            WHERE opt->>'id' IN (
              SELECT jsonb_array_elements_text(r.value->'option_ids')
            )
          ),
          'updated_at', r.value->>'updated_at'
        ) AS entry
        FROM jsonb_each(v_responses) r
      ) sub;

      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'user_id', (e.value->>'user_id')::integer,
          'username', e.value->>'username',
          'role', e.value->>'role'
        ) ORDER BY e.value->>'username'
      ), '[]'::jsonb)
      INTO v_pending
      FROM jsonb_array_elements(v_eligible) e
      WHERE NOT v_responses ? (e.value->>'user_id');

      v_option_counts := '{}'::jsonb;
      FOR v_opt IN
        SELECT opt->>'id' AS opt_id
        FROM jsonb_array_elements(COALESCE(v_sv->'options', '[]'::jsonb)) opt
      LOOP
        v_option_counts := v_option_counts || jsonb_build_object(
          v_opt.opt_id,
          (
            SELECT count(*)::integer
            FROM jsonb_each(v_responses) r
            WHERE r.value->'option_ids' @> jsonb_build_array(v_opt.opt_id)
          )
        );
      END LOOP;

      v_stats := jsonb_build_object(
        'eligible_count', jsonb_array_length(v_eligible),
        'responded_count', jsonb_array_length(v_responded),
        'option_counts', v_option_counts,
        'responded', v_responded,
        'pending', v_pending
      );

      v_poll := jsonb_build_object(
        'id', v_poll_id,
        'setting_name', v_poll_setting_name,
        'title', v_sv->>'title',
        'question', v_sv->>'question',
        'options', COALESCE(v_sv->'options', '[]'::jsonb),
        'allow_multiple', COALESCE((v_sv->>'allow_multiple')::boolean, false),
        'target_roles', v_target_roles,
        'end_date', v_sv->>'end_date',
        'status', v_status,
        'created_at', v_sv->>'created_at',
        'created_by', (v_sv->>'created_by')::integer,
        'is_active', v_is_active,
        'stats', v_stats
      );

      v_result := v_result || jsonb_build_array(v_poll);
    ELSE
      IF NOT v_is_active THEN
        CONTINUE;
      END IF;

      IF NOT (v_target_roles @> jsonb_build_array(v_role)) THEN
        CONTINUE;
      END IF;

      v_my_response := v_responses->v_user_id::text;

      v_poll := jsonb_build_object(
        'id', v_row.id,
        'title', v_sv->>'title',
        'question', v_sv->>'question',
        'options', COALESCE(v_sv->'options', '[]'::jsonb),
        'allow_multiple', COALESCE((v_sv->>'allow_multiple')::boolean, false),
        'end_date', v_sv->>'end_date',
        'my_response', CASE
          WHEN v_my_response IS NOT NULL THEN jsonb_build_object(
            'option_ids', v_my_response->'option_ids',
            'updated_at', v_my_response->>'updated_at'
          )
          ELSE NULL
        END
      );

      v_result := v_result || jsonb_build_array(v_poll);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'polls', v_result);
END;
$$;

REVOKE ALL ON FUNCTION public.get_profile_polls_for_session(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_polls_for_session(uuid, integer) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.submit_profile_poll_response_for_session(uuid, integer, text[]);

CREATE OR REPLACE FUNCTION public.submit_profile_poll_response_for_session(
  p_session_token uuid,
  p_organization_id integer,
  p_poll_id integer,
  p_option_ids text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_username text;
  v_org_id integer;
  v_sv jsonb;
  v_row record;
  v_end timestamptz;
  v_status text;
  v_target_roles jsonb;
  v_allow_multiple boolean;
  v_valid_ids text[];
  v_new_response jsonb;
  v_updated jsonb;
BEGIN
  SELECT r.user_id, r.role, r.username, r.scoped_organization_id
  INTO v_user_id, v_role, v_username, v_org_id
  FROM private.resolve_profile_poll_organization(p_session_token, p_organization_id) r;

  IF v_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ongeldige sessie');
  END IF;

  IF v_role NOT IN ('player_manager', 'referee') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Geen toegang');
  END IF;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Geen toegang tot deze organisatie');
  END IF;

  SELECT a.id, a.setting_value
  INTO v_row
  FROM public.application_settings a
  WHERE a.id = p_poll_id
    AND a.setting_category = 'profile_polls'
    AND a.organization_id = v_org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Poll niet gevonden');
  END IF;

  v_sv := COALESCE(v_row.setting_value, '{}'::jsonb);
  v_end := (v_sv->>'end_date')::timestamptz;
  v_status := COALESCE(v_sv->>'status', 'open');
  v_target_roles := COALESCE(v_sv->'target_roles', '[]'::jsonb);
  v_allow_multiple := COALESCE((v_sv->>'allow_multiple')::boolean, false);

  IF v_status <> 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Poll is gesloten');
  END IF;

  IF v_end IS NOT NULL AND v_end <= now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Poll is verlopen');
  END IF;

  IF NOT (v_target_roles @> jsonb_build_array(v_role)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Geen toegang tot deze poll');
  END IF;

  IF p_option_ids IS NULL OR array_length(p_option_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Selecteer minstens één optie');
  END IF;

  IF NOT v_allow_multiple AND array_length(p_option_ids, 1) > 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Selecteer maximaal één optie');
  END IF;

  SELECT array_agg(opt->>'id')
  INTO v_valid_ids
  FROM jsonb_array_elements(COALESCE(v_sv->'options', '[]'::jsonb)) opt;

  IF EXISTS (
    SELECT 1 FROM unnest(p_option_ids) oid
    WHERE oid <> ALL(COALESCE(v_valid_ids, ARRAY[]::text[]))
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ongeldige optie');
  END IF;

  v_new_response := jsonb_build_object(
    'user_id', v_user_id,
    'username', v_username,
    'role', v_role,
    'option_ids', to_jsonb(p_option_ids),
    'updated_at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  );

  v_updated := v_sv || jsonb_build_object(
    'responses',
    COALESCE(v_sv->'responses', '{}'::jsonb) || jsonb_build_object(v_user_id::text, v_new_response)
  );

  UPDATE public.application_settings
  SET setting_value = v_updated
  WHERE id = p_poll_id;

  RETURN jsonb_build_object(
    'success', true,
    'my_response', jsonb_build_object(
      'option_ids', v_new_response->'option_ids',
      'updated_at', v_new_response->>'updated_at'
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_profile_poll_response_for_session(uuid, integer, integer, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_profile_poll_response_for_session(uuid, integer, integer, text[]) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.manage_profile_poll_for_session(uuid, text, integer, jsonb);

CREATE OR REPLACE FUNCTION public.manage_profile_poll_for_session(
  p_session_token uuid,
  p_organization_id integer,
  p_operation text,
  p_poll_id integer DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  v_user_id integer;
  v_role text;
  v_org_id integer;
  v_new_id integer;
  v_rows integer;
  v_sv jsonb;
  v_responses jsonb;
  v_end timestamptz;
  v_options jsonb;
  v_target_roles jsonb;
  v_setting_name text;
BEGIN
  SELECT r.user_id, r.role, r.scoped_organization_id
  INTO v_user_id, v_role, v_org_id
  FROM private.resolve_profile_poll_organization(p_session_token, p_organization_id) r;

  IF v_role IS NULL OR v_role <> 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins');
  END IF;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object(
      'success',
      false,
      'error',
      'Geen toegang tot deze organisatie — kies eerst de juiste tenant (SuperAdmin)'
    );
  END IF;

  IF p_operation = 'create' THEN
    v_options := COALESCE(p_payload->'options', '[]'::jsonb);
    v_target_roles := COALESCE(p_payload->'target_roles', '[]'::jsonb);
    v_end := (p_payload->>'end_date')::timestamptz;

    IF jsonb_array_length(v_options) < 2 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Minstens 2 opties vereist');
    END IF;

    IF jsonb_array_length(v_target_roles) < 1 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Selecteer minstens één doelgroep');
    END IF;

    IF v_end IS NULL OR v_end <= now() THEN
      RETURN jsonb_build_object('success', false, 'error', 'Einddatum moet in de toekomst liggen');
    END IF;

    IF COALESCE(p_payload->>'question', '') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Vraag is verplicht');
    END IF;

    v_setting_name := 'poll_' || (extract(epoch from now()) * 1000)::bigint::text;

    v_sv := jsonb_build_object(
      'title', COALESCE(p_payload->>'title', ''),
      'question', p_payload->>'question',
      'options', v_options,
      'allow_multiple', COALESCE((p_payload->>'allow_multiple')::boolean, false),
      'target_roles', v_target_roles,
      'end_date', p_payload->>'end_date',
      'status', 'open',
      'created_at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'created_by', v_user_id,
      'responses', '{}'::jsonb
    );

    INSERT INTO public.application_settings (
      organization_id,
      setting_category,
      setting_name,
      setting_value
    )
    VALUES (v_org_id, 'profile_polls', v_setting_name, v_sv)
    RETURNING id INTO v_new_id;

    RETURN jsonb_build_object('success', true, 'id', v_new_id);

  ELSIF p_operation = 'update' THEN
    IF p_poll_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Poll ID vereist');
    END IF;

    SELECT setting_value INTO v_sv
    FROM public.application_settings
    WHERE id = p_poll_id
      AND setting_category = 'profile_polls'
      AND organization_id = v_org_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Poll niet gevonden');
    END IF;

    v_responses := COALESCE(v_sv->'responses', '{}'::jsonb);
    IF v_responses <> '{}'::jsonb THEN
      RETURN jsonb_build_object('success', false, 'error', 'Poll kan niet gewijzigd worden na eerste stem');
    END IF;

    v_options := COALESCE(p_payload->'options', v_sv->'options');
    v_target_roles := COALESCE(p_payload->'target_roles', v_sv->'target_roles');
    v_end := COALESCE((p_payload->>'end_date')::timestamptz, (v_sv->>'end_date')::timestamptz);

    IF jsonb_array_length(v_options) < 2 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Minstens 2 opties vereist');
    END IF;

    v_sv := v_sv || jsonb_build_object(
      'title', COALESCE(p_payload->>'title', v_sv->>'title'),
      'question', COALESCE(p_payload->>'question', v_sv->>'question'),
      'options', v_options,
      'allow_multiple', COALESCE((p_payload->>'allow_multiple')::boolean, (v_sv->>'allow_multiple')::boolean, false),
      'target_roles', v_target_roles,
      'end_date', COALESCE(p_payload->>'end_date', v_sv->>'end_date')
    );

    UPDATE public.application_settings
    SET setting_value = v_sv
    WHERE id = p_poll_id;

    RETURN jsonb_build_object('success', true);

  ELSIF p_operation = 'close' THEN
    IF p_poll_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Poll ID vereist');
    END IF;

    UPDATE public.application_settings
    SET setting_value = setting_value || '{"status": "closed"}'::jsonb
    WHERE id = p_poll_id
      AND setting_category = 'profile_polls'
      AND organization_id = v_org_id;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Poll niet gevonden');
    END IF;

    RETURN jsonb_build_object('success', true);

  ELSIF p_operation = 'delete' THEN
    IF p_poll_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Poll ID vereist');
    END IF;

    DELETE FROM public.application_settings
    WHERE id = p_poll_id
      AND setting_category = 'profile_polls'
      AND organization_id = v_org_id;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Poll niet gevonden');
    END IF;

    RETURN jsonb_build_object('success', true);
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Onbekende operatie');
END;
$$;

REVOKE ALL ON FUNCTION public.manage_profile_poll_for_session(uuid, integer, text, integer, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_profile_poll_for_session(uuid, integer, text, integer, jsonb) TO anon, authenticated;
