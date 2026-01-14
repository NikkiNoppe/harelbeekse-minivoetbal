-- Fix niet-gefinaliseerde playoff wedstrijden speeldag 1
-- Match 2176: Positie 1 vs 8 → MVC 't Brouwputje vs Bemarmi Boys
UPDATE matches 
SET 
  home_team_id = 16,  -- MVC 't Brouwputje (positie 1)
  away_team_id = 4,   -- Bemarmi Boys (positie 8)
  is_playoff_finalized = true
WHERE match_id = 2176;

-- Match 2177: Positie 2 vs 7 → MVC Moeder Harelbeekse vs Shaktar Belledune  
UPDATE matches
SET
  home_team_id = 14,  -- MVC Moeder Harelbeekse (positie 2)
  away_team_id = 7,   -- Shaktar Belledune (positie 7)
  is_playoff_finalized = true
WHERE match_id = 2177;