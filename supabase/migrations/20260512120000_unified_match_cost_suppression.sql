-- Één definitie voor "boete waarvoor geen standaard wedstrijdkosten (veld/scheids/admin) mogen bestaan".
-- Voorkomt dat sync/backfill na forfait-achtige boetes opnieuw 6 kosten aanmaakt (DB + edge + client gebruiken dezelfde regels via deze functie).

CREATE OR REPLACE FUNCTION public.cost_name_implies_match_cost_suppression(p_name text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path TO 'public'
AS $$
  SELECT
    lower(trim(COALESCE(p_name, ''))) LIKE '%forfait%'
    OR lower(trim(COALESCE(p_name, ''))) LIKE '%walk%over%'
    OR lower(trim(COALESCE(p_name, ''))) LIKE '%vrijstelling%'
    OR lower(trim(COALESCE(p_name, ''))) LIKE '%niet gespeeld%'
    OR lower(trim(COALESCE(p_name, ''))) LIKE '%niet afgewerkt%';
$$;

CREATE OR REPLACE FUNCTION public.match_has_forfait_penalty(p_match_id integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_costs tc
    JOIN public.costs c ON c.id = tc.cost_setting_id
    WHERE tc.match_id = p_match_id
      AND c.category = 'penalty'
      AND COALESCE(c.is_active, true)
      AND public.cost_name_implies_match_cost_suppression(c.name)
  );
$$;

CREATE OR REPLACE FUNCTION public.trg_strip_match_costs_on_forfait_penalty()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
BEGIN
  IF NEW.match_id IS NULL OR NEW.cost_setting_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.costs c
    WHERE c.id = NEW.cost_setting_id
      AND c.category = 'penalty'
      AND COALESCE(c.is_active, true)
      AND public.cost_name_implies_match_cost_suppression(c.name)
  ) THEN
    DELETE FROM public.team_costs tc
    USING public.costs c
    WHERE tc.match_id = NEW.match_id
      AND tc.cost_setting_id = c.id
      AND c.category = 'match_cost'
      AND COALESCE(c.is_active, true);
  END IF;

  RETURN NEW;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.add_team_cost_as_admin(
  p_user_id integer,
  p_team_id integer,
  p_cost_setting_id integer,
  p_amount numeric,
  p_transaction_date date DEFAULT CURRENT_DATE,
  p_match_id integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_new_id integer;
  v_category text;
  v_cost_name text;
BEGIN
  SELECT u.role::text INTO v_role FROM public.users u WHERE u.user_id = p_user_id;
  IF v_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gebruiker niet gevonden');
  END IF;

  SELECT c.category::text, trim(c.name)
    INTO v_category, v_cost_name
  FROM public.costs c
  WHERE c.id = p_cost_setting_id;

  IF v_category IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kosttype niet gevonden');
  END IF;

  IF v_role = 'admin' THEN
    NULL;
  ELSIF v_role = 'referee' AND v_category = 'penalty' AND p_match_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.matches m
      JOIN public.users u ON u.user_id = p_user_id
      WHERE m.match_id = p_match_id
        AND (
          m.assigned_referee_id = u.user_id
          OR (m.referee IS NOT NULL AND m.referee <> '' AND m.referee = u.username)
        )
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Geen rechten om boete toe te voegen voor deze wedstrijd (niet toegewezen als scheids).'
      );
    END IF;
  ELSIF v_role = 'player_manager' AND v_category = 'penalty' AND p_match_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.matches m
      JOIN public.team_users tu ON tu.user_id = p_user_id AND tu.team_id = p_team_id
      WHERE m.match_id = p_match_id
        AND p_team_id IS NOT NULL
        AND (m.home_team_id = p_team_id OR m.away_team_id = p_team_id)
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Geen rechten om deze boete toe te voegen (alleen voor je eigen ploeg op deze wedstrijd).'
      );
    END IF;
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Alleen admins kunnen deze kost toevoegen (of als scheids alleen boetes voor jouw wedstrijd).'
    );
  END IF;

  INSERT INTO public.team_costs (team_id, cost_setting_id, amount, transaction_date, match_id)
  VALUES (
    p_team_id,
    p_cost_setting_id,
    p_amount,
    COALESCE(p_transaction_date::date, CURRENT_DATE),
    p_match_id
  )
  RETURNING id INTO v_new_id;

  IF v_category = 'penalty'
     AND p_match_id IS NOT NULL
     AND public.cost_name_implies_match_cost_suppression(v_cost_name) THEN
    DELETE FROM public.team_costs tc
    USING public.costs c
    WHERE tc.match_id = p_match_id
      AND tc.cost_setting_id = c.id
      AND c.category = 'match_cost'
      AND COALESCE(c.is_active, true);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Kost succesvol toegevoegd',
    'id', v_new_id
  );
END;
$function$;
