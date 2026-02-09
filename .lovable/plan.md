

## Playoff/beker wedstrijden tonen op /profile

### Probleem
De query in `useUpcomingMatches.ts` bevat op regel 57 een filter `.eq('is_cup_match', false)` dat alle playoff- en bekerwedstrijden uitsluit. De wedstrijd "PO-25-1766492793564-wzle" is een playoff-wedstrijd en wordt daardoor niet getoond.

### Oplossing
Verwijder het `is_cup_match` filter zodat zowel competitie-, playoff- als bekerwedstrijden getoond worden op de profielpagina, zolang ze geen score hebben of in de toekomst liggen.

### Aanpassing

**Bestand: `src/hooks/useUpcomingMatches.ts`**

Regel 57 verwijderen:
```
.eq('is_cup_match', false)
```

Dit is de enige wijziging die nodig is. Alle andere logica (sortering, naamresolutie, limiet) blijft ongewijzigd.
