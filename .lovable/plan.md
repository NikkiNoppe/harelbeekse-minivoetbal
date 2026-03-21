

## Fix: misleidende scheidsrechter-meldingen verbergen in wedstrijdformulier

### Probleem

Zelfde patroon als het spelers-probleem: als een team manager een ingediend wedstrijdformulier bekijkt, retourneert de scheidsrechter-query 0 resultaten (RLS-beperking of lege lijst), terwijl de scheidsrechternaam al opgeslagen is in de matchdata. Dit veroorzaakt twee misleidende UI-elementen:

1. **"(niet beschikbaar)"** naast de scheidsrechternaam in de dropdown
2. **"Geen scheidsrechters gevonden"** retry-banner onder het veld

### Oplossing

**Bestand: `src/components/modals/matches/wedstrijdformulier-modal.tsx`**

**Wijziging 1 — "Geen scheidsrechters gevonden" banner (regel ~2056-2065)**

De `InlinePlayerRetry` voor referees alleen tonen als er ook geen geselecteerde scheidsrechter is:

```typescript
// Was:
{!loadingReferees && memoizedReferees.length === 0 && (
  <InlinePlayerRetry ... />
)}

// Wordt:
{!loadingReferees && memoizedReferees.length === 0 && !selectedReferee && (
  <InlinePlayerRetry ... />
)}
```

**Wijziging 2 — "(niet beschikbaar)" label (regel ~2036)**

Het "(niet beschikbaar)" label alleen tonen als het veld bewerkbaar is (admin/referee). Voor team managers die het formulier read-only bekijken is dit verwarrend:

```typescript
// Was:
{selectedReferee} {!loadingReferees && "(niet beschikbaar)"}

// Wordt:
{selectedReferee} {!loadingReferees && !isTeamManager && "(niet beschikbaar)"}
```

### Impact

- 2 kleine conditionele wijzigingen, geen logica- of data-aanpassingen
- Geen invloed op bewerkbare formulieren (admin/referee zien de meldingen nog wel als relevant)

