
ALTER TABLE public.team_costs 
ALTER COLUMN transaction_date TYPE timestamptz 
USING transaction_date::timestamptz;

ALTER TABLE public.team_costs 
ALTER COLUMN transaction_date SET DEFAULT now();
