# Spelerslijst React Query Migratie

## ✅ Wat is geïmplementeerd

### 1. Nieuwe React Query Hook
- **Bestand**: `src/hooks/usePlayersQuery.ts`
- **Features**:
  - Automatische caching (10 minuten)
  - Request cancellation
  - Slimme retry logic (3 pogingen met exponential backoff)
  - Background refetching
  - Placeholder data (toont oude data tijdens loading)

### 2. Nieuwe Updated Hook
- **Bestand**: `src/components/pages/admin/players/hooks/usePlayersUpdatedWithQuery.ts`
- **Features**:
  - Gebruikt React Query in plaats van useState/useEffect
  - Debouncing voor team selection (300ms)
  - Automatische query invalidation na mutations
  - Backward compatible met bestaande code

### 3. PlayerPage Update
- **Bestand**: `src/components/pages/admin/players/PlayerPage.tsx`
- **Wijzigingen**:
  - Gebruikt nu `usePlayersUpdatedWithQuery` in plaats van `usePlayersUpdated`
  - Verwijderd: `isTeamChanging` state (React Query handelt dit af)
  - Simpelere loading states

## 🔄 Wat werkt anders

### Voor (Oude Implementatie)
```typescript
// Elke keer opnieuw fetchen, geen caching
const { players, loading } = usePlayersData(authUser);
// Manual refresh nodig na elke mutation
await refreshPlayers();
```

### Na (React Query)
```typescript
// Automatische caching, slimme refetching
const { players, loading } = usePlayersQuery(teamId);
// Query invalidation triggert automatische refetch
invalidateTeam(teamId);
```

## 📊 Verbeteringen

1. **Performance**
   - ✅ Data wordt gecached (geen onnodige fetches)
   - ✅ Request deduplication (meerdere componenten = 1 request)
   - ✅ Background refetching (data blijft up-to-date)

2. **Betrouwbaarheid**
   - ✅ Request cancellation (geen race conditions)
   - ✅ Automatische retry bij errors
   - ✅ Placeholder data (geen lege states tijdens loading)

3. **UX**
   - ✅ Debouncing voor team selection (300ms)
   - ✅ Smooth transitions (placeholder data)
   - ✅ Betere loading states

## 🧪 Testen

### Test Scenario's

1. **Initial Load**
   - ✅ Spelerslijst laadt bij page load
   - ✅ Loading state wordt correct getoond
   - ✅ Data verschijnt na laden

2. **Team Selection**
   - ✅ Selecteer team in dropdown
   - ✅ Debouncing voorkomt meerdere requests
   - ✅ Data update na selectie

3. **Add Player**
   - ✅ Voeg speler toe
   - ✅ Lijst update automatisch
   - ✅ Cache wordt geïnvalideerd

4. **Edit Player**
   - ✅ Bewerk speler
   - ✅ Lijst update automatisch
   - ✅ Cache wordt geïnvalideerd

5. **Remove Player**
   - ✅ Verwijder speler
   - ✅ Lijst update automatisch
   - ✅ Cache wordt geïnvalideerd

## 🔧 Configuratie

### Query Settings (in `usePlayersQuery.ts`)

```typescript
staleTime: 2 * 60 * 1000,        // 2 minuten - data blijft fresh
gcTime: 10 * 60 * 1000,          // 10 minuten cache
retry: 3,                        // 3 retry pogingen
retryDelay: exponential backoff  // Slimme retry delays
refetchOnWindowFocus: false,     // Geen refetch bij tab focus
refetchOnReconnect: true,        // Wel refetch bij reconnect
placeholderData: previousData,   // Toon oude data tijdens loading
networkMode: 'offlineFirst',     // Cache-first voor slechte verbinding
```

### Debounce Settings (in `usePlayersUpdatedWithQuery.ts`)

```typescript
const debouncedTeam = useDebounce(selectedTeam, 300); // 300ms debounce
```

## 🚀 Volgende Stappen (Optioneel)

1. **Optimistic Updates**
   - Update UI direct, rollback bij error
   - Zie `PLAYER_LOADING_ANALYSIS_AND_SOLUTIONS.md`

2. **Error Boundaries**
   - Betere error handling
   - Zie `PLAYER_LOADING_ANALYSIS_AND_SOLUTIONS.md`

3. **Pagination**
   - Voor grote datasets (>100 spelers)
   - Zie `PLAYER_LOADING_ANALYSIS_AND_SOLUTIONS.md`

## 📝 Backward Compatibility

De nieuwe implementatie is **100% backward compatible**:
- ✅ Zelfde API als `usePlayersUpdated`
- ✅ Bestaande operations werken zonder wijzigingen
- ✅ `refreshPlayers` functie werkt nog steeds (nu via query invalidation)

## 🔍 Debugging

### React Query DevTools
Installeer React Query DevTools voor debugging:
```bash
npm install @tanstack/react-query-devtools
```

### Console Logs
- ✅ Query keys worden gelogd
- ✅ Fetch operations worden gelogd
- ✅ Cache invalidations worden gelogd

## ⚠️ Belangrijke Notities

1. **Oude Hook Nog Beschikbaar**
   - `usePlayersUpdated` bestaat nog steeds
   - Alleen `PlayerPage.tsx` gebruikt nu de nieuwe versie
   - Andere componenten kunnen geleidelijk migreren

2. **Cache Management**
   - React Query beheert cache automatisch
   - Manual cache clearing niet nodig
   - Query invalidation triggert automatische refetch

3. **Error Handling**
   - Errors worden doorgegeven via `error` property
   - Bestaande error handling blijft werken
   - Toevoegen van Error Boundaries is optioneel

## 📚 Referenties

- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Grondige Analyse](./PLAYER_LOADING_ANALYSIS_AND_SOLUTIONS.md)

