

## Komende wedstrijden: ook gesloten wedstrijden zonder score tonen

### Huidige situatie
De `useUpcomingMatches` hook filtert nu alleen op wedstrijden met een datum in de toekomst (`.gte('match_date', now)`). Hierdoor worden wedstrijden die al gespeeld zijn maar nog geen score hebben (bv. gesloten/locked wedstrijden) niet getoond.

### Gewenste situatie
Alle wedstrijden tonen die:
- In de toekomst liggen, **OF**
- Nog geen score hebben (ongeacht of ze gesloten/locked zijn)

### Aanpassing

**Bestand: `src/hooks/useUpcomingMatches.ts`**

De huidige filter:
```
.gte('match_date', now)
```

Wordt vervangen door een gecombineerde filter die ook wedstrijden zonder score meeneemt:
```
.or(`match_date.gte.${now},and(home_score.is.null,away_score.is.null)`)
```

Dit zorgt ervoor dat:
- Toekomstige wedstrijden altijd getoond worden
- Wedstrijden in het verleden zonder ingevulde score ook getoond worden (bv. gesloten maar nog niet afgewerkt)
- Wedstrijden met een ingevulde score uit het verleden verdwijnen uit de lijst

Geen andere bestanden hoeven gewijzigd te worden.

