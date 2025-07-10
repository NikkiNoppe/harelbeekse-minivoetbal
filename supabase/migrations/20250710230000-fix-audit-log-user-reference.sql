-- Fix audit log user reference issue
-- The audit log is trying to insert changed_by = 0 which doesn't exist in users table

-- Step 1: Make the changed_by column nullable and add a default
ALTER TABLE public.cost_setting_audit_log 
ALTER COLUMN changed_by DROP NOT NULL;

-- Step 2: Update the trigger function to handle missing user IDs properly
CREATE OR REPLACE FUNCTION public.update_related_transactions_on_cost_change()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id INTEGER;
BEGIN
  -- Only proceed if the amount has changed
  IF OLD.amount IS DISTINCT FROM NEW.amount THEN
    -- Update all team_transactions that reference this cost_setting
    UPDATE public.team_transactions 
    SET amount = NEW.amount
    WHERE cost_setting_id = NEW.id;
    
    -- Try to get current user ID, default to NULL if not available
    BEGIN
      current_user_id := COALESCE(current_setting('app.current_user_id', true)::integer, NULL);
    EXCEPTION
      WHEN OTHERS THEN
        current_user_id := NULL;
    END;
    
    -- Log the change for audit purposes (only if we have a valid user ID)
    IF current_user_id IS NOT NULL THEN
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
        current_user_id;
    END IF;
    
    -- Update all affected team balances
    PERFORM public.update_team_balances();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Update existing audit log entries to have NULL changed_by instead of 0
UPDATE public.cost_setting_audit_log 
SET changed_by = NULL 
WHERE changed_by = 0 OR changed_by IS NULL;

-- Step 4: Create a function to manually log cost setting changes
CREATE OR REPLACE FUNCTION public.log_cost_setting_change(
  p_cost_setting_id INTEGER,
  p_old_amount DECIMAL(10,2),
  p_new_amount DECIMAL(10,2),
  p_user_id INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.cost_setting_audit_log (
    cost_setting_id,
    old_amount,
    new_amount,
    affected_transactions_count,
    changed_at,
    changed_by
  ) 
  SELECT 
    p_cost_setting_id,
    p_old_amount,
    p_new_amount,
    (SELECT COUNT(*) FROM public.team_transactions WHERE cost_setting_id = p_cost_setting_id),
    NOW(),
    p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Update RLS policies to allow NULL changed_by
DROP POLICY IF EXISTS "System can insert audit log entries" ON public.cost_setting_audit_log;
CREATE POLICY "System can insert audit log entries" 
ON public.cost_setting_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Step 6: Add a policy to allow viewing audit logs with NULL changed_by
CREATE POLICY "Admins can view all audit log entries" 
ON public.cost_setting_audit_log 
FOR SELECT 
USING (is_admin_user() OR changed_by IS NULL); 