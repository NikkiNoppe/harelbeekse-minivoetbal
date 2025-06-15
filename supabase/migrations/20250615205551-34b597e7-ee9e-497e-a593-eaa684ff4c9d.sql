
-- 1. Verwijder policies die afhankelijk waren van auth.uid()
DROP POLICY IF EXISTS "Only admins can update match_forms" ON match_forms;
DROP POLICY IF EXISTS "Only admins can insert match_forms" ON match_forms;
DROP POLICY IF EXISTS "Only admins can delete match_forms" ON match_forms;
DROP POLICY IF EXISTS "All users can select match_forms" ON match_forms;

-- 2. Gebruik het bestaande custom authenticatie model via de functie is_admin_user()

-- Alleen admins mogen wijzigen of verwijderen:
CREATE POLICY "Admins mogen match_forms updaten"
  ON match_forms
  FOR UPDATE
  USING (public.is_admin_user());

CREATE POLICY "Admins mogen match_forms aanmaken"
  ON match_forms
  FOR INSERT
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins mogen match_forms verwijderen"
  ON match_forms
  FOR DELETE
  USING (public.is_admin_user());

-- Iedereen mag alle match_forms bekijken:
CREATE POLICY "Iedereen mag match_forms zien"
  ON match_forms
  FOR SELECT
  USING (true);

-- (Optioneel: breid hierna de policies verder uit voor teammanagers met permissies op basis van business rules/nieuwe functies.)

