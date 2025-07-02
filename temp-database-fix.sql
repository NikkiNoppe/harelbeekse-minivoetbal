-- Temporary fix for matches table policies
-- Run this in your Supabase SQL editor to fix the DELETE error

-- 1. Drop all existing policies that might conflict
DROP POLICY IF EXISTS "Admin can insert matches" ON matches;
DROP POLICY IF EXISTS "Admins have full access to matches" ON matches;
DROP POLICY IF EXISTS "Referees can update matches" ON matches;
DROP POLICY IF EXISTS "Team managers can update their team matches" ON matches;
DROP POLICY IF EXISTS "Users can view all matches" ON matches;

-- 2. Create a simple policy that allows all operations for now
CREATE POLICY "Allow all operations on matches (temporary fix)"
  ON matches
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. If you want to keep some security, you can use this instead:
-- CREATE POLICY "Allow all select on matches"
--   ON matches
--   FOR SELECT
--   USING (true);
-- 
-- CREATE POLICY "Allow all updates on matches"
--   ON matches
--   FOR UPDATE
--   USING (true)
--   WITH CHECK (true);
-- 
-- CREATE POLICY "Allow all inserts on matches"
--   ON matches
--   FOR INSERT
--   WITH CHECK (true); 