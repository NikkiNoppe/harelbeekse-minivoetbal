UPDATE matches
SET speeldag = 'Playoff ' || (regexp_match(speeldag, '(\d+)'))[1]
WHERE is_playoff_match = true
  AND speeldag IS NOT NULL
  AND (regexp_match(speeldag, '(\d+)')) IS NOT NULL
  AND speeldag IS DISTINCT FROM 'Playoff ' || (regexp_match(speeldag, '(\d+)'))[1];