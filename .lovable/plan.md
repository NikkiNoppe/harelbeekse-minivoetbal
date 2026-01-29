

# Fix Schorsing Datum Berekening

## Probleem Samenvatting

De "Actieve schorsingen" tabel toont verkeerde datums voor het veld "Geschorst voor wedstrijd". Het voorbeeld:
- **Speler**: Dieter Verbeke
- **Kaartdatum**: 15 september 2025 (rode kaart)
- **Weergegeven**: "Geschorst voor: 2 februari 2026"
- **Verwacht**: De eerste wedstrijd NA 15 september 2025

## Oorzaak

In `suspensionService.ts` wordt de volgende wedstrijd gezocht op basis van de **huidige datum**:

```typescript
// Regel 412 - PROBLEEM
.gte('match_date', new Date().toISOString())
```

Dit betekent dat de code altijd zoekt naar wedstrijden na vandaag (29 jan 2026), terwijl de schorsing geldt voor wedstrijden na de kaartdatum (15 sept 2025).

## Oplossing

De logica moet per speler de volgende wedstrijd(en) NA de kaartdatum berekenen, in plaats van één generieke "volgende wedstrijd" per team.

---

## Technische Wijzigingen

### Bestand: `src/domains/cards-suspensions/services/suspensionService.ts`

#### Wijziging 1: Verwijder de generieke "nextMatchesMap" benadering

De huidige code haalt één keer alle toekomstige wedstrijden op en maakt een map per team. Dit werkt niet omdat elke speler een andere kaartdatum kan hebben.

#### Wijziging 2: Bereken "suspendedForMatch" per speler op basis van cardDate

Nieuwe logica:
1. Haal de kaartdatum van de speler op
2. Zoek de eerste wedstrijd NA die kaartdatum voor dat team
3. Gebruik die wedstrijd als "suspendedForMatch"

Gerefactoreerde code (regels 396-460):

```typescript
// Helper function to get next match AFTER a specific date for a team
const getNextMatchAfterDate = (
  teamId: number, 
  afterDate: string
): { date: string; opponent: string } | undefined => {
  if (!matchesData || !afterDate) return undefined;
  
  const afterDateTime = new Date(afterDate).getTime();
  
  // Sort matches by date ascending and find first match after the card date
  const teamMatches = matchesData
    .filter(match => 
      (match.home_team_id === teamId || match.away_team_id === teamId) &&
      new Date(match.match_date).getTime() > afterDateTime
    )
    .sort((a, b) => 
      new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
    );
  
  if (teamMatches.length === 0) return undefined;
  
  const firstMatch = teamMatches[0];
  const isHome = firstMatch.home_team_id === teamId;
  const opponent = isHome 
    ? (firstMatch.teams_away as any)?.team_name || 'Onbekend'
    : (firstMatch.teams_home as any)?.team_name || 'Onbekend';
  
  // Use local date components to avoid timezone shifts
  const matchDate = new Date(firstMatch.match_date);
  const year = matchDate.getUTCFullYear();
  const month = String(matchDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(matchDate.getUTCDate()).padStart(2, '0');
  
  return {
    date: `${year}-${month}-${day}`,
    opponent
  };
};
```

#### Wijziging 3: Update de player processing loop

Bij het verwerken van elke speler:

```typescript
// Voor gele kaarten
if (player.yellowCards >= 2) {
  const cardDate = getLastCardDate(player.playerId, 'yellow');
  const suspendedForMatch = cardDate && player.teamId 
    ? getNextMatchAfterDate(player.teamId, cardDate) 
    : undefined;
  
  suspensions.push({
    // ...existing fields...
    cardDate,
    suspendedForMatch
  });
}

// Voor rode kaarten
if (player.redCards > 0) {
  const cardDate = getLastCardDate(player.playerId, 'red');
  const suspendedForMatch = cardDate && player.teamId 
    ? getNextMatchAfterDate(player.teamId, cardDate) 
    : undefined;
  
  suspensions.push({
    // ...existing fields...
    cardDate,
    suspendedForMatch
  });
}
```

---

## Datum Formattering

Volgens de lovable-stack-overflow richtlijnen moet de datum correct worden geformatteerd om timezone shifts te voorkomen:

```typescript
// CORRECT: gebruik locale date componenten
const year = matchDate.getUTCFullYear();
const month = String(matchDate.getUTCMonth() + 1).padStart(2, '0');
const day = String(matchDate.getUTCDate()).padStart(2, '0');
return `${year}-${month}-${day}`;

// FOUT: vermijd toISOString() voor display dates
// Dit kan timezone shifts veroorzaken
```

---

## Verwacht Resultaat

Na implementatie:
- **Dieter Verbeke** (rode kaart 15 sept 2025): Geschorst voor de wedstrijd op 30 september 2025 (eerste wedstrijd NA kaartdatum)
- Alle schorsingen tonen de correcte "geschorst voor" datum gebaseerd op wanneer de kaart daadwerkelijk is gegeven
- Geen timezone-gerelateerde datum verschuivingen meer

---

## Bestanden

| Bestand | Actie | Beschrijving |
|---------|-------|--------------|
| `src/domains/cards-suspensions/services/suspensionService.ts` | Aanpassen | Fix datum berekening voor suspendedForMatch |

---

## Optionele Verbetering

Overweeg om ook de **status** van de schorsing correct te berekenen:
- Als de kaartdatum + schorsingsperiode in het verleden ligt → status: 'completed'
- Als de speler nog wedstrijden moet uitzitten → status: 'active'

Dit kan in een follow-up worden geïmplementeerd.

