-- Migration: Final security and performance fixes
-- This migration addresses:
-- 1. Security warnings for functions missing SET search_path TO ''
-- 2. Performance warnings for unindexed foreign keys
-- 3. Remove the unused index we just created

-- Fix function security warnings by adding SET search_path TO ''
-- Function: insert_transaction_with_auto_data
CREATE OR REPLACE FUNCTION public.insert_transaction_with_auto_data(
    p_team_id integer,
    p_cost_setting_id integer,
    p_amount numeric,
    p_date date DEFAULT CURRENT_DATE,
    p_match_id integer DEFAULT NULL,
    p_notes text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_transaction_id integer;
BEGIN
    -- Insert into team_costs table
    INSERT INTO team_costs (team_id, cost_setting_id, amount, date, match_id, notes)
    VALUES (p_team_id, p_cost_setting_id, p_amount, p_date, p_match_id, p_notes)
    RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$function$;

-- Function: validate_player_data
CREATE OR REPLACE FUNCTION public.validate_player_data(
    p_name text,
    p_team_id integer DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_name_count integer;
BEGIN
    -- Check if name is not null or empty
    IF p_name IS NULL OR trim(p_name) = '' THEN
        RETURN false;
    END IF;
    
    -- Check if name already exists for the same team
    SELECT COUNT(*) INTO v_name_count
    FROM players
    WHERE LOWER(name) = LOWER(p_name)
    AND (team_id = p_team_id OR (p_team_id IS NULL AND team_id IS NULL));
    
    RETURN v_name_count = 0;
END;
$function$;

-- Function: log_cost_setting_change
CREATE OR REPLACE FUNCTION public.log_cost_setting_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    -- For now, just return the record without logging
    -- Audit logging can be re-implemented later if needed
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Add missing foreign key indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matches_home_team_id ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team_id ON matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_team_costs_team_id ON team_costs(team_id);
CREATE INDEX IF NOT EXISTS idx_team_costs_cost_setting_id ON team_costs(cost_setting_id);
CREATE INDEX IF NOT EXISTS idx_team_costs_match_id ON team_costs(match_id);

-- Remove the unused index we just created
DROP INDEX IF EXISTS idx_team_users_user_id; 