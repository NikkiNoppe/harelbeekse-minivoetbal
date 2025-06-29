
-- Financiële instellingen tabel voor algemene tarieven
CREATE TABLE public.financial_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  field_cost_per_match DECIMAL(10,2) DEFAULT 5.00,
  referee_cost_per_match DECIMAL(10,2) DEFAULT 6.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by INTEGER REFERENCES public.users(user_id)
);

-- Insert default values
INSERT INTO public.financial_settings (id, field_cost_per_match, referee_cost_per_match) 
VALUES (1, 5.00, 6.00) 
ON CONFLICT (id) DO NOTHING;

-- Boete types tabel
CREATE TABLE public.penalty_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert standaard boete types
INSERT INTO public.penalty_types (name, description, amount) VALUES
('Gele kaart', 'Gele kaart tijdens wedstrijd', 2.50),
('Rode kaart', 'Rode kaart tijdens wedstrijd', 15.00),
('Te laat spelen', 'Team verschijnt te laat voor wedstrijd', 25.00),
('Forfait', 'Team geeft forfait', 50.00),
('Unsportief gedrag', 'Unsportief gedrag van spelers/begeleiding', 35.00),
('Materiaal beschadiging', 'Schade aan accommodatie of materiaal', 100.00);

-- Team transacties tabel voor stortingen, boetes, etc.
CREATE TABLE public.team_transactions (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES public.teams(team_id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('deposit', 'penalty', 'match_cost', 'adjustment')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  penalty_type_id INTEGER REFERENCES public.penalty_types(id),
  match_id INTEGER REFERENCES public.matches(match_id),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by INTEGER REFERENCES public.users(user_id)
);

-- Function om team balance te berekenen gebaseerd op transacties
CREATE OR REPLACE FUNCTION public.calculate_team_balance(team_id_param INTEGER)
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

-- Function om team balances bij te werken
CREATE OR REPLACE FUNCTION public.update_team_balances()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  team_record RECORD;
BEGIN
  FOR team_record IN SELECT team_id FROM public.teams
  LOOP
    UPDATE public.teams 
    SET balance = public.calculate_team_balance(team_record.team_id)
    WHERE team_id = team_record.team_id;
  END LOOP;
END;
$$;

-- Trigger om team balance automatisch bij te werken bij transactie wijzigingen
CREATE OR REPLACE FUNCTION public.trigger_update_team_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.teams 
    SET balance = public.calculate_team_balance(OLD.team_id)
    WHERE team_id = OLD.team_id;
    RETURN OLD;
  ELSE
    UPDATE public.teams 
    SET balance = public.calculate_team_balance(NEW.team_id)
    WHERE team_id = NEW.team_id;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER team_transactions_balance_update
  AFTER INSERT OR UPDATE OR DELETE ON public.team_transactions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_team_balance();

-- Update bestaande teams balance
SELECT public.update_team_balances();
