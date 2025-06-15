
-- Step 1: Add missing columns to match_forms
ALTER TABLE match_forms
  ADD COLUMN IF NOT EXISTS home_players JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS away_players JSONB DEFAULT '[]';

-- Step 2: Create a single match_form for every match that doesn't have one yet (per match, not per team)
INSERT INTO match_forms (match_id, team_id, is_submitted, created_at, updated_at, home_players, away_players)
SELECT m.match_id, m.home_team_id, false, now(), now(), '[]', '[]'
FROM matches m
LEFT JOIN match_forms f ON f.match_id = m.match_id
WHERE f.form_id IS NULL;

-- Step 3: Update the match_forms trigger to only create one match_form per match (for the home team)
CREATE OR REPLACE FUNCTION public.create_match_forms_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only one formulier per match: create for either home_team (or away, depending on convention)
  INSERT INTO match_forms (match_id, team_id, is_submitted, created_at, updated_at, home_players, away_players)
  VALUES (NEW.match_id, NEW.home_team_id, false, now(), now(), '[]', '[]');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_match_forms ON matches;

CREATE TRIGGER trg_create_match_forms
AFTER INSERT ON matches
FOR EACH ROW
EXECUTE FUNCTION public.create_match_forms_on_insert();
