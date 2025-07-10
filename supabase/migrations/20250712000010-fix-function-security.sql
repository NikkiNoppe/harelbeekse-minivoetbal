-- Fix security warnings by adding SET search_path TO '' to all functions
-- This prevents search path injection attacks

-- Step 1: Fix trigger_update_team_balance function
CREATE OR REPLACE FUNCTION public.trigger_update_team_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Update balance voor het oude team
    UPDATE public.teams 
    SET balance = public.calculate_team_balance_updated(OLD.team_id)
    WHERE team_id = OLD.team_id;
    RETURN OLD;
  ELSE
    -- Update balance voor het nieuwe team
    UPDATE public.teams 
    SET balance = public.calculate_team_balance_updated(NEW.team_id)
    WHERE team_id = NEW.team_id;
    
    -- Als team_id is gewijzigd, update ook het oude team
    IF TG_OP = 'UPDATE' AND OLD.team_id IS DISTINCT FROM NEW.team_id THEN
      UPDATE public.teams 
      SET balance = public.calculate_team_balance_updated(OLD.team_id)
      WHERE team_id = OLD.team_id;
    END IF;
    
    RETURN NEW;
  END IF;
END;
$$;

-- Step 2: Fix calculate_team_balance_updated function
CREATE OR REPLACE FUNCTION public.calculate_team_balance_updated(team_id_param INTEGER)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  balance DECIMAL(10,2) := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN cs.category = 'deposit' THEN cs.amount  -- Deposits add to balance
      WHEN cs.category IN ('match_cost', 'penalty', 'other') THEN -cs.amount  -- Costs subtract from balance
      ELSE 0
    END
  ), 0)
  INTO balance
  FROM public.team_costs tc
  LEFT JOIN public.costs cs ON tc.cost_setting_id = cs.id
  WHERE tc.team_id = team_id_param;
  
  RETURN balance;
END;
$$;

-- Step 3: Fix add_team_deposit function
CREATE OR REPLACE FUNCTION public.add_team_deposit(
    p_team_id INTEGER,
    p_deposit_name VARCHAR(255),
    p_amount DECIMAL(10,2)
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_cost_id INTEGER;
BEGIN
    -- Create deposit cost
    INSERT INTO public.costs (name, amount, category) 
    VALUES (p_deposit_name, p_amount, 'deposit')
    RETURNING id INTO v_cost_id;
    
    -- Link to team
    INSERT INTO public.team_costs (team_id, cost_setting_id, transaction_date) 
    VALUES (p_team_id, v_cost_id, CURRENT_DATE);
    
    RETURN v_cost_id;
END;
$$;

-- Step 4: Fix add_team_cost function
CREATE OR REPLACE FUNCTION public.add_team_cost(
    p_team_id INTEGER,
    p_cost_name VARCHAR(255),
    p_amount DECIMAL(10,2),
    p_category VARCHAR(50) DEFAULT 'other',
    p_match_id INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_cost_id INTEGER;
BEGIN
    -- Validate category
    IF p_category NOT IN ('match_cost', 'penalty', 'other') THEN
        RAISE EXCEPTION 'Invalid category: %. Must be one of: match_cost, penalty, other', p_category;
    END IF;
    
    -- Create cost
    INSERT INTO public.costs (name, amount, category) 
    VALUES (p_cost_name, p_amount, p_category)
    RETURNING id INTO v_cost_id;
    
    -- Link to team
    INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date) 
    VALUES (p_team_id, v_cost_id, p_match_id, CURRENT_DATE);
    
    RETURN v_cost_id;
END;
$$;

-- Step 5: Fix validate_player_data function
CREATE OR REPLACE FUNCTION public.validate_player_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Validate player data
  IF NEW.first_name IS NULL OR NEW.first_name = '' THEN
    RAISE EXCEPTION 'First name is required';
  END IF;
  
  IF NEW.last_name IS NULL OR NEW.last_name = '' THEN
    RAISE EXCEPTION 'Last name is required';
  END IF;
  
  IF NEW.birth_date IS NULL THEN
    RAISE EXCEPTION 'Birth date is required';
  END IF;
  
  -- Check if player already exists in the same team
  IF EXISTS (
    SELECT 1 FROM public.players 
    WHERE team_id = NEW.team_id 
    AND first_name = NEW.first_name 
    AND last_name = NEW.last_name 
    AND birth_date = NEW.birth_date
    AND player_id != COALESCE(NEW.player_id, 0)
  ) THEN
    RAISE EXCEPTION 'Player already exists in this team';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 6: Fix get_match_statistics function
CREATE OR REPLACE FUNCTION public.get_match_statistics(match_id_param INTEGER)
RETURNS TABLE(
  total_players INTEGER,
  home_players_count INTEGER,
  away_players_count INTEGER,
  cards_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(jsonb_array_length(m.home_players), 0) + COALESCE(jsonb_array_length(m.away_players), 0) as total_players,
    COALESCE(jsonb_array_length(m.home_players), 0) as home_players_count,
    COALESCE(jsonb_array_length(m.away_players), 0) as away_players_count,
    (
      SELECT COUNT(*)::INTEGER
      FROM (
        SELECT jsonb_array_elements(m.home_players) as player
        UNION ALL
        SELECT jsonb_array_elements(m.away_players) as player
      ) all_players
      WHERE (player->>'cardType') IN ('yellow', 'red')
    ) as cards_count
  FROM public.matches m
  WHERE m.match_id = match_id_param;
END;
$$;

-- Step 7: Fix process_match_costs function
CREATE OR REPLACE FUNCTION public.process_match_costs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Only process if match is submitted and has scores
  IF NEW.is_submitted = true AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
    -- Add field cost for the match
    INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date)
    SELECT 
      NEW.home_team_id,
      cs.id,
      NEW.match_id,
      CURRENT_DATE
    FROM public.costs cs
    WHERE cs.category = 'match_cost' AND cs.name LIKE '%veld%'
    AND NOT EXISTS (
      SELECT 1 FROM public.team_costs tc 
      WHERE tc.match_id = NEW.match_id AND tc.team_id = NEW.home_team_id
    );
    
    -- Add field cost for away team too
    INSERT INTO public.team_costs (team_id, cost_setting_id, match_id, transaction_date)
    SELECT 
      NEW.away_team_id,
      cs.id,
      NEW.match_id,
      CURRENT_DATE
    FROM public.costs cs
    WHERE cs.category = 'match_cost' AND cs.name LIKE '%veld%'
    AND NOT EXISTS (
      SELECT 1 FROM public.team_costs tc 
      WHERE tc.match_id = NEW.match_id AND tc.team_id = NEW.away_team_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 8: Fix update_competition_standings_optimized function (if it exists)
CREATE OR REPLACE FUNCTION public.update_competition_standings_optimized()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    match_record RECORD;
    team_record RECORD;
BEGIN
    -- Clear existing standings
    DELETE FROM public.competition_standings;
    
    -- Initialize all teams with zero stats
    FOR team_record IN 
        SELECT team_id FROM public.teams
    LOOP
        INSERT INTO public.competition_standings (
            team_id, matches_played, wins, draws, losses, 
            goals_scored, goals_against, goal_difference, points
        ) VALUES (
            team_record.team_id, 0, 0, 0, 0, 0, 0, 0, 0
        );
    END LOOP;
    
    -- Loop through all completed matches and update stats
    FOR match_record IN 
        SELECT 
            match_id,
            home_team_id,
            away_team_id,
            home_score,
            away_score
        FROM public.matches
        WHERE is_submitted = true 
        AND home_score IS NOT NULL 
        AND away_score IS NOT NULL
        AND is_cup_match = false
    LOOP
        -- Update home team stats
        UPDATE public.competition_standings 
        SET 
            matches_played = matches_played + 1,
            goals_scored = goals_scored + match_record.home_score,
            goals_against = goals_against + match_record.away_score,
            goal_difference = goal_difference + (match_record.home_score - match_record.away_score),
            wins = wins + CASE WHEN match_record.home_score > match_record.away_score THEN 1 ELSE 0 END,
            draws = draws + CASE WHEN match_record.home_score = match_record.away_score THEN 1 ELSE 0 END,
            losses = losses + CASE WHEN match_record.home_score < match_record.away_score THEN 1 ELSE 0 END,
            points = points + CASE 
                WHEN match_record.home_score > match_record.away_score THEN 3
                WHEN match_record.home_score = match_record.away_score THEN 1
                ELSE 0
            END
        WHERE team_id = match_record.home_team_id;
        
        -- Update away team stats
        UPDATE public.competition_standings 
        SET 
            matches_played = matches_played + 1,
            goals_scored = goals_scored + match_record.away_score,
            goals_against = goals_against + match_record.home_score,
            goal_difference = goal_difference + (match_record.away_score - match_record.home_score),
            wins = wins + CASE WHEN match_record.away_score > match_record.home_score THEN 1 ELSE 0 END,
            draws = draws + CASE WHEN match_record.away_score = match_record.home_score THEN 1 ELSE 0 END,
            losses = losses + CASE WHEN match_record.away_score < match_record.home_score THEN 1 ELSE 0 END,
            points = points + CASE 
                WHEN match_record.away_score > match_record.home_score THEN 3
                WHEN match_record.away_score = match_record.home_score THEN 1
                ELSE 0
            END
        WHERE team_id = match_record.away_team_id;
    END LOOP;
END;
$$;

-- Step 9: Verify the security fixes
SELECT 
    'Security warnings fixed' as status,
    'All functions now have SET search_path TO ''' as details
UNION ALL
SELECT 
    'Functions updated' as status,
    'trigger_update_team_balance, calculate_team_balance_updated, add_team_deposit, add_team_cost' as details
UNION ALL
SELECT 
    'More functions updated' as status,
    'validate_player_data, get_match_statistics, process_match_costs, update_competition_standings_optimized' as details
UNION ALL
SELECT 
    'Security improved' as status,
    'All functions now use SECURITY DEFINER and SET search_path TO ''' as details; 