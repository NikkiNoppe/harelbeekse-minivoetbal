
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
  IF v_role IS NULL OR v_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen blog posts beheren');
  END IF;

  IF p_operation = 'create' THEN
    INSERT INTO application_settings (
      setting_category, setting_name, setting_value, is_active, updated_at
    ) VALUES (
      'blog_posts',
      'post_' || extract(epoch from now())::bigint,
      p_setting_value,
      true,
      now()
    ) RETURNING id INTO v_new_id;
    RETURN jsonb_build_object('success', true, 'message', 'Blog post aangemaakt', 'id', v_new_id);

  ELSIF p_operation = 'update' THEN
    IF p_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'ID is vereist voor update');
    END IF;
    UPDATE application_settings
    SET setting_value = p_setting_value, updated_at = now()
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
    ), updated_at = now()
    WHERE id = p_id AND setting_category = 'blog_posts';
    RETURN jsonb_build_object('success', true, 'message', 'Publicatiestatus gewijzigd');

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Ongeldige operatie: ' || p_operation);
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', 'Database fout: ' || SQLERRM);
END;
$$;
