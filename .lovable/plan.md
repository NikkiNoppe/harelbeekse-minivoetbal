

# Plan: Robuust Spelerslijst Laden voor /admin/players

## Probleem Samenvatting

De huidige spelerslijst op `/admin/players` heeft meerdere problemen:

1. **Race condition bij retry**: De "Opnieuw" knop heeft geen debounce/cooldown waardoor meerdere rapid-fire requests de database overbelasten
2. **RLS context verlies**: Door Supabase connection pooling kan de RLS context verloren gaan tussen de `set_current_user_context` RPC en de SELECT query
3. **Inconsistente UX**: Lege resultaten worden getoond terwijl data eigenlijk wel bestaat (RLS blokkeert ten onrechte)
4. **Verschil met publieke pagina's**: Blog/competitie laden vlot omdat ze geen RLS context nodig hebben

## Architectuur Vergelijking

```text
HUIDIGE FLOW (Admin Players):
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ set_context RPC │───►│ SELECT players  │───►│ RLS check       │
│ (Connection A)  │    │ (Connection B?) │    │ Context: ???    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                       ↑
                       └── Connection pooling kan context verliezen!

PUBLIEKE PAGINA'S (Blog/Competitie):
┌─────────────────┐    ┌─────────────────┐
│ SELECT data     │───►│ RLS: public OK  │
│ Geen context    │    │ Geen check      │
└─────────────────┘    └─────────────────┘

GEWENSTE FLOW (SECURITY DEFINER):
┌─────────────────────────────────────────┐
│ RPC: get_players_with_context           │
│ ├── Check role in database              │
│ ├── Check team access                   │
│ └── RETURN players (1 atomaire operatie)│
└─────────────────────────────────────────┘
```

## Oplossing Overzicht

De oplossing bestaat uit 3 onderdelen:

### Onderdeel 1: SECURITY DEFINER functie voor lezen

Maak een database functie `get_players_for_team(p_user_id, p_team_id)` die:
- Autorisatie EN data ophalen combineert in één atomaire operatie
- Geen afhankelijkheid heeft van sessievariabelen
- Direct de correcte spelers retourneert

### Onderdeel 2: Verbeterde InlineRetry component

Voeg toe aan de "Opnieuw" knop:
- **Debounce**: 500ms minimum tussen clicks
- **Exponential backoff**: 1s, 2s, 4s wachttijd na elke retry
- **Duidelijke feedback**: Toon wanneer volgende retry mogelijk is

### Onderdeel 3: Cache strategie verbetering

Pas `usePlayersQuery` aan:
- `staleTime: 2 * 60 * 1000` (2 minuten, zoals blog/competitie)
- Gebruik `placeholderData: previousData` voor smoother UX
- Voeg `refetchOnMount: false` toe om onnodige fetches te voorkomen

---

## Technische Wijzigingen

### Wijziging 1: Database Migratie

**Nieuw bestand**: `supabase/migrations/[timestamp]_add_get_players_function.sql`

Creëer een SECURITY DEFINER functie die spelers ophaalt met ingebouwde autorisatie:

```sql
CREATE OR REPLACE FUNCTION public.get_players_for_team(
  p_user_id INTEGER,
  p_team_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
  player_id INTEGER,
  first_name VARCHAR,
  last_name VARCHAR,
  birth_date DATE,
  team_id INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
  v_team_ids INTEGER[];
BEGIN
  -- 1. Haal role direct uit database
  SELECT role::text INTO v_role FROM users WHERE user_id = p_user_id;
  
  -- 2. Haal team IDs op
  SELECT array_agg(tu.team_id) INTO v_team_ids 
  FROM team_users tu WHERE tu.user_id = p_user_id;
  
  -- 3. Admin: mag alles zien
  IF v_role = 'admin' THEN
    IF p_team_id IS NULL THEN
      -- Alle spelers
      RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id
        FROM players p ORDER BY p.last_name, p.first_name;
    ELSE
      -- Specifiek team
      RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id
        FROM players p WHERE p.team_id = p_team_id ORDER BY p.last_name, p.first_name;
    END IF;
    RETURN;
  END IF;
  
  -- 4. Player manager: alleen eigen team(s)
  IF v_role = 'player_manager' THEN
    IF p_team_id IS NOT NULL AND NOT (p_team_id = ANY(v_team_ids)) THEN
      -- Geen toegang tot dit team
      RETURN;
    END IF;
    
    IF p_team_id IS NULL THEN
      -- Alle teams van deze manager
      RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id
        FROM players p WHERE p.team_id = ANY(v_team_ids) ORDER BY p.last_name, p.first_name;
    ELSE
      -- Specifiek team (al gevalideerd hierboven)
      RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id
        FROM players p WHERE p.team_id = p_team_id ORDER BY p.last_name, p.first_name;
    END IF;
    RETURN;
  END IF;
  
  -- 5. Andere rollen: geen toegang
  RETURN;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_players_for_team TO authenticated;
```

### Wijziging 2: usePlayersQuery.ts aanpassen

**Bestand**: `src/hooks/usePlayersQuery.ts`

Vervang de `fetchPlayersByTeam` en `fetchAllPlayers` functies om de nieuwe RPC te gebruiken:

```typescript
// Nieuwe fetch functie via RPC
const fetchPlayersViaRPC = async (teamId: number | null): Promise<Player[]> => {
  // Haal user ID uit localStorage
  const authDataString = localStorage.getItem('auth_data');
  const userId = authDataString ? JSON.parse(authDataString)?.user?.id : null;
  
  if (!userId) {
    console.error('❌ No user ID found for player fetch');
    return [];
  }
  
  const { data, error } = await supabase.rpc('get_players_for_team', {
    p_user_id: userId,
    p_team_id: teamId
  });
  
  if (error) {
    console.error('❌ Error fetching players via RPC:', error);
    throw error;
  }
  
  return (data || []) as Player[];
};
```

Pas ook de query configuratie aan:
- `staleTime`: van 0 naar `2 * 60 * 1000` (2 minuten)
- Voeg `placeholderData: (previousData) => previousData` toe

### Wijziging 3: InlineRetry component verbeteren

**Bestand**: `src/components/modals/matches/inline-player-retry.tsx`

Voeg debounce en cooldown toe:

```typescript
const [cooldownSeconds, setCooldownSeconds] = useState(0);
const [lastRetryTime, setLastRetryTime] = useState(0);

const handleRetry = async () => {
  const now = Date.now();
  const timeSinceLastRetry = now - lastRetryTime;
  const minInterval = 1000 * Math.pow(2, retryCount); // Exponential: 1s, 2s, 4s, 8s
  
  if (timeSinceLastRetry < minInterval) {
    // Te snel, toon cooldown
    setCooldownSeconds(Math.ceil((minInterval - timeSinceLastRetry) / 1000));
    return;
  }
  
  // ... bestaande retry logica
  setLastRetryTime(now);
};
```

Toon de cooldown in de UI:
```typescript
{cooldownSeconds > 0 && (
  <span className="text-xs text-amber-500">Wacht {cooldownSeconds}s...</span>
)}
```

### Wijziging 4: TypeScript types updaten

**Bestand**: `src/integrations/supabase/types.ts`

Voeg de nieuwe RPC functie toe aan de Functions sectie.

---

## Bestanden Overzicht

| Bestand | Actie | Beschrijving |
|---------|-------|--------------|
| `supabase/migrations/[timestamp]_add_get_players_function.sql` | Nieuw | SECURITY DEFINER functie voor atomair spelers ophalen |
| `src/hooks/usePlayersQuery.ts` | Aanpassen | Gebruik RPC i.p.v. directe query, betere cache settings |
| `src/components/modals/matches/inline-player-retry.tsx` | Aanpassen | Debounce, cooldown, exponential backoff |
| `src/integrations/supabase/types.ts` | Aanpassen | RPC type definitie toevoegen |

---

## Verwacht Resultaat

Na implementatie:

1. **Geen race conditions**: RPC combineert auth + data in één atomaire operatie
2. **Betere UX**: Cache voorkomt onnodige laadtijd, placeholder data toont vorige resultaten
3. **Robuuste retry**: Exponential backoff voorkomt database overbelasting
4. **Consistentie**: Zelfde laadpatroon als blog/competitie pagina's
5. **Geen context verlies**: Geen afhankelijkheid van sessievariabelen meer

---

## Alternatieve Opties (Niet Aanbevolen)

### Optie: JWT Custom Claims
Supabase ondersteunt custom claims in JWT tokens (role, team_ids). Dit zou RLS kunnen laten werken zonder `set_current_user_context`. Echter:
- Vereist auth.users metadata setup
- Complexer om te implementeren
- Token refresh nodig bij role/team wijzigingen

### Optie: Client-side cookies voor caching
Zou de symptomen maskeren maar niet het onderliggende RLS probleem oplossen. Data in cookies is ook niet geschikt voor dynamische spelerslijsten.

De **SECURITY DEFINER RPC aanpak** is de meest robuuste en consistente oplossing, passend bij het bestaande patroon (`insert_player_with_context`).

