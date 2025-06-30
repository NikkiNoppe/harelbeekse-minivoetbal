
-- Fix de cost_settings category constraint om alle benodigde categorieën toe te staan
ALTER TABLE cost_settings 
DROP CONSTRAINT IF EXISTS cost_settings_category_check;

-- Voeg nieuwe constraint toe met alle benodigde categorieën
ALTER TABLE cost_settings 
ADD CONSTRAINT cost_settings_category_check 
CHECK (category IN ('match_cost', 'penalty', 'other', 'field_cost', 'referee_cost'));

-- Voeg ook indexen toe voor betere performance
CREATE INDEX IF NOT EXISTS idx_cost_settings_category ON cost_settings(category);
CREATE INDEX IF NOT EXISTS idx_cost_settings_active ON cost_settings(is_active);
