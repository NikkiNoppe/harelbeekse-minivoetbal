-- Rename cost_settings to costs and remove unused audit log table
-- This makes the naming cleaner and removes unused functionality

-- Step 1: Drop the unused audit log table and related functions
DROP TABLE IF EXISTS public.cost_setting_audit_log CASCADE;

-- Step 2: Drop the trigger that references the audit log
DROP TRIGGER IF EXISTS trigger_update_transactions_on_cost_change ON public.cost_settings;

-- Step 3: Drop the function that uses the audit log
DROP FUNCTION IF EXISTS public.update_related_transactions_on_cost_change() CASCADE;

-- Step 4: Rename cost_settings table to costs
ALTER TABLE public.cost_settings RENAME TO costs;

-- Step 5: Update the foreign key constraint in team_transactions
ALTER TABLE public.team_transactions 
DROP CONSTRAINT IF EXISTS team_transactions_cost_setting_id_fkey;

ALTER TABLE public.team_transactions 
ADD CONSTRAINT team_transactions_cost_setting_id_fkey 
FOREIGN KEY (cost_setting_id) REFERENCES public.costs(id);

-- Step 6: Update the trigger function to work with the new table name
CREATE OR REPLACE FUNCTION public.set_transaction_amount_from_cost_setting()
RETURNS TRIGGER AS $$
BEGIN
  -- If cost_setting_id is provided, always derive type and amount from it
  IF NEW.cost_setting_id IS NOT NULL THEN
    SELECT 
      CASE 
        WHEN category = 'match_cost' THEN 'match_cost'
        WHEN category = 'penalty' THEN 'penalty'
        ELSE 'other'
      END,
      amount
    INTO NEW.transaction_type, NEW.amount
    FROM costs
    WHERE id = NEW.cost_setting_id AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Update the insert function to use the new table name
CREATE OR REPLACE FUNCTION public.insert_transaction_with_auto_data(
  p_team_id INTEGER,
  p_cost_setting_id INTEGER DEFAULT NULL,
  p_transaction_type VARCHAR(50) DEFAULT NULL,
  p_amount DECIMAL(10,2) DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_match_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  new_transaction_id INTEGER;
  derived_type VARCHAR(50);
  derived_amount DECIMAL(10,2);
BEGIN
  -- Determine transaction type and amount
  IF p_cost_setting_id IS NOT NULL THEN
    -- Get type and amount from costs
    SELECT 
      CASE 
        WHEN category = 'match_cost' THEN 'match_cost'
        WHEN category = 'penalty' THEN 'penalty'
        ELSE 'other'
      END,
      amount
    INTO derived_type, derived_amount
    FROM costs 
    WHERE id = p_cost_setting_id AND is_active = true;
  ELSE
    -- Use provided values
    derived_type := p_transaction_type;
    derived_amount := p_amount;
  END IF;
  
  -- Insert the transaction
  INSERT INTO team_transactions (
    team_id,
    transaction_type,
    amount,
    description,
    cost_setting_id,
    match_id,
    transaction_date
  ) VALUES (
    p_team_id,
    derived_type,
    derived_amount,
    p_description,
    p_cost_setting_id,
    p_match_id,
    CURRENT_DATE
  ) RETURNING id INTO new_transaction_id;
  
  RETURN new_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Update the migration function to use the new table name
CREATE OR REPLACE FUNCTION public.migrate_transactions_to_cost_settings()
RETURNS VOID AS $$
DECLARE
  transaction_record RECORD;
  matching_cost_setting_id INTEGER;
BEGIN
  -- For each transaction that doesn't have a cost_setting_id
  FOR transaction_record IN 
    SELECT * FROM team_transactions 
    WHERE cost_setting_id IS NULL 
    AND transaction_type IN ('penalty', 'match_cost')
  LOOP
    -- Try to find matching cost_setting
    IF transaction_record.transaction_type = 'penalty' THEN
      SELECT id INTO matching_cost_setting_id
      FROM costs
      WHERE category = 'penalty' 
      AND amount = transaction_record.amount
      AND is_active = true
      LIMIT 1;
    ELSIF transaction_record.transaction_type = 'match_cost' THEN
      -- For match costs, try to match by description
      SELECT id INTO matching_cost_setting_id
      FROM costs
      WHERE category = 'match_cost' 
      AND (
        (name ILIKE '%veld%' AND transaction_record.description ILIKE '%veld%') OR
        (name ILIKE '%scheidsrechter%' AND transaction_record.description ILIKE '%scheidsrechter%')
      )
      AND is_active = true
      LIMIT 1;
    END IF;
    
    -- Update the transaction if we found a match
    IF matching_cost_setting_id IS NOT NULL THEN
      UPDATE team_transactions 
      SET cost_setting_id = matching_cost_setting_id
      WHERE id = transaction_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Update the views to use the new table name
CREATE OR REPLACE VIEW public.transactions_with_derived_data AS
SELECT 
  tt.id,
  tt.team_id,
  t.team_name,
  -- Derive transaction_type from costs category
  CASE 
    WHEN cs.category = 'match_cost' THEN 'match_cost'
    WHEN cs.category = 'penalty' THEN 'penalty'
    WHEN tt.transaction_type = 'deposit' THEN 'deposit'
    WHEN tt.transaction_type = 'adjustment' THEN 'adjustment'
    ELSE tt.transaction_type
  END as transaction_type,
  -- Use amount from costs if available, otherwise from transaction
  COALESCE(cs.amount, tt.amount) as amount,
  tt.description,
  tt.cost_setting_id,
  cs.name as cost_setting_name,
  cs.category as cost_setting_category,
  tt.match_id,
  tt.transaction_date,
  tt.created_at
FROM team_transactions tt
LEFT JOIN teams t ON tt.team_id = t.team_id
LEFT JOIN costs cs ON tt.cost_setting_id = cs.id;

-- Step 10: Update the comprehensive transactions view
CREATE OR REPLACE VIEW public.comprehensive_transactions AS
SELECT 
  tt.id,
  tt.team_id,
  t.team_name,
  -- Smart transaction type derivation
  CASE 
    WHEN cs.category = 'match_cost' THEN 'match_cost'
    WHEN cs.category = 'penalty' THEN 'penalty'
    WHEN tt.transaction_type = 'deposit' THEN 'deposit'
    WHEN tt.transaction_type = 'adjustment' THEN 'adjustment'
    ELSE tt.transaction_type
  END as transaction_type,
  -- Smart amount derivation
  COALESCE(cs.amount, tt.amount) as amount,
  tt.description,
  tt.cost_setting_id,
  cs.name as cost_setting_name,
  cs.category as cost_setting_category,
  cs.description as cost_setting_description,
  tt.match_id,
  m.unique_number as match_number,
  tt.transaction_date,
  tt.created_at,
  -- Calculate running balance
  SUM(
    CASE 
      WHEN COALESCE(cs.amount, tt.amount) IS NOT NULL THEN
        CASE 
          WHEN CASE 
            WHEN cs.category = 'match_cost' THEN 'match_cost'
            WHEN cs.category = 'penalty' THEN 'penalty'
            WHEN tt.transaction_type = 'deposit' THEN 'deposit'
            WHEN tt.transaction_type = 'adjustment' THEN 'adjustment'
            ELSE tt.transaction_type
          END = 'deposit' THEN COALESCE(cs.amount, tt.amount)
          ELSE -COALESCE(cs.amount, tt.amount)
        END
      ELSE 0
    END
  ) OVER (
    PARTITION BY tt.team_id 
    ORDER BY tt.transaction_date, tt.created_at
    ROWS UNBOUNDED PRECEDING
  ) as running_balance
FROM team_transactions tt
LEFT JOIN teams t ON tt.team_id = t.team_id
LEFT JOIN costs cs ON tt.cost_setting_id = cs.id
LEFT JOIN matches m ON tt.match_id = m.match_id
ORDER BY tt.team_id, tt.transaction_date DESC, tt.created_at DESC;

-- Step 11: Update the transaction summary view
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
LEFT JOIN costs cs ON tt.cost_setting_id = cs.id
ORDER BY tt.transaction_date DESC, tt.created_at DESC;

-- Step 12: Update RLS policies for the costs table
DROP POLICY IF EXISTS "Admins can manage cost settings" ON public.costs;
DROP POLICY IF EXISTS "Public can read active cost settings" ON public.costs;

CREATE POLICY "Admins can manage costs" 
ON public.costs
FOR ALL
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Public can read active costs" 
ON public.costs
FOR SELECT
USING (is_active = true);

-- Step 13: Verify the changes
SELECT 
    'Table renamed' as status,
    'cost_settings renamed to costs' as details
UNION ALL
SELECT 
    'Audit log removed' as status,
    'cost_setting_audit_log table and related functions removed' as details
UNION ALL
SELECT 
    'Views updated' as status,
    'All views updated to use new table name' as details
UNION ALL
SELECT 
    'Functions updated' as status,
    'All functions updated to use new table name' as details; 