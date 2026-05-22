-- Forfait-boetes verwijderen wedstrijdkosten via trigger/RPC; die DELETE mag
-- skip_auto_match_costs niet zetten (alleen echte handmatige admin-delete).

CREATE OR REPLACE FUNCTION public.trg_match_cost_delete_sets_skip_auto()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
BEGIN
  IF OLD.match_id IS NULL OR OLD.cost_setting_id IS NULL THEN
    RETURN OLD;
  END IF;

  -- Forfait-gedreven cleanup: suppressie-boete bestaat al → geen skip_auto
  IF public.match_has_forfait_penalty(OLD.match_id) THEN
    RETURN OLD;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.costs c
    WHERE c.id = OLD.cost_setting_id
      AND c.category = 'match_cost'
      AND COALESCE(c.is_active, true)
  ) THEN
    UPDATE public.matches
    SET skip_auto_match_costs = true
    WHERE match_id = OLD.match_id;
  END IF;
  RETURN OLD;
END;
$fn$;
