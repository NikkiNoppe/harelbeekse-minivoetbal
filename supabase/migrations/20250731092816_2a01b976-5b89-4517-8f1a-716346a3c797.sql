-- Remove the problematic trigger that tries to update non-existent balance column
DROP TRIGGER IF EXISTS trigger_update_team_balance_on_cost ON public.team_costs;

-- Also remove the trigger function if it exists and is problematic
DROP FUNCTION IF EXISTS public.trigger_update_team_balance();