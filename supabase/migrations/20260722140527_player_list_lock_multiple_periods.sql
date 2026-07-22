-- Spelerslijst-vergrendeling: meerdere periodes in setting_value.periods[]
-- Backward compatible met legacy lock_from_date / lock_until_date.

CREATE OR REPLACE FUNCTION public.is_player_list_locked(p_organization_id integer)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  setting_data jsonb;
  is_enabled boolean;
  periods jsonb;
  period jsonb;
  lock_from date;
  lock_until date;
BEGIN
  IF p_organization_id IS NULL THEN
    RETURN false;
  END IF;

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

  periods := setting_data->'periods';

  -- Legacy fallback: single lock_from_date / lock_until_date
  IF periods IS NULL OR jsonb_typeof(periods) <> 'array' OR jsonb_array_length(periods) = 0 THEN
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
  END IF;

  FOR period IN SELECT value FROM jsonb_array_elements(periods)
  LOOP
    lock_from := NULLIF(period->>'from', '')::date;
    lock_until := NULLIF(period->>'until', '')::date;

    -- Skip empty period rows
    IF lock_from IS NULL AND lock_until IS NULL THEN
      CONTINUE;
    END IF;

    IF lock_from IS NOT NULL AND CURRENT_DATE < lock_from THEN
      CONTINUE;
    END IF;

    IF lock_until IS NOT NULL AND CURRENT_DATE > lock_until THEN
      CONTINUE;
    END IF;

    RETURN true;
  END LOOP;

  RETURN false;
END;
$$;

COMMENT ON FUNCTION public.is_player_list_locked(integer) IS
  'True when player list lock is enabled and CURRENT_DATE falls in any periods[] entry (or legacy single range).';
