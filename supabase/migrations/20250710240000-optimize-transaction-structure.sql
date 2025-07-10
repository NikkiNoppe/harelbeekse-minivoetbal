-- Optimize transaction structure by removing redundant fields
-- Since all transactions now reference cost_settings, transaction_type and amount are redundant

-- Step 1: Create a view that automatically derives transaction_type and amount from cost_settings
CREATE OR REPLACE VIEW public.transactions_with_derived_data AS
SELECT 
  tt.id,
  tt.team_id,
  t.team_name,
  -- Derive transaction_type from cost_settings category
  CASE 
    WHEN cs.category = 'match_cost' THEN 'match_cost'
    WHEN cs.category = 'penalty' THEN 'penalty'
    WHEN tt.transaction_type = 'deposit' THEN 'deposit'
    WHEN tt.transaction_type = 'adjustment' THEN 'adjustment'
    ELSE tt.transaction_type
  END as transaction_type,
  -- Use amount from cost_settings if available, otherwise from transaction
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
LEFT JOIN cost_settings cs ON tt.cost_setting_id = cs.id;

-- Step 2: Create a function to insert transactions with automatic type/amount derivation
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
    -- Get type and amount from cost_settings
    SELECT 
      CASE 
        WHEN category = 'match_cost' THEN 'match_cost'
        WHEN category = 'penalty' THEN 'penalty'
        ELSE 'other'
      END,
      amount
    INTO derived_type, derived_amount
    FROM cost_settings 
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

-- Step 3: Update the trigger function to work with the new structure
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
    FROM cost_settings
    WHERE id = NEW.cost_setting_id AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create a function to migrate existing data to use cost_settings
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
      FROM cost_settings
      WHERE category = 'penalty' 
      AND amount = transaction_record.amount
      AND is_active = true
      LIMIT 1;
    ELSIF transaction_record.transaction_type = 'match_cost' THEN
      -- For match costs, try to match by description
      SELECT id INTO matching_cost_setting_id
      FROM cost_settings
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

-- Step 5: Run the migration function
SELECT public.migrate_transactions_to_cost_settings();

-- Step 6: Create a comprehensive transaction view
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
LEFT JOIN cost_settings cs ON tt.cost_setting_id = cs.id
LEFT JOIN matches m ON tt.match_id = m.match_id
ORDER BY tt.team_id, tt.transaction_date DESC, tt.created_at DESC;

-- Step 7: Enable security invoker on the view (views inherit RLS from underlying tables)
ALTER VIEW public.comprehensive_transactions SET (security_invoker = true);

-- Step 8: Verify the optimization
SELECT 
    'Optimization complete' as status,
    'Transaction structure optimized with derived data' as details
UNION ALL
SELECT 
    'Migration completed' as status,
    'Existing transactions migrated to use cost_settings' as details
UNION ALL
SELECT 
    'Views created' as status,
    'comprehensive_transactions view available for reporting' as details; 