
-- Add RLS policy for public read access to match_form_settings
CREATE POLICY "Public can read match form settings"
ON public.application_settings
FOR SELECT
USING (
  setting_category = 'match_form_settings'
  AND is_active = true
);

-- Seed default match_form_settings row
INSERT INTO public.application_settings (setting_category, setting_name, setting_value, is_active)
VALUES (
  'match_form_settings',
  'lock_rules',
  '{"lock_minutes_before": 5, "allow_late_submission": false, "late_penalty_amount": 5.00, "late_penalty_note": "⚠️ BOETE: Wedstrijdblad te laat ingevuld"}'::jsonb,
  true
)
ON CONFLICT DO NOTHING;
