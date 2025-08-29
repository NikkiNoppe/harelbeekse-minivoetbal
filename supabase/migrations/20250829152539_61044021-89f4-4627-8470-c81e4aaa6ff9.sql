-- Clean up duplicate admin_match_forms entries
DELETE FROM public.application_settings 
WHERE id IN (56, 57, 58) 
AND setting_name IN ('admin_match_forms_beker', 'admin_match_forms_competitie', 'admin_match_forms_playoff');