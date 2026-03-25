-- Delete team_cost with admin verification
CREATE OR REPLACE FUNCTION public.delete_team_cost_as_admin(
  p_user_id INTEGER,
  p_cost_id INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
  v_deleted_count INTEGER;
BEGIN
  SELECT role::text INTO v_role FROM users WHERE user_id = p_user_id;
  IF v_role IS NULL OR v_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen kosten verwijderen');
  END IF;

  DELETE FROM public.team_costs WHERE id = p_cost_id;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  IF v_deleted_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kost niet gevonden');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Kost succesvol verwijderd');
END;
$$;

-- Update team_cost with admin verification
CREATE OR REPLACE FUNCTION public.update_team_cost_as_admin(
  p_user_id INTEGER,
  p_cost_id INTEGER,
  p_amount NUMERIC DEFAULT NULL,
  p_transaction_date TIMESTAMPTZ DEFAULT NULL,
  p_cost_setting_id INTEGER DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
  v_updated_count INTEGER;
BEGIN
  SELECT role::text INTO v_role FROM users WHERE user_id = p_user_id;
  IF v_role IS NULL OR v_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen kosten bijwerken');
  END IF;

  UPDATE public.team_costs
  SET
    amount = COALESCE(p_amount, amount),
    transaction_date = COALESCE(p_transaction_date, transaction_date),
    cost_setting_id = COALESCE(p_cost_setting_id, cost_setting_id)
  WHERE id = p_cost_id;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  IF v_updated_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kost niet gevonden');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Kost succesvol bijgewerkt');
END;
$$;

-- Add team_cost with admin verification
CREATE OR REPLACE FUNCTION public.add_team_cost_as_admin(
  p_user_id INTEGER,
  p_team_id INTEGER,
  p_cost_setting_id INTEGER,
  p_amount NUMERIC,
  p_transaction_date DATE DEFAULT CURRENT_DATE,
  p_match_id INTEGER DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
  v_new_id INTEGER;
BEGIN
  SELECT role::text INTO v_role FROM users WHERE user_id = p_user_id;
  IF v_role IS NULL OR v_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alleen admins kunnen kosten toevoegen');
  END IF;

  INSERT INTO public.team_costs (team_id, cost_setting_id, amount, transaction_date, match_id)
  VALUES (p_team_id, p_cost_setting_id, p_amount, p_transaction_date, p_match_id)
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('success', true, 'message', 'Kost succesvol toegevoegd', 'id', v_new_id);
END;
$$;