# Spelerslijst Loading - Grondige Analyse & Expert Oplossingen

## 🔍 Huidige Problemen

### 1. **Race Conditions & Timing Issues**
- **Probleem**: Meerdere `useEffect` hooks die elkaar triggeren
- **Locatie**: `usePlayersData.ts` - 3 verschillende useEffects die elkaar kunnen beïnvloeden
- **Symptoom**: Spelerslijst laadt niet volledig, vooral bij team selectie

### 2. **Geen Request Cancellation**
- **Probleem**: Oude requests worden niet geannuleerd bij nieuwe team selectie
- **Impact**: Race conditions waarbij oude data nieuwe data overschrijft
- **Voorbeeld**: Selecteer Team A → Team B → Team A data verschijnt

### 3. **Geen Query Caching**
- **Probleem**: Elke keer opnieuw fetchen, zelfs als data al beschikbaar is
- **Impact**: Trage laadtijden, onnodige database calls
- **Vergelijking**: Andere hooks (`useMatchFormsData`, `useFinancialData`) gebruiken React Query met caching

### 4. **Complexe State Management**
- **Probleem**: Te veel refs en flags (`isInitialized`, `didSetInitialTeam`, `hasFallbackFetched`)
- **Impact**: Moeilijk te debuggen, onvoorspelbaar gedrag
- **Code smell**: Als je 3+ refs nodig hebt voor timing, is er iets mis

### 5. **Geen Debouncing**
- **Probleem**: Elke team change triggert direct een fetch
- **Impact**: Meerdere requests bij snelle selectie wijzigingen

### 6. **Inconsistente Error Handling**
- **Probleem**: Errors worden stilzwijgend genegeerd of alleen gelogd
- **Impact**: Gebruiker ziet geen feedback bij falen

### 7. **Geen Optimistic Updates**
- **Probleem**: UI update pas na succesvolle fetch
- **Impact**: Trage UX, geen instant feedback

### 8. **Auth Context Timing**
- **Probleem**: `authContextReady` check is niet betrouwbaar
- **Impact**: Fetch start soms te vroeg, RLS blokkeert data

---

## 🎯 Expert Best Practices (Zoals bij Top Apps)

### 1. **React Query (TanStack Query) - Industry Standard**

#### Waarom React Query?
- ✅ **Automatic Caching**: Data wordt gecached, geen onnodige fetches
- ✅ **Request Deduplication**: Meerdere componenten vragen zelfde data = 1 request
- ✅ **Background Refetching**: Data blijft up-to-date zonder gebruiker te storen
- ✅ **Optimistic Updates**: Instant UI feedback
- ✅ **Request Cancellation**: Oude requests worden automatisch geannuleerd
- ✅ **Error Retry Logic**: Slimme retry met exponential backoff
- ✅ **Loading States**: Built-in loading/error/success states

#### Configuratie voor Players:

```typescript
// src/hooks/usePlayersQuery.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { withUserContext } from "@/lib/supabaseUtils";
import { useAuth } from "@/hooks/useAuth";

// Query Keys - Centralized voor consistentie
export const playerQueryKeys = {
  all: ['players'] as const,
  lists: () => [...playerQueryKeys.all, 'list'] as const,
  list: (teamId: number | null) => [...playerQueryKeys.lists(), teamId] as const,
  details: () => [...playerQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...playerQueryKeys.details(), id] as const,
};

// Fetch Functions
const fetchAllPlayers = async (): Promise<Player[]> => {
  return withUserContext(async () => {
    const { data, error } = await supabase
      .from('players')
      .select(`
        player_id,
        first_name,
        last_name,
        birth_date,
        team_id,
        teams (
          team_id,
          team_name
        )
      `)
      .order('last_name')
      .order('first_name');
    
    if (error) throw error;
    return data || [];
  });
};

const fetchPlayersByTeam = async (teamId: number): Promise<Player[]> => {
  return withUserContext(async () => {
    const { data, error } = await supabase
      .from('players')
      .select('player_id, first_name, last_name, birth_date, team_id')
      .eq('team_id', teamId)
      .order('last_name')
      .order('first_name');
    
    if (error) throw error;
    return data || [];
  });
};

// Main Hook
export const usePlayersQuery = (teamId: number | null = null) => {
  const { user, authContextReady } = useAuth();
  const isAdmin = user?.role === "admin";
  
  return useQuery({
    queryKey: playerQueryKeys.list(teamId),
    queryFn: async () => {
      if (teamId) {
        return fetchPlayersByTeam(teamId);
      }
      if (isAdmin) {
        return fetchAllPlayers();
      }
      // Player manager: fetch their team
      if (user?.teamId) {
        return fetchPlayersByTeam(user.teamId);
      }
      return [];
    },
    enabled: !!user && authContextReady, // Only fetch when ready
    staleTime: 2 * 60 * 1000, // 2 minutes - data stays fresh
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnWindowFocus: false, // Prevent refetch on tab focus
    refetchOnReconnect: true, // Refetch when connection restored
    placeholderData: (previousData) => previousData, // Keep previous data while loading
    networkMode: 'offlineFirst', // Use cache first
  });
};

// Teams Query
export const useTeamsQuery = () => {
  const { authContextReady } = useAuth();
  
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .order('team_name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: authContextReady,
    staleTime: 5 * 60 * 1000, // 5 minutes - teams change rarely
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: 2,
    refetchOnWindowFocus: false,
  });
};
```

### 2. **Optimized Settings (Pro Level)**

```typescript
// Expert-level configuratie
const EXPERT_QUERY_CONFIG = {
  // Stale Time: Hoe lang data als "fresh" wordt beschouwd
  staleTime: 2 * 60 * 1000, // 2 minuten
  
  // GC Time (was cacheTime): Hoe lang data in cache blijft
  gcTime: 10 * 60 * 1000, // 10 minuten
  
  // Retry: Aantal pogingen bij fout
  retry: 3,
  
  // Retry Delay: Exponentiële backoff
  retryDelay: (attemptIndex: number) => 
    Math.min(1000 * Math.pow(2, attemptIndex), 5000), // Max 5 seconden
  
  // Network Mode: Offline-first voor betere UX
  networkMode: 'offlineFirst' as const,
  
  // Placeholder Data: Toon oude data tijdens loading
  placeholderData: (previousData: any) => previousData,
  
  // Refetch Settings
  refetchOnWindowFocus: false, // Geen refetch bij tab focus
  refetchOnReconnect: true, // Wel refetch bij reconnect
  refetchInterval: false, // Geen polling
};
```

### 3. **Request Cancellation Pattern**

```typescript
// Automatisch door React Query, maar voor custom fetches:
const fetchWithCancellation = async (signal: AbortSignal) => {
  return withUserContext(async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .abortSignal(signal); // Cancel bij unmount/nieuwe request
    
    if (error) throw error;
    return data;
  });
};
```

### 4. **Debouncing Team Selection**

```typescript
import { useDebouncedValue } from "@/hooks/useDebounce";

const usePlayersWithDebounce = () => {
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const debouncedTeam = useDebouncedValue(selectedTeam, 300); // 300ms debounce
  
  const query = usePlayersQuery(debouncedTeam);
  
  return {
    ...query,
    selectedTeam,
    setSelectedTeam,
  };
};
```

### 5. **Optimistic Updates**

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useAddPlayer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (player: NewPlayer) => {
      // API call
      const { data, error } = await supabase
        .from('players')
        .insert(player)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    // Optimistic update: update UI direct, rollback bij error
    onMutate: async (newPlayer) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: playerQueryKeys.all });
      
      // Snapshot previous value
      const previousPlayers = queryClient.getQueryData(playerQueryKeys.all);
      
      // Optimistically update
      queryClient.setQueryData(playerQueryKeys.all, (old: Player[]) => [
        ...old,
        { ...newPlayer, player_id: Date.now() } // Temporary ID
      ]);
      
      return { previousPlayers };
    },
    onError: (err, newPlayer, context) => {
      // Rollback on error
      queryClient.setQueryData(
        playerQueryKeys.all,
        context?.previousPlayers
      );
    },
    onSuccess: () => {
      // Refetch to get real data
      queryClient.invalidateQueries({ queryKey: playerQueryKeys.all });
    },
  });
};
```

### 6. **Error Boundaries & Error Handling**

```typescript
// Error Boundary Component
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <h2>Er ging iets mis bij het laden van spelers</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Probeer opnieuw</button>
    </div>
  );
}

// Usage
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <PlayerPage />
</ErrorBoundary>
```

### 7. **Loading States - Skeleton UI**

```typescript
// Gebruik skeleton loaders in plaats van spinners
const PlayerListSkeleton = () => (
  <div className="space-y-2">
    {[1, 2, 3, 4, 5].map((i) => (
      <Card key={i} className="animate-pulse">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    ))}
  </div>
);
```

### 8. **Pagination (voor grote datasets)**

```typescript
export const usePlayersPaginated = (teamId: number | null, page: number = 1) => {
  const pageSize = 50; // Items per page
  
  return useQuery({
    queryKey: [...playerQueryKeys.list(teamId), 'paginated', page],
    queryFn: async () => {
      let query = supabase
        .from('players')
        .select('*', { count: 'exact' });
      
      if (teamId) {
        query = query.eq('team_id', teamId);
      }
      
      const { data, error, count } = await query
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order('last_name');
      
      if (error) throw error;
      
      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    keepPreviousData: true, // Show previous page while loading next
  });
};
```

---

## 🔧 Wat Moet Gewijzigd Worden?

### Prioriteit 1: Kritiek (Direct Fixen)

1. **Migreer naar React Query**
   - Vervang `usePlayersData.ts` met `usePlayersQuery.ts`
   - Update `PlayerPage.tsx` om nieuwe hook te gebruiken
   - **Impact**: Fixes 80% van de problemen

2. **Fix Team Selection**
   - Voeg debouncing toe
   - Gebruik React Query's `enabled` option
   - **Impact**: Fixes dropdown issues

3. **Request Cancellation**
   - React Query doet dit automatisch
   - **Impact**: Fixes race conditions

### Prioriteit 2: Belangrijk (Binnen 1 Week)

4. **Error Handling**
   - Voeg Error Boundaries toe
   - Toon gebruikersvriendelijke error messages
   - **Impact**: Betere UX bij errors

5. **Loading States**
   - Vervang spinners met skeleton loaders
   - **Impact**: Betere UX tijdens loading

6. **Optimistic Updates**
   - Voor add/edit/delete operaties
   - **Impact**: Instant feedback

### Prioriteit 3: Nice to Have (Binnen 1 Maand)

7. **Pagination**
   - Als je >100 spelers hebt
   - **Impact**: Betere performance

8. **Virtual Scrolling**
   - Voor zeer grote lijsten (>500 items)
   - **Impact**: Betere performance

---

## 📊 Vergelijking: Huidig vs Expert

| Feature | Huidig | Expert (React Query) |
|---------|--------|---------------------|
| Caching | ❌ Geen | ✅ Automatisch |
| Request Cancellation | ❌ Geen | ✅ Automatisch |
| Retry Logic | ⚠️ Basic | ✅ Slim met backoff |
| Loading States | ⚠️ Manual | ✅ Built-in |
| Error Handling | ⚠️ Basic | ✅ Advanced |
| Optimistic Updates | ❌ Geen | ✅ Ja |
| Background Refetch | ❌ Geen | ✅ Ja |
| Request Deduplication | ❌ Geen | ✅ Automatisch |

---

## 🚀 Implementatie Plan

### Stap 1: Setup React Query Hook
```bash
# Bestand aanmaken
touch src/hooks/usePlayersQuery.ts
```

### Stap 2: Migreer PlayerPage
- Vervang `usePlayersData` met `usePlayersQuery`
- Update component om React Query patterns te gebruiken

### Stap 3: Test & Verify
- Test team selection
- Test error scenarios
- Test loading states

### Stap 4: Add Optimizations
- Debouncing
- Optimistic updates
- Error boundaries

---

## 💡 Extra Tips

1. **Query DevTools**: Installeer React Query DevTools voor debugging
2. **Monitoring**: Log query performance metrics
3. **A/B Testing**: Test verschillende staleTime waarden
4. **User Feedback**: Vraag gebruikers naar loading experience

---

## 📚 Referenties

- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Web.dev: Loading Performance](https://web.dev/fast/)

