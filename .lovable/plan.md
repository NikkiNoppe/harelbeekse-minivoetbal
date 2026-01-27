
# Plan: Fix Scheidsrechter Wedstrijdformulieren Zichtbaarheid

## Probleem Analyse

Scheidsrechters zien geen wedstrijden op de `/admin/match-forms/playoffs` (en andere match forms) pagina's door twee problemen:

### Probleem 1: Foutieve TeamId Check
In `AdminPlayoffMatchesPage.tsx` op regel 117:
```typescript
if (!isAdmin && !teamId) {
  return <EmptyState message="Geen team toegewezen" />;
}
```

Deze check blokkeert scheidsrechters omdat:
- Scheidsrechters zijn geen admin (`!isAdmin = true`)
- Scheidsrechters hebben geen teamId (`!teamId = true`) - ze beheren geen teams

### Probleem 2: Ontbrekende Scheidsrechter Filtering
De `matchesFormService` behandelt scheidsrechters hetzelfde als admins:
- Bij `hasElevatedPermissions = true` worden ALLE wedstrijden opgehaald
- Er is geen filter voor scheidsrechter-specifieke wedstrijden
- Dit betekent dat scheidsrechters alle wedstrijden zien (of geen, afhankelijk van de check)

## Technische Oplossing

### Wijziging 1: AdminPlayoffMatchesPage.tsx - Fix TeamId Check

**Bestand**: `src/components/pages/admin/matches/AdminPlayoffMatchesPage.tsx`

**Huidige code (regel 116-119)**:
```typescript
// No team selected for non-admin users
if (!isAdmin && !teamId) {
  return <EmptyState message="Geen team toegewezen" />;
}
```

**Nieuwe code**:
```typescript
// No team selected for team managers only (admins and referees don't need teamId)
if (!isAdmin && !isReferee && !teamId) {
  return <EmptyState message="Geen team toegewezen" />;
}
```

**Reden**: Scheidsrechters moeten niet geblokkeerd worden door ontbrekende teamId - ze hebben toegang via hun scheidsrechter toewijzing.

### Wijziging 2: matchesFormService.ts - Voeg Scheidsrechter Filter Toe

**Bestand**: `src/components/pages/admin/matches/services/matchesFormService.ts`

Voeg een nieuw parameter toe voor scheidsrechter filtering en pas de query aan:

```typescript
export const fetchUpcomingMatches = async (
  teamId: number,
  hasElevatedPermissions: boolean = false,
  competitionType?: 'league' | 'cup' | 'playoff',
  refereeFilter?: { userId: number; username: string } // NIEUW
): Promise<MatchFormData[]> => {
  // ...bestaande code...
  
  // Apply filters based on user type
  if (!hasElevatedPermissions && teamId > 0) {
    // Team manager: filter op team
    query = query.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);
  } else if (refereeFilter) {
    // Scheidsrechter: filter op toegewezen wedstrijden
    query = query.or(
      `assigned_referee_id.eq.${refereeFilter.userId},referee.eq.${refereeFilter.username}`
    );
  }
  // Admin: geen filter, alle wedstrijden
```

### Wijziging 3: useMatchFormsData.ts - Doorgeven Scheidsrechter Info

**Bestand**: `src/hooks/useMatchFormsData.ts`

Update de hook om scheidsrechter informatie door te geven:

```typescript
export const useMatchFormsData = (
  teamId: number,
  hasElevatedPermissions: boolean,
  refereeFilter?: { userId: number; username: string } // NIEUW
) => {
  // ...in query functies...
  queryFn: async () => {
    return fetchUpcomingMatches(
      hasElevatedPermissions ? 0 : teamId, 
      hasElevatedPermissions, 
      'league',
      refereeFilter // Doorgeven aan service
    );
  },
```

### Wijziging 4: AdminPlayoffMatchesPage.tsx - Scheidsrechter Filter Meegeven

**Bestand**: `src/components/pages/admin/matches/AdminPlayoffMatchesPage.tsx`

```typescript
// Scheidsrechter filter voor wedstrijdformulieren
const refereeFilter = useMemo(() => {
  if (isReferee && user?.id && user?.username) {
    return { userId: user.id, username: user.username };
  }
  return undefined;
}, [isReferee, user?.id, user?.username]);

// Fetch playoff matches data met scheidsrechter filter
const matchFormsData = useMatchFormsData(
  teamId, 
  isAdmin || isReferee,
  isReferee ? refereeFilter : undefined // Alleen voor scheidsrechters
);
```

### Wijziging 5: MatchesPage.tsx - Zelfde Aanpassing

**Bestand**: `src/components/pages/admin/matches/MatchesPage.tsx`

Dezelfde scheidsrechter filter logica toepassen voor league en cup wedstrijden.

---

## Bestanden Overzicht

| Bestand | Actie | Beschrijving |
|---------|-------|--------------|
| `src/components/pages/admin/matches/AdminPlayoffMatchesPage.tsx` | Aanpassen | Fix teamId check, voeg scheidsrechter filter toe |
| `src/components/pages/admin/matches/services/matchesFormService.ts` | Aanpassen | Voeg refereeFilter parameter toe |
| `src/hooks/useMatchFormsData.ts` | Aanpassen | Doorgeef scheidsrechter filter naar service |
| `src/components/pages/admin/matches/MatchesPage.tsx` | Aanpassen | Zelfde scheidsrechter filter logica |

---

## Verwacht Resultaat

Na implementatie:

1. **Scheidsrechters worden niet meer geblokkeerd** door de `!teamId` check
2. **Scheidsrechters zien alleen hun toegewezen wedstrijden** (via `assigned_referee_id` OF `referee` veld)
3. **Admins blijven alle wedstrijden zien**
4. **Team managers blijven alleen hun team wedstrijden zien**
5. **Consistentie** over alle wedstrijdformulieren pagina's (league, cup, playoffs)

---

## Technische Overwegingen

### Waarom beide velden checken (assigned_referee_id EN referee)?
De database data toont dat sommige wedstrijden alleen een `referee` (username) hebben ingevuld, terwijl andere ook een `assigned_referee_id` hebben. Door beide te checken met een OR, worden alle toegewezen wedstrijden correct gevonden.

### Backward Compatibility
- Admins: geen verandering in gedrag
- Team managers: geen verandering in gedrag  
- Scheidsrechters: gefixte functionaliteit die eerder niet werkte
