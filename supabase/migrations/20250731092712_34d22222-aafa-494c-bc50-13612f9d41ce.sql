-- Check what triggers are active on team_costs table
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.action_statement,
    t.action_timing
FROM information_schema.triggers t
WHERE t.event_object_table = 'team_costs'
ORDER BY t.trigger_name;