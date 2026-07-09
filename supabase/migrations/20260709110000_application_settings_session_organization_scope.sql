-- application_settings session-RPC: altijd scopen op actieve organization_id.
-- SuperAdmin via acting_organization_id uit private.resolve_app_session.

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
AS $function$
DECLARE
  v_role text;
  v_org_id integer;
  v_new_id integer;
  v_rows integer;
BEGIN
  SELECT s.role, s.organization_id
  INTO v_role, v_org_id
  FROM private.resolve_app_session(p_session_token) s
  LIMIT 1;

  IF v_role IS NULL OR v_role <> 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins');
  END IF;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Geen actieve organisatie');
  END IF;

  IF p_operation = 'list' THEN
    RETURN (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'setting_category', a.setting_category,
          'setting_name', a.setting_name,
          'setting_value', a.setting_value
        ) ORDER BY a.id DESC
      ), '[]'::jsonb)
      FROM public.application_settings a
      WHERE a.organization_id = v_org_id
        AND (p_category IS NULL OR a.setting_category = p_category)
    );
  ELSIF p_operation = 'insert' THEN
    IF p_category IS NULL OR p_setting_name IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Categorie en naam verplicht');
    END IF;

    INSERT INTO public.application_settings (
      organization_id,
      setting_category,
      setting_name,
      setting_value
    )
    VALUES (v_org_id, p_category, p_setting_name, p_setting_value)
    ON CONFLICT (organization_id, setting_category, setting_name)
    DO UPDATE SET setting_value = EXCLUDED.setting_value
    RETURNING id INTO v_new_id;

    RETURN jsonb_build_object('success', true, 'id', v_new_id);
  ELSIF p_operation = 'update' THEN
    UPDATE public.application_settings
    SET
      setting_value = COALESCE(p_setting_value, setting_value),
      setting_name = COALESCE(p_setting_name, setting_name)
    WHERE id = p_id
      AND organization_id = v_org_id
      AND (p_category IS NULL OR setting_category = p_category);
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Instelling niet gevonden');
    END IF;
    RETURN jsonb_build_object('success', true);
  ELSIF p_operation = 'delete' THEN
    DELETE FROM public.application_settings
    WHERE id = p_id
      AND organization_id = v_org_id
      AND (p_category IS NULL OR setting_category = p_category);
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Instelling niet gevonden');
    END IF;
    RETURN jsonb_build_object('success', true);
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Onbekende operatie');
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_player_list_locked(
  p_organization_id integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  lock_date date;
  is_enabled boolean;
  setting_data jsonb;
BEGIN
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

  lock_date := (setting_data->>'lock_from_date')::date;

  IF lock_date IS NULL THEN
    RETURN false;
  END IF;

  RETURN CURRENT_DATE >= lock_date;
END;
$function$;

REVOKE ALL ON FUNCTION public.manage_application_settings_for_session(uuid, text, text, integer, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_application_settings_for_session(uuid, text, text, integer, text, jsonb) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.is_player_list_locked(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_player_list_locked(integer) TO anon, authenticated;

COMMENT ON FUNCTION public.manage_application_settings_for_session(uuid, text, text, integer, text, jsonb) IS
  'Admin application_settings CRUD binnen actieve tenant (organization_id uit sessie).';

COMMENT ON FUNCTION public.is_player_list_locked(integer) IS
  'Spelerslijst-vergrendeling per organisatie (default org 1 = Harelbeke).';
