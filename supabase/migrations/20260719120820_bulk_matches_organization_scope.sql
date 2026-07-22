-- bulk_manage_matches_for_session: alle ops gescoped op actieve organization_id.

CREATE OR REPLACE FUNCTION private.bulk_manage_matches_for_session(
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
  v_org_id integer;
  v_rows integer := 0;
  v_item jsonb;
  v_home_org integer;
BEGIN
  SELECT s.role, s.organization_id
  INTO v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role <> 'admin' OR v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins');
  END IF;

  IF p_operation = 'insert' THEN
    IF jsonb_typeof(p_payload) <> 'array' THEN
      RETURN jsonb_build_object('success', false, 'error', 'payload moet een array zijn');
    END IF;
    FOR v_item IN SELECT value FROM jsonb_array_elements(p_payload)
    LOOP
      SELECT t.organization_id INTO v_home_org
      FROM public.teams t
      WHERE t.team_id = (v_item->>'home_team_id')::integer;

      IF v_home_org IS DISTINCT FROM v_org_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wedstrijd hoort niet bij actieve organisatie');
      END IF;

      INSERT INTO public.matches (
        unique_number, speeldag, home_team_id, away_team_id, match_date, location,
        is_cup_match, is_submitted, is_locked, home_score, away_score, organization_id
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
        NULLIF(v_item->>'away_score', '')::integer,
        v_org_id
      );
      v_rows := v_rows + 1;
    END LOOP;
    RETURN jsonb_build_object('success', true, 'inserted', v_rows);

  ELSIF p_operation = 'delete_by_unique_numbers' THEN
    DELETE FROM public.matches m
    WHERE m.organization_id = v_org_id
      AND m.unique_number = ANY(
        SELECT jsonb_array_elements_text(COALESCE(p_payload->'unique_numbers', '[]'::jsonb))
      )
      AND m.is_cup_match = COALESCE((p_payload->>'is_cup_match')::boolean, false);
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'deleted', v_rows);

  ELSIF p_operation = 'delete_by_match_ids' THEN
    DELETE FROM public.matches m
    WHERE m.organization_id = v_org_id
      AND m.match_id = ANY(
        SELECT (jsonb_array_elements_text(COALESCE(p_payload->'match_ids', '[]'::jsonb)))::integer
      );
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'deleted', v_rows);

  ELSIF p_operation = 'delete_competition' THEN
    DELETE FROM public.matches
    WHERE organization_id = v_org_id
      AND is_cup_match = false;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'deleted', v_rows);

  ELSIF p_operation = 'delete_cup' THEN
    DELETE FROM public.matches
    WHERE organization_id = v_org_id
      AND is_cup_match = true;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'deleted', v_rows);
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Onbekende operatie');
END;
$$;
