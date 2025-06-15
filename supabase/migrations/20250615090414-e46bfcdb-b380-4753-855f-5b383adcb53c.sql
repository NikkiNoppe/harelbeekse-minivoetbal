
-- Stap 1: Voeg ontbrekende match_forms records toe voor bestaande matches (bijv. match_ids 1001-1005)
-- Let op: Vervang de ID's indien nodig naar de bestaande match/team id's in jouw omgeving!

-- Home/away team ophalen voor alle matches
INSERT INTO match_forms (match_id, team_id, is_submitted, created_at, updated_at)
SELECT m.match_id, m.home_team_id, false, now(), now()
FROM matches m
LEFT JOIN match_forms f ON f.match_id = m.match_id AND f.team_id = m.home_team_id
WHERE f.form_id IS NULL;

INSERT INTO match_forms (match_id, team_id, is_submitted, created_at, updated_at)
SELECT m.match_id, m.away_team_id, false, now(), now()
FROM matches m
LEFT JOIN match_forms f ON f.match_id = m.match_id AND f.team_id = m.away_team_id
WHERE f.form_id IS NULL AND m.away_team_id IS NOT NULL;

-- Optioneel: markeer enkele formulier als al ingediend voor testdoeleinden
UPDATE match_forms SET is_submitted = true WHERE form_id IN (
  SELECT form_id FROM match_forms ORDER BY form_id LIMIT 2
);

-- Stap 2: Trigger voor automatische formulier-creation bij nieuwe match
CREATE OR REPLACE FUNCTION public.create_match_forms_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Maak formulier voor thuisteam
  INSERT INTO match_forms (match_id, team_id, is_submitted, created_at, updated_at)
  VALUES (NEW.match_id, NEW.home_team_id, false, now(), now());

  -- Maak formulier voor uitteam als die bestaat (bv. geen bye)
  IF NEW.away_team_id IS NOT NULL THEN
    INSERT INTO match_forms (match_id, team_id, is_submitted, created_at, updated_at)
    VALUES (NEW.match_id, NEW.away_team_id, false, now(), now());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Koppel trigger aan matches table
DROP TRIGGER IF EXISTS trg_create_match_forms ON matches;

CREATE TRIGGER trg_create_match_forms
AFTER INSERT ON matches
FOR EACH ROW
EXECUTE FUNCTION public.create_match_forms_on_insert();
