-- Fix upsert_season_archive when is_active/updated_at were dropped but the RPC was not recreated.
CREATE OR REPLACE FUNCTION public.upsert_season_archive(
  p_user_id integer,
  p_season_label text,
  p_field text,
  p_value jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
  v_existing jsonb;
  v_merged jsonb;
  v_row_id integer;
BEGIN
  IF p_season_label IS NULL OR trim(p_season_label) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seizoenlabel ontbreekt');
  END IF;

  IF p_field NOT IN ('competition_standings', 'cup_winner', 'playoff') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ongeldig archiefveld');
  END IF;

  SELECT role::text INTO v_role FROM public.users WHERE user_id = p_user_id;
  IF v_role IS NULL AND p_user_id = -1 THEN
    v_role := 'admin';
  END IF;
  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen archiveren');
  END IF;

  SELECT id, setting_value
  INTO v_row_id, v_existing
  FROM public.application_settings
  WHERE setting_category = 'season_archives'
    AND setting_name = p_season_label
  LIMIT 1;

  v_merged := COALESCE(v_existing, '{}'::jsonb) || jsonb_build_object(p_field, p_value);

  IF v_row_id IS NULL THEN
    INSERT INTO public.application_settings (
      setting_category,
      setting_name,
      setting_value
    )
    VALUES (
      'season_archives',
      p_season_label,
      v_merged
    );
  ELSE
    UPDATE public.application_settings
    SET setting_value = v_merged
    WHERE id = v_row_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Archief opgeslagen');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

DROP POLICY IF EXISTS "Public can read season archives" ON public.application_settings;
CREATE POLICY "Public can read season archives"
ON public.application_settings FOR SELECT
USING (setting_category = 'season_archives');
