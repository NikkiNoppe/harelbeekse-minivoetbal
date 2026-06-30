-- =============================================================================
-- Multi-tenant stap 1: organizations + organization_id op bestaande tabellen
-- Harelbeke = default tenant (id = 1); geen frontend/RPC-wijzigingen in deze migratie.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Organizations-tabel
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
  id integer PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL,
  branding_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT organizations_slug_key UNIQUE (slug)
);

COMMENT ON TABLE public.organizations IS
  'Tenant / organisatie (competitie-vereniging). Styling en content per slug.';
COMMENT ON COLUMN public.organizations.branding_settings IS
  'JSONB: logo-paden, theme-kleuren, sitenaam, contact, enz.';

-- Default tenant: Harelbeke Minivoetbal (idempotent upsert op id)
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

-- ---------------------------------------------------------------------------
-- 2. organization_id toevoegen aan alle bestaande public-tabellen
--    Uitzonderingen: auth-meta + organizations zelf
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_default_org_id integer := 1;
  v_table text;
  v_null_count bigint;
  v_excluded text[] := ARRAY[
    'organizations',
    'auth_rate_limits',
    'password_reset_tokens',
    'user_sessions'
  ];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = v_default_org_id) THEN
    RAISE EXCEPTION 'Default organization Harelbeke ontbreekt; migratie afgebroken vóór backfill';
  END IF;

  FOR v_table IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r' -- ordinary tables only (geen views)
      AND NOT (c.relname = ANY (v_excluded))
    ORDER BY c.relname
  LOOP
    -- 2a. Kolom nullable toevoegen (geen bestaande data gewist)
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS organization_id integer',
      v_table
    );

    -- 2b. Alleen NULL-rijen backfillen (bestaande organization_id blijft intact)
    EXECUTE format(
      'UPDATE public.%I SET organization_id = $1 WHERE organization_id IS NULL',
      v_table
    ) USING v_default_org_id;

    -- 2c. Veiligheidscheck vóór NOT NULL
    EXECUTE format(
      'SELECT COUNT(*) FROM public.%I WHERE organization_id IS NULL',
      v_table
    ) INTO v_null_count;

    IF v_null_count > 0 THEN
      RAISE EXCEPTION 'Backfill mislukt voor public.%: % rijen zonder organization_id', v_table, v_null_count;
    END IF;

    -- 2d. NOT NULL afdwingen
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN organization_id SET NOT NULL',
      v_table
    );

    -- 2e. Foreign key (idempotent)
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

    -- 2f. Index voor tenant-filters
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I (organization_id)',
      'idx_' || v_table || '_organization_id',
      v_table
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. RLS op organizations (defense-in-depth; policies volgen in latere stap)
-- ---------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.organizations TO anon, authenticated;

-- Publiek mag tenant-metadata lezen (slug/branding voor site-resolver)
DROP POLICY IF EXISTS "Public can read organizations" ON public.organizations;
CREATE POLICY "Public can read organizations"
ON public.organizations
FOR SELECT
TO anon, authenticated
USING (true);
