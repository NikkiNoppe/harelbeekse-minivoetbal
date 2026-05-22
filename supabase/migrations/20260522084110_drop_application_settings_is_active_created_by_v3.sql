-- Drop is_active and created_by from application_settings.
-- Config flags move into setting_value; soft-hidden rows are deleted.

-- 1. Migrate config flags into setting_value JSON
UPDATE public.application_settings
SET setting_value = setting_value || jsonb_build_object('lock_enabled', is_active)
WHERE setting_category = 'player_list_lock';

UPDATE public.application_settings
SET setting_value = setting_value || jsonb_build_object('enabled', is_active)
WHERE setting_category = 'referee_polls';

-- 2. Remove soft-hidden rows (visibility = row exists)
DELETE FROM public.application_settings
WHERE NOT is_active
  AND setting_category IN (
    'admin_messages',
    'admin_notifications',
    'failed_side_effects',
    'manual_suspensions',
    'blog_posts'
  );

-- 3. is_player_list_locked: use setting_value.lock_enabled
CREATE OR REPLACE FUNCTION public.is_player_list_locked()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $function$
DECLARE
  lock_date DATE;
  is_enabled BOOLEAN;
  setting_data JSONB;
BEGIN
  SELECT setting_value
  INTO setting_data
  FROM public.application_settings
  WHERE setting_category = 'player_list_lock'
    AND setting_name = 'global_lock'
  LIMIT 1;

  IF setting_data IS NULL THEN
    RETURN FALSE;
  END IF;

  is_enabled := COALESCE((setting_data->>'lock_enabled')::boolean, true);

  IF NOT is_enabled THEN
    RETURN FALSE;
  END IF;

  lock_date := (setting_data->>'lock_from_date')::DATE;

  IF lock_date IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN CURRENT_DATE >= lock_date;
END;
$function$;

-- 4. RPCs without is_active / created_by
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
      setting_category, setting_name, setting_value
    ) VALUES (
      'blog_posts',
      'post_' || extract(epoch from now())::bigint,
      p_setting_value
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

-- 5. RLS policies: remove is_active conditions
DROP POLICY IF EXISTS "Public can read season and priority data" ON public.application_settings;
DROP POLICY IF EXISTS "Public can read blog posts" ON public.application_settings;
DROP POLICY IF EXISTS "Public can read tab visibility settings" ON public.application_settings;
DROP POLICY IF EXISTS "Public can read player list lock settings" ON public.application_settings;
DROP POLICY IF EXISTS "Public can read active application settings" ON public.application_settings;
DROP POLICY IF EXISTS "Public can read referee polls settings" ON public.application_settings;
DROP POLICY IF EXISTS "Public can read admin notifications" ON public.application_settings;
DROP POLICY IF EXISTS "Authenticated users can read admin messages" ON public.application_settings;
DROP POLICY IF EXISTS "Team managers can read their team suspensions" ON public.application_settings;
DROP POLICY IF EXISTS "Team managers can read suspension rules" ON public.application_settings;
DROP POLICY IF EXISTS "Team managers can read automatic suspension overrides for their team" ON public.application_settings;
DROP POLICY IF EXISTS "Team managers can read automatic suspension overrides for their" ON public.application_settings;
DROP POLICY IF EXISTS "Public can read theme colors" ON public.application_settings;
DROP POLICY IF EXISTS "Public can read match form settings" ON public.application_settings;
DROP POLICY IF EXISTS "Public can read season archives" ON public.application_settings;

CREATE POLICY "Public can read season and priority data"
ON public.application_settings FOR SELECT
USING (setting_category IN ('season_data', 'priority_order'));

CREATE POLICY "Public can read blog posts"
ON public.application_settings FOR SELECT
USING (setting_category = 'blog_posts');

CREATE POLICY "Public can read tab visibility settings"
ON public.application_settings FOR SELECT
USING (setting_category = 'tab_visibility');

CREATE POLICY "Public can read player list lock settings"
ON public.application_settings FOR SELECT
USING (setting_category = 'player_list_lock');

CREATE POLICY "Public can read referee polls settings"
ON public.application_settings FOR SELECT
USING (setting_category = 'referee_polls');

CREATE POLICY "Public can read admin notifications"
ON public.application_settings FOR SELECT
USING (setting_category = 'admin_notifications');

CREATE POLICY "Authenticated users can read admin messages"
ON public.application_settings FOR SELECT
USING (
  (setting_category)::text = 'admin_messages'
  AND get_current_user_role() = ANY (ARRAY['admin'::text, 'player_manager'::text, 'referee'::text])
);

CREATE POLICY "Team managers can read their team suspensions"
ON public.application_settings FOR SELECT
USING (
  (setting_category)::text = 'manual_suspensions'
  AND get_current_user_role() = 'player_manager'
  AND (setting_name)::integer IN (
    SELECT player_id FROM public.players
    WHERE team_id = ANY(get_current_user_team_ids())
  )
);

CREATE POLICY "Team managers can read suspension rules"
ON public.application_settings FOR SELECT
USING (
  (setting_category)::text = 'suspension_rules'
  AND get_current_user_role() = 'player_manager'
);

CREATE POLICY "Team managers can read automatic suspension overrides for their team"
ON public.application_settings FOR SELECT
USING (
  (setting_category)::text = 'automatic_suspension_overrides'
  AND get_current_user_role() = 'player_manager'
  AND (split_part((setting_name)::text, ':', 1))::integer IN (
    SELECT player_id FROM public.players
    WHERE team_id = ANY(get_current_user_team_ids())
  )
);

CREATE POLICY "Public can read theme colors"
ON public.application_settings FOR SELECT
USING ((setting_category)::text = 'theme_colors'::text);

CREATE POLICY "Public can read match form settings"
ON public.application_settings FOR SELECT
USING (setting_category = 'match_form_settings');

CREATE POLICY "Public can read season archives"
ON public.application_settings FOR SELECT
USING (setting_category = 'season_archives');

-- 6. Drop columns
ALTER TABLE public.application_settings DROP COLUMN IF EXISTS is_active;
ALTER TABLE public.application_settings DROP COLUMN IF EXISTS created_by;
