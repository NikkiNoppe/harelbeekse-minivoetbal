-- Consolidate transaction references to use only cost_setting_id
-- This migration removes the old penalty_type_id approach and ensures all transactions use cost_settings

-- Step 1: Update any remaining transactions that still use penalty_type_id
UPDATE team_transactions 
SET cost_setting_id = (
  SELECT cs.id 
  FROM cost_settings cs 
  WHERE cs.category = 'penalty' 
  AND cs.name = pt.name
  LIMIT 1
)
FROM penalty_types pt
WHERE team_transactions.penalty_type_id = pt.id 
AND team_transactions.cost_setting_id IS NULL;

-- Step 2: Remove the penalty_type_id column from team_transactions
ALTER TABLE public.team_transactions 
DROP COLUMN IF EXISTS penalty_type_id;

-- Step 3: Drop the old penalty_types table since it's no longer needed
DROP TABLE IF EXISTS public.penalty_types CASCADE;

-- Step 4: Update the team_transactions table to make cost_setting_id more prominent
-- Add a comment to clarify the purpose
COMMENT ON COLUMN public.team_transactions.cost_setting_id IS 'References cost_settings table for penalty, match_cost, and other transaction types';

-- Step 5: Create a function to automatically set amount from cost_setting when inserting transactions
CREATE OR REPLACE FUNCTION public.set_transaction_amount_from_cost_setting()
RETURNS TRIGGER AS $$
BEGIN
  -- If cost_setting_id is provided but amount is not set, get it from cost_settings
  IF NEW.cost_setting_id IS NOT NULL AND NEW.amount IS NULL THEN
    SELECT amount INTO NEW.amount
    FROM cost_settings
    WHERE id = NEW.cost_setting_id AND is_active = true;
  END IF;
  
  -- If amount is set but cost_setting_id is not, try to find matching cost_setting
  IF NEW.amount IS NOT NULL AND NEW.cost_setting_id IS NULL THEN
    -- For penalty transactions, try to find matching penalty cost_setting
    IF NEW.transaction_type = 'penalty' THEN
      SELECT id INTO NEW.cost_setting_id
      FROM cost_settings
      WHERE category = 'penalty' 
      AND amount = NEW.amount
      AND is_active = true
      LIMIT 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger to automatically set amount from cost_setting
DROP TRIGGER IF EXISTS trigger_set_transaction_amount ON public.team_transactions;
CREATE TRIGGER trigger_set_transaction_amount
  BEFORE INSERT OR UPDATE ON public.team_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_transaction_amount_from_cost_setting();

-- Step 7: Update existing functions to use only cost_setting_id
CREATE OR REPLACE FUNCTION public.get_transaction_details(transaction_id INTEGER)
RETURNS TABLE (
  transaction_id INTEGER,
  team_name TEXT,
  transaction_type TEXT,
  amount DECIMAL(10,2),
  description TEXT,
  cost_setting_name TEXT,
  cost_setting_category TEXT,
  transaction_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tt.id,
    t.team_name,
    tt.transaction_type,
    tt.amount,
    tt.description,
    cs.name as cost_setting_name,
    cs.category as cost_setting_category,
    tt.transaction_date
  FROM team_transactions tt
  LEFT JOIN teams t ON tt.team_id = t.team_id
  LEFT JOIN cost_settings cs ON tt.cost_setting_id = cs.id
  WHERE tt.id = transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create a view for easier transaction reporting
CREATE OR REPLACE VIEW public.transaction_summary AS
SELECT 
  tt.id,
  tt.team_id,
  t.team_name,
  tt.transaction_type,
  tt.amount,
  tt.description,
  cs.name as cost_setting_name,
  cs.category as cost_setting_category,
  tt.transaction_date,
  tt.created_at
FROM team_transactions tt
LEFT JOIN teams t ON tt.team_id = t.team_id
LEFT JOIN cost_settings cs ON tt.cost_setting_id = cs.id
ORDER BY tt.transaction_date DESC, tt.created_at DESC;

-- Step 9: Add RLS policy for the new view
CREATE POLICY "Admins can view transaction summary" 
ON public.transaction_summary 
FOR SELECT 
USING (is_admin_user());

-- Step 10: Update the team balance calculation to be more efficient
CREATE OR REPLACE FUNCTION public.calculate_team_balance_final(team_id_param INTEGER)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
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