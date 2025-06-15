
-- Add missing columns to match_forms so the application can work correctly with team forms

ALTER TABLE match_forms
  ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS home_score integer,
  ADD COLUMN IF NOT EXISTS away_score integer,
  ADD COLUMN IF NOT EXISTS referee text,
  ADD COLUMN IF NOT EXISTS referee_notes text;

-- For legacy data, you might want to set is_locked to false for all existing rows
UPDATE match_forms SET is_locked = false WHERE is_locked IS NULL;
