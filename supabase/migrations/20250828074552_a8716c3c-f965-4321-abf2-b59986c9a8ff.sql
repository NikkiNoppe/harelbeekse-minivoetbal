-- Switch wedstrijden tussen Speeldag 1 en Speeldag 4
-- Garage Verbeke vs Omega Hulste (match_id 1289): Speeldag 1 → Speeldag 4
-- Bemarmi Boys vs Omega Hulste (match_id 1311): Speeldag 4 → Speeldag 1

-- Update Match 1289: Garage Verbeke vs Omega Hulste naar Speeldag 4
UPDATE matches 
SET speeldag = 'Speeldag 4', 
    match_date = '2025-09-22 19:00:00+00',
    location = 'De Vlasschaard'
WHERE match_id = 1289;

-- Update Match 1311: Bemarmi Boys vs Omega Hulste naar Speeldag 1  
UPDATE matches 
SET speeldag = 'Speeldag 1',
    match_date = '2025-09-02 19:30:00+00', 
    location = 'De Dageraad'
WHERE match_id = 1311;