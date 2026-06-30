-- =============================================================================
-- Zet organization_id als eerste kolom (PostgreSQL heeft geen ALTER COLUMN FIRST)
-- Veilig: tabel-herbouw met policies, triggers, indexen en FK's behouden.
-- =============================================================================

CREATE OR REPLACE FUNCTION private.reorder_organization_id_first(p_table text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_old text := p_table || '__reorder_old';
  v_cols text;
  v_select text;
  v_con record;
  v_idx record;
  v_pol record;
  v_cross_pol record;
  v_trg record;
  v_col record;
  v_fn record;
  v_first_attnum smallint;
  v_old_reg regclass;
  v_old_oid oid;
  v_cross_pols jsonb := '[]'::jsonb;
  v_fn_defs text[] := ARRAY[]::text[];
  v_fn_def text;
BEGIN
  v_old_reg := to_regclass(format('public.%I', p_table));
  IF v_old_reg IS NULL THEN
    RAISE EXCEPTION 'Tabel public.% ontbreekt', p_table;
  END IF;

  SELECT a.attnum
  INTO v_first_attnum
  FROM pg_attribute a
  WHERE a.attrelid = v_old_reg
    AND a.attname = 'organization_id'
    AND NOT a.attisdropped;

  IF v_first_attnum IS NULL THEN
    RETURN;
  END IF;

  IF v_first_attnum = 1 THEN
    RETURN;
  END IF;

  v_old_oid := v_old_reg;
  EXECUTE format('ALTER TABLE public.%I RENAME TO %I', p_table, v_old);

  -- Indexnamen op oude tabel hernoemen (anders clash bij PRIMARY KEY/UNIQUE op nieuwe tabel)
  FOR v_idx IN
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = v_old
  LOOP
    EXECUTE format(
      'ALTER INDEX IF EXISTS public.%I RENAME TO %I',
      v_idx.indexname,
      v_old || '_' || v_idx.indexname
    );
  END LOOP;

  SELECT string_agg(col_line, E',\n  ')
  INTO v_cols
  FROM (
    SELECT
      0 AS ord,
      format(
        '%I %s%s%s',
        a.attname,
        pg_catalog.format_type(a.atttypid, a.atttypmod),
        CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END,
        CASE
          WHEN ad.adbin IS NOT NULL THEN format(' DEFAULT %s', pg_get_expr(ad.adbin, ad.adrelid))
          ELSE ''
        END
      ) AS col_line
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
    WHERE c.relname = v_old
      AND a.attname = 'organization_id'
      AND a.attnum > 0
      AND NOT a.attisdropped
    UNION ALL
    SELECT
      a.attnum AS ord,
      format(
        '%I %s%s%s',
        a.attname,
        pg_catalog.format_type(a.atttypid, a.atttypmod),
        CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END,
        CASE
          WHEN ad.adbin IS NOT NULL THEN format(' DEFAULT %s', pg_get_expr(ad.adbin, ad.adrelid))
          ELSE ''
        END
      ) AS col_line
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
    WHERE c.relname = v_old
      AND a.attname <> 'organization_id'
      AND a.attnum > 0
      AND NOT a.attisdropped
  ) parts;

  EXECUTE format('CREATE TABLE public.%I (%s)', p_table, v_cols);

  FOR v_con IN
    SELECT con.conname, pg_get_constraintdef(con.oid) AS def
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    WHERE c.relname = v_old
      AND con.contype IN ('p', 'c')  -- UNIQUE via pg_indexes (voorkomt dubbele index-namen)
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I %s',
      p_table,
      regexp_replace(v_con.conname, '^' || v_old || '_', ''),
      v_con.def
    );
  END LOOP;

  SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY CASE WHEN a.attname = 'organization_id' THEN 0 ELSE a.attnum END)
  INTO v_select
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  WHERE c.relname = v_old
    AND a.attnum > 0
    AND NOT a.attisdropped;

  EXECUTE format(
    'INSERT INTO public.%I (%s) SELECT %s FROM public.%I',
    p_table,
    v_select,
    v_select,
    v_old
  );

  FOR v_col IN
    SELECT
      a.attname,
      pg_get_serial_sequence(format('public.%I', v_old), a.attname) AS seq
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.relname = v_old
      AND a.attnum > 0
      AND NOT a.attisdropped
      AND pg_get_serial_sequence(format('public.%I', v_old), a.attname) IS NOT NULL
  LOOP
    EXECUTE format(
      'SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM public.%I), 1), true)',
      v_col.seq,
      v_col.attname,
      p_table
    );
    EXECUTE format(
      'ALTER SEQUENCE %s OWNED BY public.%I.%I',
      v_col.seq,
      p_table,
      v_col.attname
    );
  END LOOP;

  FOR v_idx IN
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = v_old
      AND indexname NOT IN (
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class c ON c.oid = con.conrelid
        WHERE c.relname = v_old
          AND con.contype = 'p'
      )
  LOOP
    BEGIN
      EXECUTE replace(
        replace(
          replace(
            v_idx.indexdef,
            format('ON public.%I', v_old),
            format('ON public.%I', p_table)
          ),
          format('ON %I', v_old),
          format('ON public.%I', p_table)
        ),
        format('INDEX %I', v_idx.indexname),
        format('INDEX %I', regexp_replace(v_idx.indexname, '^' || v_old || '_', ''))
      );
    EXCEPTION
      WHEN duplicate_table THEN
        NULL; -- index bestaat al
    END;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = v_old
      AND c.relrowsecurity
  ) THEN
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table);
  END IF;

  FOR v_pol IN
    SELECT policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = v_old
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s%s%s',
      v_pol.policyname,
      p_table,
      v_pol.permissive,
      v_pol.cmd,
      array_to_string(v_pol.roles, ', '),
      CASE WHEN v_pol.qual IS NOT NULL THEN format(' USING (%s)', replace(v_pol.qual, v_old, p_table)) ELSE '' END,
      CASE WHEN v_pol.with_check IS NOT NULL THEN format(' WITH CHECK (%s)', replace(v_pol.with_check, v_old, p_table)) ELSE '' END
    );
  END LOOP;

  FOR v_trg IN
    SELECT pg_get_triggerdef(t.oid, true) AS def
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = v_old
      AND NOT t.tgisinternal
  LOOP
    EXECUTE replace(
      replace(v_trg.def, format(' ON public.%I ', v_old), format(' ON public.%I ', p_table)),
      format(' ON %I ', v_old),
      format(' ON public.%I ', p_table)
    );
  END LOOP;

  -- Policies op andere tabellen die naar de oude tabel verwijzen (OID-dep na RENAME)
  FOR v_cross_pol IN
    SELECT DISTINCT ON (dst.relname, pol.polname)
      dst.relname AS target_table,
      pol.polname AS policyname,
      CASE pol.polpermissive WHEN true THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END AS permissive,
      CASE pol.polcmd
        WHEN '*' THEN 'ALL'
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        ELSE pol.polcmd::text
      END AS cmd,
      pg_get_expr(pol.polqual, pol.polrelid) AS qual,
      pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check,
      (
        SELECT array_agg(rol.rolname ORDER BY rol.rolname)
        FROM unnest(pol.polroles) AS role_oid(role_oid)
        JOIN pg_roles rol ON rol.oid = role_oid.role_oid
      ) AS roles
    FROM pg_depend d
    JOIN pg_policy pol ON pol.oid = d.objid
    JOIN pg_class dst ON dst.oid = pol.polrelid
    WHERE d.refobjid = v_old_oid
      AND dst.relname NOT IN (p_table, v_old)
    ORDER BY dst.relname, pol.polname
  LOOP
    v_cross_pols := v_cross_pols || jsonb_build_object(
      'target_table', v_cross_pol.target_table,
      'policyname', v_cross_pol.policyname,
      'permissive', v_cross_pol.permissive,
      'cmd', v_cross_pol.cmd,
      'qual', v_cross_pol.qual,
      'with_check', v_cross_pol.with_check,
      'roles', to_jsonb(v_cross_pol.roles)
    );
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      v_cross_pol.policyname,
      v_cross_pol.target_table
    );
  END LOOP;

  -- Functies met RETURNS <oude rijtype> (bijv. create_user_for_session → users)
  FOR v_fn IN
    SELECT
      n.nspname AS schema_name,
      p.proname,
      pg_get_function_identity_arguments(p.oid) AS args,
      pg_get_functiondef(p.oid) AS def
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_type t ON t.oid = p.prorettype
    WHERE t.typrelid = v_old_oid
    ORDER BY CASE n.nspname WHEN 'public' THEN 0 ELSE 1 END
  LOOP
    v_fn_defs := array_append(v_fn_defs, v_fn.def);
    EXECUTE format(
      'DROP FUNCTION %I.%I(%s)',
      v_fn.schema_name,
      v_fn.proname,
      v_fn.args
    );
  END LOOP;

  EXECUTE format('DROP TABLE public.%I', v_old);

  FOREACH v_fn_def IN ARRAY v_fn_defs
  LOOP
    IF v_fn_def ~ 'FUNCTION private\.' THEN
      EXECUTE replace(v_fn_def, format('%I', v_old), format('%I', p_table));
    END IF;
  END LOOP;

  FOREACH v_fn_def IN ARRAY v_fn_defs
  LOOP
    IF v_fn_def ~ 'FUNCTION public\.' THEN
      EXECUTE replace(v_fn_def, format('%I', v_old), format('%I', p_table));
    END IF;
  END LOOP;

  FOR v_cross_pol IN
    SELECT *
    FROM jsonb_to_recordset(v_cross_pols) AS x(
      target_table text,
      policyname text,
      permissive text,
      cmd text,
      qual text,
      with_check text,
      roles jsonb
    )
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s%s%s',
      v_cross_pol.policyname,
      v_cross_pol.target_table,
      v_cross_pol.permissive,
      v_cross_pol.cmd,
      (
        SELECT COALESCE(string_agg(quote_ident(value), ', '), 'PUBLIC')
        FROM jsonb_array_elements_text(v_cross_pol.roles)
      ),
      CASE WHEN v_cross_pol.qual IS NOT NULL THEN format(' USING (%s)', replace(v_cross_pol.qual, v_old, p_table)) ELSE '' END,
      CASE WHEN v_cross_pol.with_check IS NOT NULL THEN format(' WITH CHECK (%s)', replace(v_cross_pol.with_check, v_old, p_table)) ELSE '' END
    );
  END LOOP;
END;
$$;

-- Foreign keys tijdelijk verwijderen (worden na reorder opnieuw gelegd)
ALTER TABLE public.application_settings DROP CONSTRAINT IF EXISTS application_settings_organization_id_fkey;
ALTER TABLE public.costs DROP CONSTRAINT IF EXISTS costs_organization_id_fkey;
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_away_team_id_fkey;
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_home_team_id_fkey;
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_organization_id_fkey;
ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_organization_id_fkey;
ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_team_id_fkey;
ALTER TABLE public.referee_matches DROP CONSTRAINT IF EXISTS referee_matches_organization_id_fkey;
ALTER TABLE public.team_costs DROP CONSTRAINT IF EXISTS team_costs_cost_setting_id_fkey;
ALTER TABLE public.team_costs DROP CONSTRAINT IF EXISTS team_costs_match_id_fkey;
ALTER TABLE public.team_costs DROP CONSTRAINT IF EXISTS team_costs_organization_id_fkey;
ALTER TABLE public.team_costs DROP CONSTRAINT IF EXISTS team_costs_team_id_fkey;
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_organization_id_fkey;
ALTER TABLE public.team_users DROP CONSTRAINT IF EXISTS team_managers_team_id_fkey;
ALTER TABLE public.team_users DROP CONSTRAINT IF EXISTS team_managers_user_id_fkey;
ALTER TABLE public.team_users DROP CONSTRAINT IF EXISTS team_users_organization_id_fkey;
ALTER TABLE public.team_users DROP CONSTRAINT IF EXISTS team_users_team_id_fkey;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_organization_id_fkey;

SELECT private.reorder_organization_id_first('users');
SELECT private.reorder_organization_id_first('teams');
SELECT private.reorder_organization_id_first('costs');
SELECT private.reorder_organization_id_first('application_settings');
SELECT private.reorder_organization_id_first('players');
SELECT private.reorder_organization_id_first('matches');
SELECT private.reorder_organization_id_first('team_users');
SELECT private.reorder_organization_id_first('team_costs');
SELECT private.reorder_organization_id_first('referee_matches');

-- Foreign keys herstellen
ALTER TABLE public.users
  ADD CONSTRAINT users_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;

ALTER TABLE public.teams
  ADD CONSTRAINT teams_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;

ALTER TABLE public.costs
  ADD CONSTRAINT costs_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;

ALTER TABLE public.application_settings
  ADD CONSTRAINT application_settings_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;

ALTER TABLE public.players
  ADD CONSTRAINT players_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;

ALTER TABLE public.players
  ADD CONSTRAINT players_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES public.teams(team_id) ON DELETE CASCADE;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_home_team_id_fkey
  FOREIGN KEY (home_team_id) REFERENCES public.teams(team_id) ON DELETE SET NULL;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_away_team_id_fkey
  FOREIGN KEY (away_team_id) REFERENCES public.teams(team_id) ON DELETE SET NULL;

ALTER TABLE public.team_users
  ADD CONSTRAINT team_users_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;

ALTER TABLE public.team_users
  ADD CONSTRAINT team_managers_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES public.teams(team_id) ON DELETE CASCADE;

ALTER TABLE public.team_users
  ADD CONSTRAINT team_managers_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

ALTER TABLE public.team_users
  ADD CONSTRAINT team_users_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES public.teams(team_id) ON DELETE CASCADE;

ALTER TABLE public.team_costs
  ADD CONSTRAINT team_costs_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;

ALTER TABLE public.team_costs
  ADD CONSTRAINT team_costs_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES public.teams(team_id) ON DELETE CASCADE;

ALTER TABLE public.team_costs
  ADD CONSTRAINT team_costs_match_id_fkey
  FOREIGN KEY (match_id) REFERENCES public.matches(match_id) ON DELETE CASCADE;

ALTER TABLE public.team_costs
  ADD CONSTRAINT team_costs_cost_setting_id_fkey
  FOREIGN KEY (cost_setting_id) REFERENCES public.costs(id);

ALTER TABLE public.referee_matches
  ADD CONSTRAINT referee_matches_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;

COMMENT ON FUNCTION private.reorder_organization_id_first(text) IS
  'Herbouwt een tabel met organization_id als eerste kolom; behoudt data, RLS, triggers en indexen.';
