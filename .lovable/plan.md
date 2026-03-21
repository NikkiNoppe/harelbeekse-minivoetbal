

## Bug: Gegevens-sectie toont data van vorige wedstrijd

### Oorzaak

`matchData` (date, time, location, matchday) wordt geinitialiseerd via `useState` op regel 461-466 met de eerste `match` prop, maar wordt **nooit gesynchroniseerd** wanneer de `match` prop verandert (andere wedstrijd geopend). Andere velden (scores, scheidsrechter, notities, spelers) worden wel gesynchroniseerd via de `useEffect` in `useMatchFormState`, maar `matchData` zit buiten die hook.

Resultaat: als je de modal een tweede keer opent met een andere wedstrijd, blijven date/time/location/matchday staan van de eerste wedstrijd.

### Oplossing

**Bestand: `src/components/modals/matches/wedstrijdformulier-modal.tsx`**

Voeg een `useEffect` toe direct na regel 466 die `matchData` synchroniseert wanneer de `match` prop verandert:

```typescript
// Sync matchData when match prop changes (e.g. opening a different match)
useEffect(() => {
  setMatchData({
    date: match.date,
    time: match.time,
    location: match.location,
    matchday: match.matchday || "",
  });
}, [match.matchId, match.date, match.time, match.location, match.matchday]);
```

Dit volgt exact hetzelfde patroon als de bestaande sync-effect in `useMatchFormState` (regel 91-128). Eén kleine toevoeging, geen risico op neveneffecten.

