

# Fix: Schorsing Wedstrijd Berekening

## Probleem

De schorsing toont de verkeerde wedstrijd omdat:

1. **matchesData bevat alleen gespeelde wedstrijden** - De query filtert op `is_submitted = true`
2. **De volgende wedstrijd moet uit ALLE wedstrijden komen** - Zowel gespeelde als toekomstige

Als Dieter Verbeke op 15 september een rode kaart krijgt, moet de schorsing gelden voor de eerste wedstrijd NA 15 september, ongeacht of die al gespeeld is.

## Technische Oplossing

### Bestand: `src/domains/cards-suspensions/services/suspensionService.ts`

**Wijziging: Aparte query voor alle wedstrijden (niet alleen submitted)**

Voeg een tweede query toe die ALLE wedstrijden ophaalt voor de "volgende wedstrijd" berekening:

```typescript
// Bestaande query voor kaartdatums (blijft is_submitted = true)
const { data: matchesData } = await supabase
  .from('matches')
  .select('...')
  .eq('is_submitted', true);  // Kaarten komen alleen uit gespeelde wedstrijden

// NIEUWE query voor alle wedstrijden (voor "volgende wedstrijd" berekening)
const { data: allMatchesData } = await supabase
  .from('matches')
  .select(`
    match_id,
    match_date,
    home_team_id,
    away_team_id,
    teams_home:teams!home_team_id ( team_name ),
    teams_away:teams!away_team_id ( team_name )
  `)
  .order('match_date', { ascending: true });  // Geen is_submitted filter!
```

Vervolgens `getNextMatchAfterDate` aanpassen om `allMatchesData` te gebruiken:

```typescript
const getNextMatchAfterDate = (
  teamId: number, 
  afterDate: string
): { date: string; opponent: string } | undefined => {
  if (!allMatchesData || !afterDate) return undefined;  // Gebruik allMatchesData
  
  const afterDateTime = new Date(afterDate).getTime();
  
  // Filter matches for this team that are AFTER the card date
  const teamMatches = allMatchesData
    .filter(match => 
      (match.home_team_id === teamId || match.away_team_id === teamId) &&
      new Date(match.match_date).getTime() > afterDateTime
    )
    .sort((a, b) => 
      new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
    );
  
  // ... rest blijft hetzelfde
};
```

---

## Bestanden

| Bestand | Actie |
|---------|-------|
| `src/domains/cards-suspensions/services/suspensionService.ts` | Aanpassen |

---

## Verwacht Resultaat

- **Dieter Verbeke** (rode kaart 15 sept 2025): Geschorst voor de wedstrijd op ~22 september 2025 (eerste wedstrijd NA kaartdatum, ongeacht of die al gespeeld is)
- Schorsingen tonen altijd de correcte "volgende wedstrijd" na de kaartdatum

