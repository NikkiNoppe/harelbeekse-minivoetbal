

## Fix: Admin kan geen spelers toevoegen (RLS violation)

### Probleem Diagnose

Het probleem ontstaat door de manier waarop Supabase's connection pooling werkt:

1. **Huidige flow**:
   - `withUserContext()` roept `set_current_user_context` RPC aan → Zet sessievariabelen
   - Daarna wordt `supabase.from('players').insert()` uitgevoerd
   - **Maar**: Dit zijn 2 aparte HTTP requests die verschillende database connecties kunnen gebruiken
   - De sessievariabelen zijn verloren op de nieuwe connectie

2. **RLS Policy check**:
   - `get_current_user_role()` retourneert lege string (geen context)
   - Geen enkele policy matcht → INSERT geweigerd

```text
┌─────────────────────┐     ┌─────────────────────┐
│  RPC: set_context   │     │  INSERT players     │
│  (Connection A)     │ ──► │  (Connection B)     │
│  Context: admin     │     │  Context: LEEG!     │
└─────────────────────┘     └─────────────────────┘
```

### Oplossing

Creëer een `SECURITY DEFINER` functie die autorisatie en insert in dezelfde transactie uitvoert (zoals al bestaat voor matches: `update_match_with_context`).

---

### Wijziging 1: Database Migratie

**Bestand**: `supabase/migrations/[timestamp]_add_player_crud_functions.sql`

Maak nieuwe SECURITY DEFINER functies voor player CRUD operaties:

```sql
-- Insert player met context validatie
CREATE OR REPLACE FUNCTION public.insert_player_with_context(
  p_user_id INTEGER,
  p_first_name VARCHAR,
  p_last_name VARCHAR,
  p_birth_date DATE,
  p_team_id INTEGER
)
RETURNS TABLE(player_id INTEGER, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
  v_team_ids INTEGER[];
  v_new_player_id INTEGER;
BEGIN
  -- 1. Haal ACTUELE role uit database
  SELECT role::text INTO v_role FROM users WHERE user_id = p_user_id;
  
  -- 2. Haal team IDs op
  SELECT array_agg(team_id) INTO v_team_ids 
  FROM team_users WHERE user_id = p_user_id;
  
  -- 3. Check toegangsrechten
  IF v_role IS NULL THEN
    RETURN QUERY SELECT NULL::INTEGER, FALSE, 'Gebruiker niet gevonden'::TEXT;
    RETURN;
  END IF;
  
  IF v_role = 'admin' THEN
    -- Admin mag alle teams
    NULL;
  ELSIF v_role = 'player_manager' THEN
    -- Team manager alleen eigen team
    IF v_team_ids IS NULL OR NOT (p_team_id = ANY(v_team_ids)) THEN
      RETURN QUERY SELECT NULL::INTEGER, FALSE, 'Geen toegang tot dit team'::TEXT;
      RETURN;
    END IF;
  ELSE
    RETURN QUERY SELECT NULL::INTEGER, FALSE, 'Onvoldoende rechten'::TEXT;
    RETURN;
  END IF;
  
  -- 4. Check duplicaat
  IF EXISTS (
    SELECT 1 FROM players 
    WHERE first_name = p_first_name 
    AND last_name = p_last_name 
    AND birth_date = p_birth_date
  ) THEN
    RETURN QUERY SELECT NULL::INTEGER, FALSE, 'Speler bestaat al'::TEXT;
    RETURN;
  END IF;
  
  -- 5. Insert
  INSERT INTO players (first_name, last_name, birth_date, team_id)
  VALUES (p_first_name, p_last_name, p_birth_date, p_team_id)
  RETURNING players.player_id INTO v_new_player_id;
  
  RETURN QUERY SELECT v_new_player_id, TRUE, 'Speler toegevoegd'::TEXT;
END;
$$;
```

---

### Wijziging 2: useAddPlayer.ts

**Bestand**: `src/components/pages/admin/players/hooks/operations/useAddPlayer.ts`

Vervang de directe insert door de RPC call:

```typescript
// Vervang regels 76-82:
const result = await withUserContext(async () => {
  return await supabase
    .from('players')
    .insert(insertData)
    .select();
});

// Door:
const authData = localStorage.getItem('auth_data');
const userId = authData ? JSON.parse(authData)?.user?.id : null;

if (!userId) {
  toast({
    title: "Niet ingelogd",
    description: "Log opnieuw in om spelers toe te voegen",
    variant: "destructive",
  });
  return false;
}

const { data, error } = await supabase.rpc('insert_player_with_context', {
  p_user_id: userId,
  p_first_name: firstName.trim(),
  p_last_name: lastName.trim(),
  p_birth_date: birthDate,
  p_team_id: teamId
});
```

Update ook de error handling om de RPC response te verwerken.

---

### Wijziging 3: Update TypeScript Types

**Bestand**: `src/integrations/supabase/types.ts`

Voeg de nieuwe RPC functie toe aan de Functions sectie.

---

### Technisch Overzicht

| Aspect | Oud | Nieuw |
|--------|-----|-------|
| Context scope | Transaction-local (verloren) | N.v.t. (SECURITY DEFINER) |
| Autorisatie | Via sessievariabelen | Direct in functie |
| HTTP requests | 2 (context + insert) | 1 (RPC) |
| Atomiciteit | Niet gegarandeerd | Gegarandeerd |

---

### Bestanden te wijzigen

1. **Nieuwe migratie** - `supabase/migrations/[timestamp]_add_player_crud_functions.sql`
   - `insert_player_with_context` functie
   
2. **`src/components/pages/admin/players/hooks/operations/useAddPlayer.ts`**
   - Vervang directe insert door RPC call
   - Update error handling
   
3. **`src/integrations/supabase/types.ts`**
   - Voeg RPC functie type definitie toe

---

### Verwacht Resultaat

- Admin kan spelers toevoegen zonder RLS fouten
- Team managers kunnen spelers toevoegen aan hun eigen team
- Consistente autorisatie via database-level validatie
- Patroon consistent met bestaande `update_match_with_context`

