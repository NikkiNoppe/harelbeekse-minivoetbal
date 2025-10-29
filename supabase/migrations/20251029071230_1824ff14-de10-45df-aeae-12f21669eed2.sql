-- Add Bemarmi Boys (team_id: 4) to Kwartfinale 4 as home team
-- This team had a BYE in the 8th finals and should advance to quarter-finals

UPDATE matches 
SET home_team_id = 4 
WHERE match_id = 1283 
AND is_cup_match = true 
AND speeldag = 'Kwartfinale 4';