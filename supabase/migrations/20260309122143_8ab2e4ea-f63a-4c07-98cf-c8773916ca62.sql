
-- RLS policy: everyone can read theme_colors settings
CREATE POLICY "Public can read theme colors"
ON public.application_settings
FOR SELECT
USING (
  (setting_category)::text = 'theme_colors'::text
  AND is_active = true
);
