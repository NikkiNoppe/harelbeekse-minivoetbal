-- Fix for cost_setting_audit_log table issue
-- This migration ensures the audit log table exists and is properly configured

-- Create the audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cost_setting_audit_log (
  id SERIAL PRIMARY KEY,
  cost_setting_id INTEGER REFERENCES public.cost_settings(id),
  old_amount DECIMAL(10,2),
  new_amount DECIMAL(10,2),
  affected_transactions_count INTEGER,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by INTEGER REFERENCES public.users(user_id)
);

-- Enable RLS on audit log table
ALTER TABLE public.cost_setting_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view cost setting audit log" ON public.cost_setting_audit_log;
DROP POLICY IF EXISTS "System can insert audit log entries" ON public.cost_setting_audit_log;

-- Create RLS policies for audit log
CREATE POLICY "Admins can view cost setting audit log" 
ON public.cost_setting_audit_log 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "System can insert audit log entries" 
ON public.cost_setting_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Recreate the trigger function to ensure it's working correctly
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_transactions_on_cost_change ON public.cost_settings;

-- Create the trigger
CREATE TRIGGER trigger_update_transactions_on_cost_change
  AFTER UPDATE ON public.cost_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_related_transactions_on_cost_change(); 