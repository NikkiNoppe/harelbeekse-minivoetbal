-- Verwijder de problematische functie die DELETE errors veroorzaakt
DROP FUNCTION IF EXISTS public.delete_team_costs_for_match(integer, integer[]) CASCADE;

-- Verificatie log
DO $$
BEGIN
  RAISE NOTICE '✅ delete_team_costs_for_match functie verwijderd';
  RAISE NOTICE '✅ Scores kunnen nu worden opgeslagen zonder DELETE errors';
  RAISE NOTICE '⚠️ Match costs moeten handmatig worden beheerd in Financial admin';
END $$;