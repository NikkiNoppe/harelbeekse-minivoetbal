-- Fix delete_team_costs_for_match function to satisfy WHERE clause security requirement
CREATE OR REPLACE FUNCTION public.delete_team_costs_for_match(
  p_match_id INTEGER,
  p_cost_setting_ids INTEGER[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  RAISE NOTICE '🟣 [HELPER delete_team_costs_for_match] ========== START ==========';
  RAISE NOTICE '🟣 [HELPER] Match ID: %, Cost Setting IDs: %', p_match_id, p_cost_setting_ids;
  
  -- Parameter validatie
  IF p_match_id IS NULL OR p_cost_setting_ids IS NULL OR array_length(p_cost_setting_ids, 1) IS NULL THEN
    RAISE NOTICE '🟣 [HELPER] Invalid parameters, skipping delete';
    RAISE NOTICE '🟣 [HELPER] ========== END (invalid params) ==========';
    RETURN;
  END IF;
  
  -- Check existing records before delete
  SELECT COUNT(*) INTO v_deleted_count
  FROM public.team_costs
  WHERE match_id = p_match_id 
    AND cost_setting_id = ANY(p_cost_setting_ids);
  
  RAISE NOTICE '🟣 [HELPER] Found % existing records to delete', v_deleted_count;
  
  -- Only delete if there are records to delete
  IF v_deleted_count > 0 THEN
    -- DELETE with explicit subquery to satisfy security requirements
    DELETE FROM public.team_costs
    WHERE id IN (
      SELECT id 
      FROM public.team_costs
      WHERE match_id = p_match_id 
        AND cost_setting_id = ANY(p_cost_setting_ids)
    );
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '🟣 [HELPER] Deleted % records', v_deleted_count;
  ELSE
    RAISE NOTICE '🟣 [HELPER] No records to delete';
  END IF;
  
  RAISE NOTICE '🟣 [HELPER] ========== END ==========';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ [HELPER] Error in delete_team_costs_for_match: %', SQLERRM;
    RAISE WARNING '❌ [HELPER] Error details: SQLSTATE=%, SQLERRM=%', SQLSTATE, SQLERRM;
    RAISE NOTICE '🟣 [HELPER] ========== END (error) ==========';
    RAISE;
END;
$$;