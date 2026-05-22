-- Revert season archives to hardcoded-only (remove Supabase table and RPCs).

DROP FUNCTION IF EXISTS public.admin_upsert_season_playoff(integer, text, jsonb);
DROP FUNCTION IF EXISTS public.admin_upsert_season_cup(integer, text, jsonb);
DROP FUNCTION IF EXISTS public.admin_upsert_season_competition(integer, text, jsonb);
DROP TRIGGER IF EXISTS update_season_archives_updated_at_trg ON public.season_archives;
DROP FUNCTION IF EXISTS public.update_season_archives_updated_at();
DROP TABLE IF EXISTS public.season_archives;
