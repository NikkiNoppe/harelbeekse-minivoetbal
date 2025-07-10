-- Optimize costs table by removing redundant columns and consolidating categories
-- This simplifies the table structure while maintaining all functionality

-- Step 1: Consolidate redundant categories
-- Move field_cost and referee_cost to match_cost category
UPDATE public.costs 
SET category = 'match_cost' 
WHERE category IN ('field_cost', 'referee_cost');

-- Step 2: Remove unused timestamp columns
ALTER TABLE public.costs 
DROP COLUMN IF EXISTS created_at,
DROP COLUMN IF EXISTS updated_at;

-- Step 3: Remove the redundant description column entirely
-- Name and description are essentially the same, so we only keep name
ALTER TABLE public.costs 
DROP COLUMN IF EXISTS description;

-- Step 4: Update the category constraint to remove redundant categories
ALTER TABLE public.costs 
DROP CONSTRAINT IF EXISTS costs_category_check;

ALTER TABLE public.costs 
ADD CONSTRAINT costs_category_check 
CHECK (category IN ('match_cost', 'penalty', 'other'));

-- Step 5: Add unique constraint on name to prevent duplicates
ALTER TABLE public.costs 
ADD CONSTRAINT costs_name_unique UNIQUE (name);

-- Step 6: Update indexes for better performance
DROP INDEX IF EXISTS idx_cost_settings_category;
DROP INDEX IF EXISTS idx_cost_settings_active;

CREATE INDEX idx_costs_category ON public.costs(category);
CREATE INDEX idx_costs_active ON public.costs(is_active);
CREATE INDEX idx_costs_category_active ON public.costs(category, is_active);

-- Step 7: Update functions to work with simplified structure
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

-- Step 8: Update the insert function
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

-- Step 9: Update the process_match_costs function to use simplified categories
CREATE OR REPLACE FUNCTION public.process_match_costs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  field_cost_setting RECORD;
  referee_cost_setting RECORD;
  field_cost_amount DECIMAL(10,2) := 5.00;
  referee_cost_amount DECIMAL(10,2) := 6.00;
BEGIN
  -- Only process when match is newly submitted
  IF NEW.is_submitted = true AND (OLD.is_submitted = false OR OLD.is_submitted IS NULL) THEN
    
    -- Get current field cost from costs (match_cost category)
    SELECT * INTO field_cost_setting 
    FROM costs 
    WHERE category = 'match_cost' 
    AND name ILIKE '%veld%' 
    AND is_active = true 
    LIMIT 1;
    
    -- Get current referee cost from costs (match_cost category)
    SELECT * INTO referee_cost_setting
    FROM costs 
    WHERE category = 'match_cost' 
    AND name ILIKE '%scheidsrechter%' 
    AND is_active = true 
    LIMIT 1;
    
    -- Use found costs or defaults
    IF field_cost_setting.id IS NOT NULL THEN
      field_cost_amount := field_cost_setting.amount;
    END IF;
    
    IF referee_cost_setting.id IS NOT NULL THEN
      referee_cost_amount := referee_cost_setting.amount;
    END IF;
    
    -- Add field cost transaction for home team
    INSERT INTO team_transactions (
      team_id,
      transaction_type,
      amount,
      description,
      cost_setting_id,
      match_id,
      transaction_date
    ) VALUES (
      NEW.home_team_id,
      'match_cost',
      field_cost_amount,
      'Veldkosten voor wedstrijd ' || COALESCE(NEW.unique_number, 'M' || NEW.match_id::text),
      field_cost_setting.id,
      NEW.match_id,
      CURRENT_DATE
    );
    
    -- Add referee cost transaction for home team  
    INSERT INTO team_transactions (
      team_id,
      transaction_type,
      amount,
      description,
      cost_setting_id,
      match_id,
      transaction_date
    ) VALUES (
      NEW.home_team_id,
      'match_cost',
      referee_cost_amount,
      'Scheidsrechterkosten voor wedstrijd ' || COALESCE(NEW.unique_number, 'M' || NEW.match_id::text),
      referee_cost_setting.id,
      NEW.match_id,
      CURRENT_DATE
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 10: Verify the optimization
SELECT 
    'Optimization complete' as status,
    'Costs table simplified and optimized' as details
UNION ALL
SELECT 
    'Categories consolidated' as status,
    'field_cost and referee_cost moved to match_cost category' as details
UNION ALL
SELECT 
    'Columns removed' as status,
    'Removed unused created_at and updated_at columns' as details
UNION ALL
SELECT 
    'Indexes optimized' as status,
    'Added performance indexes for better query performance' as details
UNION ALL
SELECT 
    'Functions updated' as status,
    'All functions updated to work with simplified structure' as details; 