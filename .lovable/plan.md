

## Analyse: Scheidsrechters laden traag door onnodige RLS context

### Hoofdoorzaak

`fetchReferees()` in `useRefereesQuery.ts` wrapt de query met `withUserContext()`. Dit doet een extra RPC call (`set_current_user_context`) vóór elke referee-query.

**Maar `referees_public` is een view zonder RLS policies** — het heeft helemaal geen user context nodig. De `withUserContext` wrapper voegt dus alleen maar latency toe (en kan zelfs falen als de context-RPC traag is of een race condition heeft met andere parallelle context-calls via de `contextPromise` lock).

Bovendien heeft de query een 15-seconden timeout die racet met de `withUserContext` + de eigenlijke query. Als `withUserContext` al 2-3 seconden duurt (context instellen + verificatie in dev), blijft er minder tijd over voor de eigenlijke query.

### Oplossing

Verwijder `withUserContext` uit `fetchReferees()`. Query `referees_public` direct — het is een publieke view, geen context nodig.

### Wijzigingen

**`src/hooks/useRefereesQuery.ts`**
- Verwijder de `withUserContext` wrapper rond de Supabase query
- Query `referees_public` direct met `supabase.from(...).select(...).order(...)`
- Verwijder de import van `withUserContext`
- Verwijder de import van `useAuth` en de `authContextReady` check (niet nodig voor publieke view)
- Vereenvoudig de timeout logica (kan korter, bv 8 seconden)

Dit elimineert:
1. De extra RPC call voor context instellen
2. De wachttijd op de `contextPromise` lock (als andere queries parallel context instellen)
3. De dev-only context verificatie delay (10ms + extra RPCs)
4. De afhankelijkheid van `authContextReady` — referees kunnen laden zodra de modal opent

### Bestanden
1. `src/hooks/useRefereesQuery.ts` — verwijder withUserContext, direct query op publieke view

