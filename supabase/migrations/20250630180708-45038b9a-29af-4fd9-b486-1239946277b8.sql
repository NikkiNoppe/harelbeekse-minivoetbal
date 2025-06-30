
-- Fix voor de trigger dependency issue
-- Eerst alle bestaande triggers verwijderen die afhankelijk zijn van de functie
DROP TRIGGER IF EXISTS team_transactions_balance_update ON team_transactions;
DROP TRIGGER IF EXISTS trigger_update_team_balance_on_transaction ON team_transactions;
DROP FUNCTION IF EXISTS trigger_update_team_balance() CASCADE;

-- Fase 1: Database Cleanup en Consolidatie
-- Eerst alle data van penalty_types migreren naar cost_settings
INSERT INTO cost_settings (name, description, amount, category, is_active, created_at, updated_at)
SELECT 
  name, 
  description, 
  amount, 
  'penalty' as category,
  is_active,
  created_at,
  now() as updated_at
FROM penalty_types
WHERE NOT EXISTS (
  SELECT 1 FROM cost_settings 
  WHERE cost_settings.name = penalty_types.name 
  AND cost_settings.category = 'penalty'
);

-- Voeg standaard match costs toe als die nog niet bestaan
INSERT INTO cost_settings (name, description, amount, category, is_active, created_at, updated_at)
SELECT * FROM (
  VALUES 
    ('Veldkosten per wedstrijd', 'Kosten voor het gebruik van het veld per wedstrijd', 5.00, 'match_cost', true, now(), now()),
    ('Scheidsrechterkosten per wedstrijd', 'Kosten voor de scheidsrechter per wedstrijd', 6.00, 'match_cost', true, now(), now())
) AS v(name, description, amount, category, is_active, created_at, updated_at)
WHERE NOT EXISTS (
  SELECT 1 FROM cost_settings cs 
  WHERE cs.name = v.name AND cs.category = v.category
);

-- Update bestaande team_transactions om cost_setting_id te vullen waar dit ontbreekt
UPDATE team_transactions 
SET cost_setting_id = (
  SELECT cs.id 
  FROM cost_settings cs 
  WHERE cs.category = 'penalty' 
  AND cs.name = pt.name
  LIMIT 1
)
FROM penalty_types pt
WHERE team_transactions.penalty_type_id = pt.id 
AND team_transactions.cost_setting_id IS NULL;

-- Fase 2: Nieuwe verbeterde trigger functie
CREATE OR REPLACE FUNCTION trigger_update_team_balance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Update balance voor het oude team
    UPDATE teams 
    SET balance = calculate_team_balance_updated(OLD.team_id)
    WHERE team_id = OLD.team_id;
    RETURN OLD;
  ELSE
    -- Update balance voor het nieuwe team
    UPDATE teams 
    SET balance = calculate_team_balance_updated(NEW.team_id)
    WHERE team_id = NEW.team_id;
    
    -- Als team_id is gewijzigd, update ook het oude team
    IF TG_OP = 'UPDATE' AND OLD.team_id IS DISTINCT FROM NEW.team_id THEN
      UPDATE teams 
      SET balance = calculate_team_balance_updated(OLD.team_id)
      WHERE team_id = OLD.team_id;
    END IF;
    
    RETURN NEW;
  END IF;
END;
$$;

-- Nieuwe trigger aanmaken
CREATE TRIGGER trigger_update_team_balance_on_transaction
  AFTER INSERT OR UPDATE OR DELETE ON team_transactions
  FOR EACH ROW EXECUTE FUNCTION trigger_update_team_balance();

-- Fase 3: Cascade delete setup voor teams
-- Update foreign key constraints om cascade behavior te hebben
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_team_id_fkey;
ALTER TABLE players ADD CONSTRAINT players_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE;

ALTER TABLE team_transactions DROP CONSTRAINT IF EXISTS team_transactions_team_id_fkey;
ALTER TABLE team_transactions ADD CONSTRAINT team_transactions_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE;

ALTER TABLE team_users DROP CONSTRAINT IF EXISTS team_users_team_id_fkey;
ALTER TABLE team_users ADD CONSTRAINT team_users_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE;

ALTER TABLE team_preferences DROP CONSTRAINT IF EXISTS team_preferences_team_id_fkey;
ALTER TABLE team_preferences ADD CONSTRAINT team_preferences_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE;

-- Update matches constraints voor cascade behavior
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_home_team_id_fkey;
ALTER TABLE matches ADD CONSTRAINT matches_home_team_id_fkey 
  FOREIGN KEY (home_team_id) REFERENCES teams(team_id) ON DELETE SET NULL;

ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_away_team_id_fkey;
ALTER TABLE matches ADD CONSTRAINT matches_away_team_id_fkey 
  FOREIGN KEY (away_team_id) REFERENCES teams(team_id) ON DELETE SET NULL;

-- Manual schedule matches constraints
ALTER TABLE manual_schedule_matches DROP CONSTRAINT IF EXISTS manual_schedule_matches_home_team_id_fkey;
ALTER TABLE manual_schedule_matches ADD CONSTRAINT manual_schedule_matches_home_team_id_fkey 
  FOREIGN KEY (home_team_id) REFERENCES teams(team_id) ON DELETE SET NULL;

ALTER TABLE manual_schedule_matches DROP CONSTRAINT IF EXISTS manual_schedule_matches_away_team_id_fkey;
ALTER TABLE manual_schedule_matches ADD CONSTRAINT manual_schedule_matches_away_team_id_fkey 
  FOREIGN KEY (away_team_id) REFERENCES teams(team_id) ON DELETE SET NULL;

-- Competition standings constraint
ALTER TABLE competition_standings DROP CONSTRAINT IF EXISTS competition_standings_team_id_fkey;
ALTER TABLE competition_standings ADD CONSTRAINT competition_standings_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE;

-- Herbereken alle team balances met de nieuwe functie
SELECT update_team_balances();

-- Drop oude tabellen (na data migratie)
DROP TABLE IF EXISTS penalty_types CASCADE;
DROP TABLE IF EXISTS financial_settings CASCADE;
