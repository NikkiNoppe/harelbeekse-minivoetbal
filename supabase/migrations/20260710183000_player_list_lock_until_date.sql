-- Spelerslijst-vergrendeling: optionele einddatum (van-tot planning).

CREATE OR REPLACE FUNCTION public.is_player_list_locked(
  p_organization_id integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  lock_from date;
  lock_until date;
  is_enabled boolean;
  setting_data jsonb;
BEGIN
  SELECT setting_value
  INTO setting_data
  FROM public.application_settings
  WHERE organization_id = p_organization_id
    AND setting_category = 'player_list_lock'
    AND setting_name = 'global_lock'
  LIMIT 1;

  IF setting_data IS NULL THEN
    RETURN false;
  END IF;

  is_enabled := COALESCE((setting_data->>'lock_enabled')::boolean, true);

  IF NOT is_enabled THEN
    RETURN false;
  END IF;

  lock_from := NULLIF(setting_data->>'lock_from_date', '')::date;
  lock_until := NULLIF(setting_data->>'lock_until_date', '')::date;

  IF lock_from IS NULL AND lock_until IS NULL THEN
    RETURN false;
  END IF;

  IF lock_from IS NOT NULL AND CURRENT_DATE < lock_from THEN
    RETURN false;
  END IF;

  IF lock_until IS NOT NULL AND CURRENT_DATE > lock_until THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$function$;

COMMENT ON FUNCTION public.is_player_list_locked(integer) IS
  'Spelerslijst-vergrendeling per organisatie; optionele lock_until_date voor van-tot planning.';
