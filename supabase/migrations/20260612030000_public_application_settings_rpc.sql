-- Public application_settings via RPC; revoke anon direct table SELECT for GraphQL hardening.

CREATE OR REPLACE FUNCTION public.get_public_application_settings(
  p_categories text[] DEFAULT NULL
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
  WHERE s.setting_category = ANY(
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
        'season_archives'
      ]::text[]
    )
  )
  AND s.setting_category <> 'security'
  AND (
    s.setting_category <> 'blog_posts'
    OR COALESCE((s.setting_value->>'published')::boolean, false) = true
  );
$$;

REVOKE ALL ON FUNCTION public.get_public_application_settings(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_application_settings(text[]) TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_application_settings(text[]) IS
  'Public settings allowlist. No security category; blog_posts filtered to published only.';

REVOKE SELECT ON TABLE public.application_settings FROM anon;
