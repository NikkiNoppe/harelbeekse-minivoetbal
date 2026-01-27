
# Plan: SECURITY DEFINER RPC voor Wedstrijdformulier Spelerslijsten

## Probleem

De `useTeamPlayersQuery` hook (gebruikt door wedstrijdformulieren) haalt spelers nog steeds op via directe tabel queries met `withUserContext`. Dit kan RLS context verlies veroorzaken door connection pooling - hetzelfde probleem dat we net hebben opgelost voor de `/admin/players` pagina.

## Huidige Situatie

```text
usePlayersQuery (admin/players)     →  get_players_for_team RPC  ✅ (Net gefixt)
useTeamPlayersQuery (match forms)   →  Direct table query         ❌ (Nog te fixen)
```

## Oplossing

De bestaande `get_players_for_team` RPC kan direct hergebruikt worden. We hoeven alleen `useTeamPlayersQuery` aan te passen om deze RPC te gebruiken in plaats van de directe query.

## Technische Wijzigingen

### Wijziging 1: useTeamPlayersQuery.ts aanpassen

**Bestand**: `src/hooks/useTeamPlayersQuery.ts`

De `fetchTeamPlayers` functie wordt vervangen door een RPC-aanroep:

```typescript
// Nieuwe implementatie
const fetchTeamPlayers = async (teamId: number): Promise<TeamPlayer[]> => {
  const userId = getUserIdFromStorage();
  
  if (!userId) {
    console.error('No user ID found for team player fetch');
    return [];
  }
  
  const { data, error } = await supabase.rpc('get_players_for_team', {
    p_user_id: userId,
    p_team_id: teamId
  });
  
  if (error) throw error;
  return (data || []) as TeamPlayer[];
};
```

Daarnaast:
- Verwijder de `withUserContext` wrapper (niet meer nodig met RPC)
- Voeg `staleTime: 2 * 60 * 1000` toe (2 minuten cache, zoals usePlayersQuery)
- Voeg `placeholderData: (previousData) => previousData` toe voor betere UX

### Wijziging 2: Debug logging opschonen

De uitgebreide debug logging in development mode kan vereenvoudigd worden nu de RPC de context-verificatie intern afhandelt.

---

## Bestanden Overzicht

| Bestand | Actie | Beschrijving |
|---------|-------|--------------|
| `src/hooks/useTeamPlayersQuery.ts` | Aanpassen | Gebruik RPC i.p.v. directe query, verwijder `withUserContext` |

---

## Voordelen

1. **Geen database wijziging nodig** - We hergebruiken de bestaande `get_players_for_team` RPC
2. **Consistentie** - Alle spelerslijsten gebruiken dezelfde atomaire aanpak
3. **Betrouwbaarheid** - Elimineert RLS context verlies in wedstrijdformulieren
4. **Betere caching** - 2 minuten staleTime voorkomt onnodige requests
5. **Eenvoudiger code** - Minder debug logging en geen `withUserContext` nodig

---

## Verwacht Resultaat

Na implementatie:
- Wedstrijdformulier spelerslijsten laden even betrouwbaar als de admin players pagina
- Geen "niet beschikbaar" berichten meer door RLS context verlies
- Snellere herhaalde laadtijden door 2 minuten cache
