-- Unlock match 1287 that was accidentally locked by referee
UPDATE matches 
SET is_locked = false 
WHERE match_id = 1287;