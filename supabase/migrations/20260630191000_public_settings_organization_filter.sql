-- get_public_application_settings: filter op organization_id (default 1 = Harelbeke).

DROP FUNCTION IF EXISTS public.get_public_application_settings(text[]);

CREATE OR REPLACE FUNCTION public.get_public_application_settings(
  p_categories text[] DEFAULT NULL,
  p_organization_id integer DEFAULT 1
)
RETURNS TABLE(
  id integer,
  setting_category text,
  setting_name text,
  setting_value jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    s.id,
    s.setting_category::text,
    s.setting_name::text,
    s.setting_value
  FROM public.application_settings s
  WHERE s.organization_id = p_organization_id
    AND s.setting_category = ANY(
      COALESCE(
        p_categories,
        ARRAY[
          'theme_colors',
          'tab_visibility',
          'season_data',
          'priority_order',
          'blog_posts',
          'player_list_lock',
          'match_form_settings',
          'season_archives',
          'referee_polls',
          'admin_notifications'
        ]::text[]
      )
    )
    AND s.setting_category <> 'security'
    AND (
      s.setting_category <> 'blog_posts'
      OR COALESCE((s.setting_value->>'published')::boolean, false) = true
    );
$$;

REVOKE ALL ON FUNCTION public.get_public_application_settings(text[], integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_application_settings(text[], integer) TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_application_settings(text[], integer) IS
  'Public settings allowlist per organization. Default org 1 (Harelbeke).';
