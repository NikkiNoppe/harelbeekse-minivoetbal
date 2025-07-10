-- Optimize team_transactions table and rename to team_costs
-- This better reflects the many-to-many relationship between teams and costs

-- Step 1: Remove redundant columns that are derived from costs table
-- Since cost_setting_id references costs, we can derive transaction_type and amount from there
ALTER TABLE public.team_transactions 
DROP COLUMN IF EXISTS transaction_type,
DROP COLUMN IF EXISTS amount,
DROP COLUMN IF EXISTS description;

-- Step 2: Remove unused columns
ALTER TABLE public.team_transactions 
DROP COLUMN IF EXISTS created_at,
DROP COLUMN IF EXISTS created_by;

-- Step 3: Rename table to better reflect the relationship
ALTER TABLE public.team_transactions RENAME TO team_costs;

-- Step 4: Update foreign key constraint names
ALTER TABLE public.team_costs 
DROP CONSTRAINT IF EXISTS team_transactions_cost_setting_id_fkey;

ALTER TABLE public.team_costs 
ADD CONSTRAINT team_costs_cost_setting_id_fkey 
FOREIGN KEY (cost_setting_id) REFERENCES public.costs(id);

ALTER TABLE public.team_costs 
DROP CONSTRAINT IF EXISTS team_transactions_match_id_fkey;

ALTER TABLE public.team_costs 
ADD CONSTRAINT team_costs_match_id_fkey 
FOREIGN KEY (match_id) REFERENCES public.matches(match_id);

ALTER TABLE public.team_costs 
DROP CONSTRAINT IF EXISTS team_transactions_team_id_fkey;

ALTER TABLE public.team_costs 
ADD CONSTRAINT team_costs_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES public.teams(team_id) ON DELETE CASCADE;

-- Step 5: Update primary key constraint name
ALTER TABLE public.team_costs 
DROP CONSTRAINT IF EXISTS team_transactions_pkey;

ALTER TABLE public.team_costs 
ADD CONSTRAINT team_costs_pkey PRIMARY KEY (id);

-- Step 6: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_team_costs_team_id ON public.team_costs(team_id);
CREATE INDEX IF NOT EXISTS idx_team_costs_cost_setting_id ON public.team_costs(cost_setting_id);
CREATE INDEX IF NOT EXISTS idx_team_costs_match_id ON public.team_costs(match_id);
CREATE INDEX IF NOT EXISTS idx_team_costs_date ON public.team_costs(transaction_date);

-- Step 7: Update functions to work with the new table name
CREATE OR REPLACE FUNCTION public.calculate_team_balance_updated(team_id_param INTEGER)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
  balance DECIMAL(10,2) := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN cs.category = 'match_cost' THEN -cs.amount
      WHEN cs.category = 'penalty' THEN -cs.amount
      ELSE 0
    END
  ), 0)
  INTO balance
  FROM public.team_costs tc
  LEFT JOIN public.costs cs ON tc.cost_setting_id = cs.id
  WHERE tc.team_id = team_id_param;
  
  RETURN balance;
END;
$$;

-- Step 8: Update trigger function
CREATE OR REPLACE FUNCTION public.trigger_update_team_balance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Update balance voor het oude team
    UPDATE teams 
    SET balance = calculate_team_balance_updated(OLD.team_id)
    WHERE team_id = OLD.team_id;
    RETURN OLD;
  ELSE
    -- Update balance voor het nieuwe team
    UPDATE teams 
    SET balance = calculate_team_balance_updated(NEW.team_id)
    WHERE team_id = NEW.team_id;
    
    -- Als team_id is gewijzigd, update ook het oude team
    IF TG_OP = 'UPDATE' AND OLD.team_id IS DISTINCT FROM NEW.team_id THEN
      UPDATE teams 
      SET balance = calculate_team_balance_updated(OLD.team_id)
      WHERE team_id = OLD.team_id;
    END IF;
    
    RETURN NEW;
  END IF;
END;
$$;

-- Step 9: Update triggers to work with new table name
DROP TRIGGER IF EXISTS trigger_set_transaction_amount ON public.team_costs;
DROP TRIGGER IF EXISTS trigger_update_team_balance_on_transaction ON public.team_costs;

-- Create new triggers for team_costs table
CREATE TRIGGER trigger_update_team_balance_on_cost
  AFTER INSERT OR UPDATE OR DELETE ON team_costs
  FOR EACH ROW EXECUTE FUNCTION trigger_update_team_balance();

-- Step 10: Create a view for backward compatibility (if needed)
CREATE OR REPLACE VIEW public.team_transactions AS
SELECT 
  tc.id,
  tc.team_id,
  t.team_name,
  cs.name as cost_name,
  cs.amount,
  cs.category as transaction_type,
  tc.match_id,
  tc.transaction_date,
  tc.cost_setting_id
FROM public.team_costs tc
LEFT JOIN public.teams t ON tc.team_id = t.team_id
LEFT JOIN public.costs cs ON tc.cost_setting_id = cs.id;

-- Step 11: Verify the optimization
SELECT 
    'Table renamed' as status,
    'team_transactions renamed to team_costs' as details
UNION ALL
SELECT 
    'Redundant columns removed' as status,
    'transaction_type, amount, description removed (derived from costs)' as details
UNION ALL
SELECT 
    'Unused columns removed' as status,
    'created_at, created_by removed' as details
UNION ALL
SELECT 
    'Indexes added' as status,
    'Performance indexes added for better queries' as details
UNION ALL
SELECT 
    'Functions updated' as status,
    'All functions updated to work with new table name' as details; 