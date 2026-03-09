

## Uniforme sortering: datum → locatie (Harelbeke eerst) → tijdstip

### Probleem

De sortering is inconsistent over de hele applicatie. Locatie wordt nergens meegenomen als sorteercriterium, en waar het wel voorkomt (scheidsrechters) is het alfabetisch (Bavikhove voor Harelbeke). De gewenste volgorde is:

1. **Datum** (chronologisch)
2. **Locatie** (Harelbeke - Dageraad eerst, daarna Bavikhove - Vlasschaard)
3. **Tijdstip** (vroegste eerst)

### Aanpak

**Eén centrale aanpassing** in `src/lib/matchSortingUtils.ts` — de locatie-prioriteit toevoegen aan alle sortfuncties. Alle consumers erven dit automatisch.

### Wijzigingen

| Bestand | Wat |
|---------|-----|
| `src/lib/matchSortingUtils.ts` | Nieuwe helper `getLocationOrder()` toevoegen. Inbouwen in `sortMatchesByDateAndTime`, `sortCupMatches`, `sortLeagueMatches`, en `sortMatchesWithinGroups` |
| `src/components/pages/admin/scheidsrechter/components/AssignmentManagement.tsx` | Locatiesortering aanpassen van alfabetisch naar Harelbeke-eerst |
| `src/components/pages/admin/scheidsrechter/components/AvailabilityMatrix.tsx` | Idem — sessiesortering aanpassen |
| `src/services/match/matchDataService.ts` | Geen wijziging nodig — gebruikt al `sortMatchesByDateAndTime` |

### Technisch detail

Nieuwe helper in `matchSortingUtils.ts`:

```typescript
const getLocationOrder = (location: string): number => {
  const loc = location.toLowerCase();
  if (loc.includes('harelbeke') || loc.includes('dageraad')) return 1;
  if (loc.includes('bavikhove') || loc.includes('vlasschaard')) return 2;
  return 3;
};
```

Deze wordt ingebouwd in alle sort-functies zodat na datum eerst op locatie wordt gesorteerd, daarna pas op tijdstip. De generieke `sortMatchesByDateAndTime` krijgt een optionele `location`-property:

```typescript
export const sortMatchesByDateAndTime = <T extends { date: string; time: string; location?: string }>(
  matches: T[]
): T[] => {
  return matches.sort((a, b) => {
    // 1. Datum
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    // 2. Locatie (Harelbeke eerst)
    if (a.location && b.location) {
      const locCompare = getLocationOrder(a.location) - getLocationOrder(b.location);
      if (locCompare !== 0) return locCompare;
    }
    // 3. Tijdstip
    return a.time.localeCompare(b.time);
  });
};
```

Voor de scheidsrechter-componenten die op `dateOnly + location` string sorteren, wordt `localeCompare` vervangen door `getLocationOrder`.

