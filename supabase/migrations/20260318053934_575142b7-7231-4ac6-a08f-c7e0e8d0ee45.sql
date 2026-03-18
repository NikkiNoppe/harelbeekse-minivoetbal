
CREATE OR REPLACE FUNCTION public.calculate_team_balance_updated(team_id_param integer)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  balance DECIMAL(10,2) := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN cs.category = 'deposit' THEN COALESCE(tc.amount, cs.amount)
      WHEN cs.category IN ('match_cost', 'penalty', 'other') THEN -COALESCE(tc.amount, cs.amount)
      ELSE 0
    END
  ), 0)
  INTO balance
  FROM public.team_costs tc
  LEFT JOIN public.costs cs ON tc.cost_setting_id = cs.id
  WHERE tc.team_id = team_id_param;
  
  RETURN balance;
END;
$function$;
