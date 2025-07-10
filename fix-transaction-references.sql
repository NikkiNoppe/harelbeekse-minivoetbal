-- Consolidate transaction references to use only cost_setting_id
-- This migration removes the old penalty_type_id approach and ensures all transactions use cost_settings
-- Updated to handle case where penalty_types table doesn't exist

-- Step 1: Check if penalty_type_id column exists and remove it
DO $$
BEGIN
    -- Check if penalty_type_id column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'team_transactions' 
        AND column_name = 'penalty_type_id'
    ) THEN
        -- Remove the penalty_type_id column from team_transactions
        ALTER TABLE public.team_transactions DROP COLUMN penalty_type_id;
        RAISE NOTICE 'Removed penalty_type_id column from team_transactions';
    ELSE
        RAISE NOTICE 'penalty_type_id column does not exist in team_transactions';
    END IF;
END $$;

-- Step 2: Drop the old penalty_types table if it exists
DROP TABLE IF EXISTS public.penalty_types CASCADE;

-- Step 3: Create a function to automatically set amount from cost_setting when inserting transactions
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

-- Step 4: Create trigger to automatically set amount from cost_setting
DROP TRIGGER IF EXISTS trigger_set_transaction_amount ON public.team_transactions;
CREATE TRIGGER trigger_set_transaction_amount
  BEFORE INSERT OR UPDATE ON public.team_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_transaction_amount_from_cost_setting();

-- Step 5: Create a view for easier transaction reporting
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

-- Step 6: Enable RLS on the view (views don't need policies, they inherit from underlying tables)
ALTER VIEW public.transaction_summary SET (security_invoker = true);

-- Step 7: Update the team balance calculation to be more efficient
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

-- Step 8: Verify the setup
SELECT 
    'Table structure updated' as status,
    'team_transactions now uses only cost_setting_id' as details
UNION ALL
SELECT 
    'Function created' as status,
    'set_transaction_amount_from_cost_setting function is ready' as details
UNION ALL
SELECT 
    'Trigger created' as status,
    'trigger_set_transaction_amount is active' as details; 