-- Multi-tenant: unique cost names per organization, then copy Harelbeke (1) → Kuurne (2)

-- Global unique indexes block the same cost name in another org
DROP INDEX IF EXISTS public.costs_name_unique;
DROP INDEX IF EXISTS public.costs_name_category_unique;
ALTER TABLE public.costs DROP CONSTRAINT IF EXISTS costs_name_unique;
ALTER TABLE public.costs DROP CONSTRAINT IF EXISTS costs_name_category_unique;

CREATE UNIQUE INDEX IF NOT EXISTS costs_organization_name_unique
  ON public.costs (organization_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS costs_organization_name_category_unique
  ON public.costs (organization_id, name, category);

-- Full cost catalog copy (idempotent on name within org 2)
INSERT INTO public.costs (organization_id, name, amount, category)
SELECT
  2,
  c.name,
  c.amount,
  c.category
FROM public.costs c
WHERE c.organization_id = 1
  AND NOT EXISTS (
    SELECT 1
    FROM public.costs existing
    WHERE existing.organization_id = 2
      AND existing.name = c.name
  );
