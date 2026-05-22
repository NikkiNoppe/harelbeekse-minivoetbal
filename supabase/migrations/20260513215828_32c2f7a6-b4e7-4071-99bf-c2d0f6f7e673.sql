INSERT INTO public.team_costs (team_id, cost_setting_id, amount, transaction_date, match_id, is_auto_card_penalty)
SELECT 1, 3, 5.00, '2026-05-11', 2261, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_costs
  WHERE match_id = 2261 AND team_id = 1 AND cost_setting_id = 3 AND is_auto_card_penalty = true
);