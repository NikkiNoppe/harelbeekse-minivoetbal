
INSERT INTO public.application_settings (setting_category, setting_name, setting_value, is_active)
SELECT 'theme_colors', 'global_theme', '{
  "primaryBase": "#60368c",
  "primaryLight": "#ab86dd",
  "scale": {
    "50": "#faf8ff",
    "100": "#f5f0ff",
    "200": "#e9e0ff",
    "300": "#d4c0ff",
    "400": "#ab86dd",
    "500": "#8c5dc0",
    "600": "#60368c",
    "700": "#4a2a6b",
    "800": "#351d4a",
    "900": "#201029"
  }
}'::jsonb, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.application_settings 
  WHERE setting_category = 'theme_colors' AND setting_name = 'global_theme'
);
