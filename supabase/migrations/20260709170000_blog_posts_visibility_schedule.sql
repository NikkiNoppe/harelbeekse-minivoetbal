-- Blogposts: optionele zichtbaarheidsperiode (visible_from / visible_until) in setting_value JSON.
-- Publieke RPC filtert verlopen en nog-niet-actieve berichten server-side.

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
      OR (
        COALESCE((s.setting_value->>'published')::boolean, false) = true
        AND (
          NULLIF(TRIM(s.setting_value->>'visible_from'), '') IS NULL
          OR (NULLIF(TRIM(s.setting_value->>'visible_from'), ''))::date <= CURRENT_DATE
        )
        AND (
          NULLIF(TRIM(s.setting_value->>'visible_until'), '') IS NULL
          OR (NULLIF(TRIM(s.setting_value->>'visible_until'), ''))::date >= CURRENT_DATE
        )
      )
    );
$$;

REVOKE ALL ON FUNCTION public.get_public_application_settings(text[], integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_application_settings(text[], integer) TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_application_settings(text[], integer) IS
  'Public settings allowlist per organization. Blog posts respect visible_from/visible_until schedule.';
