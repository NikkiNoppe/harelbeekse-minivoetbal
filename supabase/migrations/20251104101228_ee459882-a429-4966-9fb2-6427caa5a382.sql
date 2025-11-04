-- Stap 3: Disable ALLE match cost related triggers op matches tabel
-- Dit lost de "DELETE requires a WHERE clause" error op

-- Drop ALLE mogelijke match cost triggers (oude en nieuwe namen)
DROP TRIGGER IF EXISTS process_match_costs_trigger ON public.matches;
DROP TRIGGER IF EXISTS trigger_process_match_costs ON public.matches;
DROP TRIGGER IF EXISTS trigger_match_costs ON public.matches;
DROP TRIGGER IF EXISTS match_costs_trigger ON public.matches;

-- Log voor verificatie
DO $$
BEGIN
  RAISE NOTICE '✅ Alle match cost triggers zijn uitgeschakeld';
  RAISE NOTICE '⚠️ BELANGRIJK: Veld- en scheidsrechterkosten worden NIET automatisch toegevoegd';
  RAISE NOTICE '⚠️ Je moet deze handmatig toevoegen via de admin interface';
END $$;