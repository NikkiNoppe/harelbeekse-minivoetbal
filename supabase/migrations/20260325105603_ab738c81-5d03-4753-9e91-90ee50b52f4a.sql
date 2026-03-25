
-- New RPC: manage_team_cost_for_match
-- Allows both admin and referee (for their assigned matches) to delete/update team_costs
-- With detailed RAISE NOTICE logging for debuggability

CREATE OR REPLACE FUNCTION public.manage_team_cost_for_match(
  p_user_id integer,
  p_cost_id integer,
  p_operation text, -- 'delete' or 'update'
  p_amount numeric DEFAULT NULL,
  p_cost_setting_id integer DEFAULT NULL,
  p_team_id integer DEFAULT NULL,
  p_transaction_date timestamp with time zone DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
  v_username TEXT;
  v_cost_record RECORD;
  v_match_id INTEGER;
  v_affected INTEGER;
BEGIN
  -- 1. Get user role
  SELECT role::text, username INTO v_role, v_username FROM users WHERE user_id = p_user_id;
  
  RAISE NOTICE '[PENALTY-CRUD] Operation: %, costId: %, userId: %, role: %', p_operation, p_cost_id, p_user_id, v_role;
  
  IF v_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gebruiker niet gevonden');
  END IF;

  -- 2. Check the team_cost record exists and get its match_id
  SELECT tc.id, tc.match_id, tc.team_id, tc.amount, tc.cost_setting_id
  INTO v_cost_record
  FROM team_costs tc
  WHERE tc.id = p_cost_id;

  IF v_cost_record IS NULL THEN
    RAISE NOTICE '[PENALTY-CRUD] Cost record % not found', p_cost_id;
    RETURN jsonb_build_object('success', false, 'error', 'Kost niet gevonden');
  END IF;

  v_match_id := v_cost_record.match_id;

  -- 3. Authorization check
  IF v_role = 'admin' THEN
    -- Admin: always allowed
    RAISE NOTICE '[PENALTY-CRUD] Admin access granted for user %', p_user_id;
  ELSIF v_role = 'referee' THEN
    -- Referee: only for costs linked to matches they are assigned to
    IF v_match_id IS NULL THEN
      RAISE NOTICE '[PENALTY-CRUD] Referee denied: cost % has no match_id', p_cost_id;
      RETURN jsonb_build_object('success', false, 'error', 'Scheidsrechters kunnen alleen kosten beheren die aan een wedstrijd gekoppeld zijn');
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM matches m
      WHERE m.match_id = v_match_id
      AND (m.assigned_referee_id = p_user_id OR m.referee = v_username)
    ) THEN
      RAISE NOTICE '[PENALTY-CRUD] Referee % denied: not assigned to match %', p_user_id, v_match_id;
      RETURN jsonb_build_object('success', false, 'error', 'Je bent niet toegewezen als scheidsrechter voor deze wedstrijd');
    END IF;
    
    RAISE NOTICE '[PENALTY-CRUD] Referee access granted for user % on match %', p_user_id, v_match_id;
  ELSE
    RAISE NOTICE '[PENALTY-CRUD] Access denied for role %', v_role;
    RETURN jsonb_build_object('success', false, 'error', 'Onvoldoende rechten');
  END IF;

  -- 4. Execute operation
  IF p_operation = 'delete' THEN
    DELETE FROM team_costs WHERE id = p_cost_id;
    GET DIAGNOSTICS v_affected = ROW_COUNT;
    RAISE NOTICE '[PENALTY-CRUD] DELETE executed: costId=%, affected=%', p_cost_id, v_affected;
    
    IF v_affected = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Kost niet gevonden of al verwijderd');
    END IF;
    
    RETURN jsonb_build_object('success', true, 'message', 'Kost succesvol verwijderd', 'deleted_id', p_cost_id);
    
  ELSIF p_operation = 'update' THEN
    UPDATE team_costs
    SET
      amount = COALESCE(p_amount, amount),
      cost_setting_id = COALESCE(p_cost_setting_id, cost_setting_id),
      team_id = COALESCE(p_team_id, team_id),
      transaction_date = COALESCE(p_transaction_date, transaction_date)
    WHERE id = p_cost_id;
    GET DIAGNOSTICS v_affected = ROW_COUNT;
    RAISE NOTICE '[PENALTY-CRUD] UPDATE executed: costId=%, affected=%, newAmount=%, newCostSettingId=%, newTeamId=%', 
      p_cost_id, v_affected, p_amount, p_cost_setting_id, p_team_id;
    
    IF v_affected = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Kost niet gevonden');
    END IF;
    
    RETURN jsonb_build_object('success', true, 'message', 'Kost succesvol bijgewerkt');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Ongeldige operatie: ' || p_operation);
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '[PENALTY-CRUD] ERROR: %', SQLERRM;
  RETURN jsonb_build_object('success', false, 'error', 'Database fout: ' || SQLERRM);
END;
$$;
