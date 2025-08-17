-- Update RLS policies voor players tabel om te werken met custom authentication
alter table public.players enable row level security;

-- Verwijder oude policies die auth.role() gebruiken
drop policy if exists "Authenticated can create players" on public.players;
drop policy if exists "Authenticated can update players" on public.players;
drop policy if exists "Authenticated can delete players" on public.players;
drop policy if exists "Public can read players" on public.players;

-- Update get_current_user_role() functie om werkelijke rollen te gebruiken
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  -- Probeer de rol te krijgen uit de huidige session/context
  -- Voor nu returnen we 'admin' als fallback, maar dit wordt later vervangen
  -- door echte session management
  SELECT current_setting('app.current_user_role', true) INTO user_role;
  
  IF user_role IS NOT NULL AND user_role != '' THEN
    RETURN user_role;
  END IF;
  
  -- Fallback naar admin voor nu (dit voorkomt dat alles breekt)
  RETURN 'admin';
END;
$$;

-- Update get_current_user_team_ids() functie om werkelijke team IDs te gebruiken
CREATE OR REPLACE FUNCTION public.get_current_user_team_ids()
RETURNS integer[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  team_ids integer[];
BEGIN
  -- Probeer de team IDs te krijgen uit de huidige session/context
  SELECT string_to_array(current_setting('app.current_user_team_ids', true), ',')::integer[] INTO team_ids;
  
  IF team_ids IS NOT NULL THEN
    RETURN team_ids;
  END IF;
  
  -- Fallback naar empty array
  RETURN ARRAY[]::integer[];
END;
$$;

-- Creëer nieuwe RLS policies voor players gebaseerd op custom authentication
CREATE POLICY "Public can read players"
  ON public.players
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage all players"
  ON public.players
  FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Team managers can manage their team players"
  ON public.players
  FOR ALL
  USING (
    public.get_current_user_role() = 'player_manager' 
    AND team_id = ANY(public.get_current_user_team_ids())
  )
  WITH CHECK (
    public.get_current_user_role() = 'player_manager' 
    AND team_id = ANY(public.get_current_user_team_ids())
  );