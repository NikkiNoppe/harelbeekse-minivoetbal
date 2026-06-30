-- =============================================================================
-- Multi-tenant: organization_id van uuid naar integer (default tenant id = 1)
-- Geen dataverlies: alleen type-conversie + FK's opnieuw leggen.
-- =============================================================================

DO $$
DECLARE
  v_table text;
  v_excluded text[] := ARRAY[
    'organizations',
    'auth_rate_limits',
    'password_reset_tokens',
    'user_sessions'
  ];
BEGIN
  -- 1. Foreign keys tijdelijk verwijderen
  FOR v_table IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT (c.relname = ANY (v_excluded))
      AND EXISTS (
        SELECT 1
        FROM pg_attribute a
        WHERE a.attrelid = c.oid
          AND a.attname = 'organization_id'
          AND NOT a.attisdropped
      )
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
      v_table,
      v_table || '_organization_id_fkey'
    );
  END LOOP;

  -- 2. Child-kolommen: uuid -> integer (alle bestaande rijen worden 1)
  FOR v_table IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT (c.relname = ANY (v_excluded))
      AND EXISTS (
        SELECT 1
        FROM pg_attribute a
        WHERE a.attrelid = c.oid
          AND a.attname = 'organization_id'
          AND NOT a.attisdropped
      )
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN organization_id TYPE integer USING 1',
      v_table
    );
  END LOOP;
END $$;

-- 3. organizations.id: uuid -> integer
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_pkey;
ALTER TABLE public.organizations
  ALTER COLUMN id TYPE integer USING 1;
ALTER TABLE public.organizations ADD PRIMARY KEY (id);

-- 4. Zekerstellen dat Harelbeke op id = 1 staat
INSERT INTO public.organizations (id, name, slug, branding_settings)
VALUES (
  1,
  'Harelbeekse Minivoetbal Competitie',
  'harelbeke',
  jsonb_build_object(
    'displayName', 'Harelbeekse Minivoetbal Competitie',
    'shortName', 'Minivoetbal',
    'siteUrl', 'https://harelbekeminivoetbal.be'
  )
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  branding_settings = EXCLUDED.branding_settings;

-- 5. Foreign keys opnieuw leggen
DO $$
DECLARE
  v_table text;
  v_excluded text[] := ARRAY[
    'organizations',
    'auth_rate_limits',
    'password_reset_tokens',
    'user_sessions'
  ];
BEGIN
  FOR v_table IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT (c.relname = ANY (v_excluded))
      AND EXISTS (
        SELECT 1
        FROM pg_attribute a
        WHERE a.attrelid = c.oid
          AND a.attname = 'organization_id'
          AND NOT a.attisdropped
      )
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE nsp.nspname = 'public'
        AND rel.relname = v_table
        AND con.conname = v_table || '_organization_id_fkey'
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I
           ADD CONSTRAINT %I
           FOREIGN KEY (organization_id)
           REFERENCES public.organizations (id)
           ON DELETE RESTRICT',
        v_table,
        v_table || '_organization_id_fkey'
      );
    END IF;
  END LOOP;
END $$;
