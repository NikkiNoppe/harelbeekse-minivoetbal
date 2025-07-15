-- Add function to create deposits with custom date
CREATE OR REPLACE FUNCTION add_team_deposit_with_date(
    p_team_id INTEGER,
    p_deposit_name VARCHAR(255),
    p_amount DECIMAL(10,2),
    p_transaction_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_cost_id INTEGER;
BEGIN
    -- Create deposit cost
    INSERT INTO costs (name, amount, category) 
    VALUES (p_deposit_name, p_amount, 'deposit')
    RETURNING id INTO v_cost_id;
    
    -- Link to team with custom date
    INSERT INTO team_costs (team_id, cost_setting_id, transaction_date) 
    VALUES (p_team_id, v_cost_id, p_transaction_date);
    
    RETURN v_cost_id;
END;
$$; 