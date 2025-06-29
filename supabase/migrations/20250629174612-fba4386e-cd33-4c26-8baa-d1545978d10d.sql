
-- Fase 1: Database Aanpassingen

-- Nieuwe cost_settings tabel die financial_settings en penalty_types combineert
CREATE TABLE public.cost_settings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('match_cost', 'penalty', 'other')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default cost settings (merge van financial_settings en penalty_types)
INSERT INTO public.cost_settings (name, description, amount, category) VALUES
-- Match kosten
('Veldkosten per wedstrijd', 'Kosten voor het gebruik van het veld per wedstrijd', 5.00, 'match_cost'),
('Scheidsrechterkosten per wedstrijd', 'Kosten voor scheidsrechter per wedstrijd', 6.00, 'match_cost'),
-- Boetes
('Gele kaart', 'Gele kaart tijdens wedstrijd', 2.50, 'penalty'),
('Rode kaart', 'Rode kaart tijdens wedstrijd', 15.00, 'penalty'),
('Te laat spelen', 'Team verschijnt te laat voor wedstrijd', 25.00, 'penalty'),
('Forfait', 'Team geeft forfait', 50.00, 'penalty'),
('Unsportief gedrag', 'Unsportief gedrag van spelers/begeleiding', 35.00, 'penalty'),
('Materiaal beschadiging', 'Schade aan accommodatie of materiaal', 100.00, 'penalty');

-- Update team_transactions om cost_settings te refereren
ALTER TABLE public.team_transactions 
ADD COLUMN cost_setting_id INTEGER REFERENCES public.cost_settings(id);

-- Update matches tabel voor betere cascade handling
ALTER TABLE public.matches 
DROP CONSTRAINT IF EXISTS matches_home_team_id_fkey,
DROP CONSTRAINT IF EXISTS matches_away_team_id_fkey;

ALTER TABLE public.matches 
ADD CONSTRAINT matches_home_team_id_fkey 
FOREIGN KEY (home_team_id) REFERENCES public.teams(team_id) ON DELETE SET NULL,
ADD CONSTRAINT matches_away_team_id_fkey 
FOREIGN KEY (away_team_id) REFERENCES public.teams(team_id) ON DELETE SET NULL;

-- Update andere tabellen voor cascade delete
ALTER TABLE public.players 
DROP CONSTRAINT IF EXISTS players_team_id_fkey;

ALTER TABLE public.players 
ADD CONSTRAINT players_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES public.teams(team_id) ON DELETE SET NULL;

ALTER TABLE public.team_users 
DROP CONSTRAINT IF EXISTS team_users_team_id_fkey;

ALTER TABLE public.team_users 
ADD CONSTRAINT team_users_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES public.teams(team_id) ON DELETE CASCADE;

ALTER TABLE public.team_transactions 
DROP CONSTRAINT IF EXISTS team_transactions_team_id_fkey;

ALTER TABLE public.team_transactions 
ADD CONSTRAINT team_transactions_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES public.teams(team_id) ON DELETE CASCADE;

ALTER TABLE public.competition_standings 
DROP CONSTRAINT IF EXISTS competition_standings_team_id_fkey;

ALTER TABLE public.competition_standings 
ADD CONSTRAINT competition_standings_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES public.teams(team_id) ON DELETE CASCADE;

-- Voeg speeldag veld toe aan matches als het nog niet bestaat
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS speeldag VARCHAR(50);

-- Update trigger voor team balance met nieuwe cost_settings
CREATE OR REPLACE FUNCTION public.calculate_team_balance_updated(team_id_param INTEGER)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
  balance DECIMAL(10,2) := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN transaction_type = 'deposit' THEN amount
      ELSE -amount
    END
  ), 0)
  INTO balance
  FROM public.team_transactions
  WHERE team_id = team_id_param;
  
  RETURN balance;
END;
$$;
