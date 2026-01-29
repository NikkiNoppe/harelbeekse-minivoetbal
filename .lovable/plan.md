

# Plan: Fix Admin Toegang tot Gebruikers en Schorsingen Pagina's

## Probleem Analyse

De `/admin/users` en `/admin/schorsingen` pagina's tonen lege lijsten voor admins door hetzelfde probleem dat we net hebben opgelost voor `/admin/players`:

### Users Pagina (`/admin/users`)
De `useUserManagement` hook haalt gebruikers op via directe queries:
```typescript
const { data: usersData } = await supabase
  .from('users')
  .select('user_id, username, ...')
```

De RLS policy vereist echter:
```sql
get_current_user_role() = 'admin'
```

Zonder `withUserContext()` wrapper of SECURITY DEFINER RPC wordt de session context niet gezet, waardoor `get_current_user_role()` een lege string retourneert en de admin geen toegang heeft.

### Schorsingen Pagina (`/admin/schorsingen`)
De `suspensionService.getPlayerCards()` haalt spelers op via directe queries:
```typescript
const { data } = await supabase
  .from('players')
  .select('player_id, first_name, ...')
```

De RLS policies op de `players` tabel vereisen ook `get_current_user_role() = 'admin'` voor admin toegang, wat opnieuw faalt zonder context.

## Oplossing: SECURITY DEFINER RPCs

Net als bij de spelerslijst, maken we SECURITY DEFINER functies die autorisatie en data ophalen combineren in één atomaire operatie.

---

## Technische Wijzigingen

### Wijziging 1: Database Migratie - Nieuwe RPCs

**Nieuw bestand**: `supabase/migrations/[timestamp]_add_admin_data_functions.sql`

Creëer twee SECURITY DEFINER functies:

#### 1. `get_all_users_for_admin(p_user_id)`
- Verifieert dat de gebruiker een admin is door de `users` tabel te raadplegen
- Retourneert alle gebruikers met team relaties
- Inclusief email (alleen zichtbaar voor admins)

```sql
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin(
  p_user_id INTEGER
)
RETURNS TABLE(
  user_id INTEGER,
  username VARCHAR,
  email VARCHAR,
  role TEXT,
  team_users JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Haal role direct uit database (niet client-provided)
  SELECT u.role::text INTO v_role FROM users u WHERE u.user_id = p_user_id;
  
  -- Alleen admins mogen alle gebruikers zien
  IF v_role != 'admin' THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    u.user_id,
    u.username,
    u.email,
    u.role::text,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'team_id', tu.team_id,
        'team_name', t.team_name
      ))
      FROM team_users tu
      JOIN teams t ON t.team_id = tu.team_id
      WHERE tu.user_id = u.user_id
      ), '[]'::jsonb
    ) as team_users
  FROM users u
  ORDER BY u.username;
END;
$$;
```

#### 2. `get_player_cards_for_admin(p_user_id)`
- Verifieert admin rol of filtert op team voor team managers
- Retourneert spelers met kaarten informatie

```sql
CREATE OR REPLACE FUNCTION public.get_player_cards_for_admin(
  p_user_id INTEGER
)
RETURNS TABLE(
  player_id INTEGER,
  first_name VARCHAR,
  last_name VARCHAR,
  team_id INTEGER,
  team_name VARCHAR,
  yellow_cards INTEGER,
  red_cards INTEGER,
  suspended_matches_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
  v_team_ids INTEGER[];
BEGIN
  -- Haal role direct uit database
  SELECT u.role::text INTO v_role FROM users u WHERE u.user_id = p_user_id;
  
  -- Admin: mag alles zien
  IF v_role = 'admin' THEN
    RETURN QUERY
    SELECT p.player_id, p.first_name, p.last_name, p.team_id,
           t.team_name, p.yellow_cards, p.red_cards, p.suspended_matches_remaining
    FROM players p
    LEFT JOIN teams t ON t.team_id = p.team_id
    ORDER BY p.yellow_cards DESC NULLS LAST, p.last_name, p.first_name;
    RETURN;
  END IF;
  
  -- Player manager: alleen eigen team(s)
  IF v_role = 'player_manager' THEN
    SELECT array_agg(tu.team_id) INTO v_team_ids 
    FROM team_users tu WHERE tu.user_id = p_user_id;
    
    RETURN QUERY
    SELECT p.player_id, p.first_name, p.last_name, p.team_id,
           t.team_name, p.yellow_cards, p.red_cards, p.suspended_matches_remaining
    FROM players p
    LEFT JOIN teams t ON t.team_id = p.team_id
    WHERE p.team_id = ANY(v_team_ids)
    ORDER BY p.yellow_cards DESC NULLS LAST, p.last_name, p.first_name;
    RETURN;
  END IF;
  
  -- Andere rollen: geen toegang
  RETURN;
END;
$$;
```

### Wijziging 2: useUserManagement.tsx aanpassen

**Bestand**: `src/components/pages/admin/users/hooks/useUserManagement.tsx`

Vervang de directe query in `fetchData()` met een RPC aanroep:

```typescript
const fetchData = async () => {
  // Haal user ID uit localStorage
  const authDataString = localStorage.getItem('auth_data');
  const userId = authDataString ? JSON.parse(authDataString)?.user?.id : null;
  
  if (!userId) {
    throw new Error('Niet ingelogd');
  }
  
  // Gebruik SECURITY DEFINER RPC
  const { data: usersData, error: usersError } = await supabase
    .rpc('get_all_users_for_admin', { p_user_id: userId });
  
  if (usersError) throw usersError;
  
  // Transform data (team_users is al JSONB)
  const transformedUsers = (usersData || []).map(user => ({
    user_id: user.user_id,
    username: user.username,
    email: user.email,
    role: user.role,
    team_id: user.team_users?.[0]?.team_id || null,
    team_name: user.team_users?.[0]?.team_name || null,
    teams: user.team_users || []
  }));
  
  // Teams ophalen (publiek toegankelijk)
  const { data: teamsData } = await supabase
    .from('teams')
    .select('team_id, team_name')
    .order('team_name');
  
  return { users: transformedUsers, teams: teamsData || [] };
};
```

### Wijziging 3: suspensionService.ts aanpassen

**Bestand**: `src/domains/cards-suspensions/services/suspensionService.ts`

Vervang de `getPlayerCards()` methode:

```typescript
async getPlayerCards(): Promise<PlayerCard[]> {
  try {
    // Haal user ID uit localStorage
    const authDataString = localStorage.getItem('auth_data');
    const userId = authDataString ? JSON.parse(authDataString)?.user?.id : null;
    
    if (!userId) {
      console.error('No user ID found for player cards fetch');
      return [];
    }
    
    const { data, error } = await supabase.rpc('get_player_cards_for_admin', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error fetching player cards via RPC:', error);
      throw error;
    }

    return (data || []).map(player => ({
      playerId: player.player_id,
      playerName: `${player.first_name} ${player.last_name}`,
      teamName: player.team_name || 'Onbekend Team',
      teamId: player.team_id,
      yellowCards: player.yellow_cards || 0,
      redCards: player.red_cards || 0,
      suspendedMatches: player.suspended_matches_remaining || 0
    }));
  } catch (error) {
    console.error('Error in getPlayerCards:', error);
    return [];
  }
}
```

### Wijziging 4: TypeScript types updaten

**Bestand**: `src/integrations/supabase/types.ts`

Voeg de nieuwe RPC functies toe aan de Functions sectie.

---

## Bestanden Overzicht

| Bestand | Actie | Beschrijving |
|---------|-------|--------------|
| `supabase/migrations/[timestamp]_add_admin_data_functions.sql` | Nieuw | SECURITY DEFINER RPCs voor users en player cards |
| `src/components/pages/admin/users/hooks/useUserManagement.tsx` | Aanpassen | Gebruik `get_all_users_for_admin` RPC |
| `src/domains/cards-suspensions/services/suspensionService.ts` | Aanpassen | Gebruik `get_player_cards_for_admin` RPC |
| `src/integrations/supabase/types.ts` | Aanpassen | RPC type definities toevoegen |

---

## Verwacht Resultaat

Na implementatie:

1. **Admin Users pagina toont alle gebruikers** - De RPC verifieert admin rol in de database zelf
2. **Admin Schorsingen pagina toont kaarten** - De RPC haalt spelers op met correcte autorisatie
3. **Team managers zien eigen team data** - De RPCs ondersteunen ook player_manager rol
4. **Geen RLS context verlies** - Geen afhankelijkheid van sessievariabelen meer
5. **Consistentie** - Zelfde patroon als de recente `get_players_for_team` fix

---

## Beveiligingsvoordelen

1. **Server-side validatie**: De admin rol wordt geverifieerd in de database, niet via client-side storage
2. **Privilege escalation preventie**: Gebruikers kunnen hun rol niet vervalsen
3. **Atomaire operaties**: Autorisatie en data ophalen in één transactie
4. **Fail-safe**: Zonder geldige gebruiker wordt een lege dataset geretourneerd

