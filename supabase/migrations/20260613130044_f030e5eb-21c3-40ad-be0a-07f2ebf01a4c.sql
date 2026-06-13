CREATE OR REPLACE FUNCTION private.manage_application_settings_for_session(
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
          'setting_value', a.setting_value
        ) ORDER BY a.id DESC
      ), '[]'::jsonb)
      FROM public.application_settings a
      WHERE p_category IS NULL OR a.setting_category = p_category
    );
  ELSIF p_operation = 'insert' THEN
    INSERT INTO public.application_settings (setting_category, setting_name, setting_value)
    VALUES (p_category, p_setting_name, p_setting_value)
    RETURNING id INTO v_new_id;
    RETURN jsonb_build_object('success', true, 'id', v_new_id);
  ELSIF p_operation = 'update' THEN
    UPDATE public.application_settings
    SET
      setting_value = COALESCE(p_setting_value, setting_value),
      setting_name = COALESCE(p_setting_name, setting_name)
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
$function$;