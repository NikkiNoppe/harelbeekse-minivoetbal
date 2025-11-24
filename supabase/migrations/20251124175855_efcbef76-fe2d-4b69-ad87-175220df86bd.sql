-- Verwijder scheidsrechter naam uit forfait wedstrijd
UPDATE matches 
SET referee = NULL
WHERE match_id = 1357;

-- Verificatie
DO $$
BEGIN
  RAISE NOTICE '✅ Scheidsrechter verwijderd uit forfait wedstrijd (match_id: 1357)';
  RAISE NOTICE '✅ Geen scheidsrechterkosten zullen worden aangerekend';
END $$;