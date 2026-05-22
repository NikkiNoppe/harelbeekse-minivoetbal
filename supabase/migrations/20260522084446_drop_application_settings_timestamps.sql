-- Drop created_at and updated_at from application_settings.

DROP TRIGGER IF EXISTS update_application_settings_updated_at ON public.application_settings;
DROP FUNCTION IF EXISTS public.update_application_settings_updated_at();

ALTER TABLE public.application_settings DROP COLUMN IF EXISTS created_at;
ALTER TABLE public.application_settings DROP COLUMN IF EXISTS updated_at;
