
-- Backfill missing referee costs for cup semifinals (and any submitted match
-- with a text referee but no assigned_referee_id that was missed by the gate)
WITH ref_cost AS (
  SELECT id, amount FROM public.costs WHERE category = 'match_cost' AND lower(name) LIKE '%scheids%' LIMIT 1
),
candidates AS (
  SELECT m.match_id, m.match_date, t.team_id
  FROM public.matches m
  CROSS JOIN LATERAL (VALUES (m.home_team_id), (m.away_team_id)) AS t(team_id)
  WHERE m.is_submitted = true
    AND m.home_score IS NOT NULL AND m.away_score IS NOT NULL
    AND m.skip_auto_match_costs = false
    AND COALESCE(NULLIF(trim(m.referee), ''), NULL) IS NOT NULL
    AND m.assigned_referee_id IS NULL
    AND t.team_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.team_costs tc
      WHERE tc.match_id = m.match_id
        AND tc.team_id = t.team_id
        AND tc.cost_setting_id = (SELECT id FROM ref_cost)
    )
    -- exclude forfait matches
    AND NOT EXISTS (
      SELECT 1 FROM public.team_costs tcp
      JOIN public.costs c ON c.id = tcp.cost_setting_id
      WHERE tcp.match_id = m.match_id
        AND c.category = 'penalty'
        AND public.cost_name_implies_match_cost_suppression(c.name)
    )
)
INSERT INTO public.team_costs (team_id, cost_setting_id, amount, transaction_date, match_id, is_auto_card_penalty)
SELECT c.team_id, (SELECT id FROM ref_cost), (SELECT amount FROM ref_cost), c.match_date::date, c.match_id, false
FROM candidates c;
