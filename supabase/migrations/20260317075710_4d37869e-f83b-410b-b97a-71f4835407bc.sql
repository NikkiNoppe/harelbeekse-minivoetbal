INSERT INTO public.costs (name, amount, category, is_active, description)
SELECT 'Boete te laat ingevuld', 5.00, 'penalty', true, 'Automatische boete wanneer wedstrijdblad te laat wordt ingevuld'
WHERE NOT EXISTS (SELECT 1 FROM public.costs WHERE name = 'Boete te laat ingevuld' AND category = 'penalty');