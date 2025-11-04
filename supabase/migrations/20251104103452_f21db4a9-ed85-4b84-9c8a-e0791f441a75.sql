-- Tijdelijk uitschakelen van match costs triggers om DELETE errors te voorkomen
-- Reden: delete_team_costs_for_match() faalt met "DELETE requires WHERE clause"
-- Gevolg: Veld/scheidsrechter kosten worden niet meer automatisch toegevoegd

-- Drop alle bestaande match costs triggers
DROP TRIGGER IF EXISTS trigger_process_match_costs ON public.matches;
DROP TRIGGER IF EXISTS process_match_costs_trigger ON public.matches;
DROP TRIGGER IF EXISTS trigger_match_financial_costs ON public.matches;

-- Log voor verificatie
DO $$
BEGIN
  RAISE NOTICE '✅ Match costs triggers uitgeschakeld';
  RAISE NOTICE '⚠️ Veld/scheidsrechter kosten worden niet meer automatisch toegevoegd';
  RAISE NOTICE '✅ Scores kunnen nu worden opgeslagen zonder DELETE errors';
END $$;