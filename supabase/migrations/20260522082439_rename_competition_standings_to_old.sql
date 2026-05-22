-- Deprecate competition_standings cache: standings are computed from matches.
-- Preserve legacy rows under _old_competition_standings for reference/backup.

DROP TRIGGER IF EXISTS trigger_update_standings ON public.matches;

DROP FUNCTION IF EXISTS public.trigger_update_standings();
DROP FUNCTION IF EXISTS public.update_competition_standings_optimized();
DROP FUNCTION IF EXISTS public.update_competition_standings();

ALTER TABLE public.competition_standings RENAME TO _old_competition_standings;

ALTER TABLE public._old_competition_standings
  RENAME CONSTRAINT competition_standings_pkey TO _old_competition_standings_pkey;

ALTER TABLE public._old_competition_standings
  RENAME CONSTRAINT competition_standings_team_id_fkey TO _old_competition_standings_team_id_fkey;

ALTER TABLE public._old_competition_standings
  RENAME CONSTRAINT competition_standings_team_id_unique TO _old_competition_standings_team_id_unique;

DROP POLICY IF EXISTS "Public can read competition standings" ON public._old_competition_standings;
DROP POLICY IF EXISTS "competition_standings_anon_policy" ON public._old_competition_standings;

DROP POLICY IF EXISTS "Only admins can manage competition standings" ON public._old_competition_standings;

CREATE POLICY "Admins can read legacy competition standings"
ON public._old_competition_standings
FOR SELECT
TO authenticated
USING (get_current_user_role() = 'admin'::text);

COMMENT ON TABLE public._old_competition_standings IS
  'Deprecated legacy standings cache. Live standings are computed from matches.';
