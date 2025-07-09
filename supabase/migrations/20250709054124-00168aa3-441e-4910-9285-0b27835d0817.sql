-- Phase 1: Remove unused fields from matches table after verification
-- First check if field_cost and referee_cost are still being used
-- These fields are legacy since we now use cost_settings

ALTER TABLE public.matches 
DROP COLUMN IF EXISTS field_cost,
DROP COLUMN IF EXISTS referee_cost;

-- Phase 2: Create automatic cost settings update system
-- Function to update team_transactions when cost_settings amounts change
CREATE OR REPLACE FUNCTION public.update_related_transactions_on_cost_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the amount has changed
  IF OLD.amount IS DISTINCT FROM NEW.amount THEN
    -- Update all team_transactions that reference this cost_setting
    UPDATE public.team_transactions 
    SET amount = NEW.amount
    WHERE cost_setting_id = NEW.id;
    
    -- Log the change for audit purposes
    INSERT INTO public.cost_setting_audit_log (
      cost_setting_id,
      old_amount,
      new_amount,
      affected_transactions_count,
      changed_at,
      changed_by
    ) 
    SELECT 
      NEW.id,
      OLD.amount,
      NEW.amount,
      (SELECT COUNT(*) FROM public.team_transactions WHERE cost_setting_id = NEW.id),
      NOW(),
      COALESCE(current_setting('app.current_user_id', true)::integer, 0);
    
    -- Update all affected team balances
    PERFORM public.update_team_balances();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log table for cost setting changes
CREATE TABLE IF NOT EXISTS public.cost_setting_audit_log (
  id SERIAL PRIMARY KEY,
  cost_setting_id INTEGER REFERENCES public.cost_settings(id),
  old_amount DECIMAL(10,2),
  new_amount DECIMAL(10,2),
  affected_transactions_count INTEGER,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by INTEGER REFERENCES public.users(user_id)
);

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_transactions_on_cost_change ON public.cost_settings;
CREATE TRIGGER trigger_update_transactions_on_cost_change
  AFTER UPDATE ON public.cost_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_related_transactions_on_cost_change();

-- Phase 3: Fix existing NULL cost_setting_id values and data consistency
-- This extends the existing migration logic to be more robust
DO $$
DECLARE
  match_record RECORD;
  field_cost_setting RECORD;
  referee_cost_setting RECORD;
  transaction_record RECORD;
BEGIN
  -- Get current cost settings
  SELECT * INTO field_cost_setting 
  FROM cost_settings 
  WHERE category = 'match_cost' 
  AND (name ILIKE '%veld%' OR name ILIKE '%field%')
  AND is_active = true 
  LIMIT 1;
  
  SELECT * INTO referee_cost_setting
  FROM cost_settings 
  WHERE category = 'match_cost' 
  AND (name ILIKE '%scheidsrechter%' OR name ILIKE '%referee%')
  AND is_active = true 
  LIMIT 1;
  
  -- Fix NULL cost_setting_id values for existing transactions
  IF field_cost_setting.id IS NOT NULL THEN
    UPDATE team_transactions 
    SET cost_setting_id = field_cost_setting.id,
        amount = field_cost_setting.amount
    WHERE transaction_type = 'match_cost' 
    AND cost_setting_id IS NULL 
    AND (description ILIKE '%veld%' OR description ILIKE '%field%');
  END IF;
  
  IF referee_cost_setting.id IS NOT NULL THEN
    UPDATE team_transactions 
    SET cost_setting_id = referee_cost_setting.id,
        amount = referee_cost_setting.amount
    WHERE transaction_type = 'match_cost' 
    AND cost_setting_id IS NULL 
    AND (description ILIKE '%scheidsrechter%' OR description ILIKE '%referee%');
  END IF;
  
  -- Update all team balances after fixes
  PERFORM update_team_balances();
END $$;

-- Enable RLS on audit log table
ALTER TABLE public.cost_setting_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for audit log
CREATE POLICY "Admins can view cost setting audit log" 
ON public.cost_setting_audit_log 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "System can insert audit log entries" 
ON public.cost_setting_audit_log 
FOR INSERT 
WITH CHECK (true);