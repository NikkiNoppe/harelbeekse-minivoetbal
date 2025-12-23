-- Drop de bestaande foreign key constraint
ALTER TABLE team_costs 
DROP CONSTRAINT IF EXISTS team_costs_match_id_fkey;

-- Hermaak de foreign key met ON DELETE CASCADE
ALTER TABLE team_costs
ADD CONSTRAINT team_costs_match_id_fkey 
FOREIGN KEY (match_id) 
REFERENCES matches(match_id) 
ON DELETE CASCADE;