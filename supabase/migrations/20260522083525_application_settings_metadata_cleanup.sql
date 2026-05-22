-- application_settings metadata cleanup:
-- - Trigger only updates column updated_at (not setting_value JSON)
-- - RPCs set created_by on insert; rely on trigger for updated_at

CREATE OR REPLACE FUNCTION public.update_application_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_blog_post(
  p_user_id integer,
  p_operation text,
  p_id integer DEFAULT NULL,
  p_setting_value jsonb DEFAULT NULL,
  p_published boolean DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
  v_new_id INTEGER;
  v_affected INTEGER;
  v_current_value JSONB;
BEGIN
  SELECT role::text INTO v_role FROM users WHERE user_id = p_user_id;
  IF v_role IS NULL AND p_user_id = -1 THEN
    v_role := 'admin';
  END IF;
  IF v_role IS NULL OR v_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen blog posts beheren');
  END IF;

  IF p_operation = 'create' THEN
    INSERT INTO application_settings (
      setting_category, setting_name, setting_value, is_active, created_by
    ) VALUES (
      'blog_posts',
      'post_' || extract(epoch from now())::bigint,
      p_setting_value,
      true,
      NULLIF(p_user_id, -1)
    ) RETURNING id INTO v_new_id;
    RETURN jsonb_build_object('success', true, 'message', 'Blog post aangemaakt', 'id', v_new_id);

  ELSIF p_operation = 'update' THEN
    IF p_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'ID is vereist voor update');
    END IF;
    UPDATE application_settings
    SET setting_value = p_setting_value
    WHERE id = p_id AND setting_category = 'blog_posts';
    GET DIAGNOSTICS v_affected = ROW_COUNT;
    IF v_affected = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Blog post niet gevonden');
    END IF;
    RETURN jsonb_build_object('success', true, 'message', 'Blog post bijgewerkt');

  ELSIF p_operation = 'delete' THEN
    IF p_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'ID is vereist voor verwijderen');
    END IF;
    DELETE FROM application_settings WHERE id = p_id AND setting_category = 'blog_posts';
    GET DIAGNOSTICS v_affected = ROW_COUNT;
    IF v_affected = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Blog post niet gevonden');
    END IF;
    RETURN jsonb_build_object('success', true, 'message', 'Blog post verwijderd');

  ELSIF p_operation = 'toggle_published' THEN
    IF p_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'ID is vereist');
    END IF;
    SELECT setting_value INTO v_current_value
    FROM application_settings WHERE id = p_id AND setting_category = 'blog_posts';
    IF v_current_value IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Blog post niet gevonden');
    END IF;
    UPDATE application_settings
    SET setting_value = v_current_value || jsonb_build_object(
      'published', COALESCE(p_published, NOT COALESCE((v_current_value->>'published')::boolean, false)),
      'published_at', CASE WHEN COALESCE(p_published, true) THEN now()::text ELSE null END
    )
    WHERE id = p_id AND setting_category = 'blog_posts';
    RETURN jsonb_build_object('success', true, 'message', 'Publicatiestatus gewijzigd');

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Ongeldige operatie: ' || p_operation);
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', 'Database fout: ' || SQLERRM);
END;
$$;

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
      setting_value,
      is_active,
      created_by
    )
    VALUES (
      'season_archives',
      p_season_label,
      v_merged,
      true,
      NULLIF(p_user_id, -1)
    );
  ELSE
    UPDATE public.application_settings
    SET setting_value = v_merged,
        is_active = true
    WHERE id = v_row_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Archief opgeslagen');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON COLUMN public.application_settings.is_active IS
  'Row visibility flag; used by RLS and public reads. Distinct from published flags inside setting_value.';
COMMENT ON COLUMN public.application_settings.created_at IS
  'Row creation time; set by DB default on insert.';
COMMENT ON COLUMN public.application_settings.updated_at IS
  'Last row update; maintained by update_application_settings_updated_at trigger.';
COMMENT ON COLUMN public.application_settings.created_by IS
  'Admin user_id who created the row; NULL for system/legacy rows.';
