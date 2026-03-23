

## Plan: Scheidsrechter wedstrijdformulier aanpassingen

### 1. Gegevens onveranderbaar voor scheidsrechter (Datum, Tijd, Locatie, Speeldag)

**Bestand:** `src/components/modals/matches/wedstrijdformulier-modal.tsx`

De velden Datum, Tijd, Locatie en Speeldag gebruiken `disabled={!showRefereeFields}` (regel 1960, 1972, 1986, 2001). Omdat `showRefereeFields = isReferee || isAdmin`, zijn deze velden **enabled** voor referees. Dit moet worden aangepast:

- Datum, Tijd, Locatie, Speeldag: `disabled={!isAdmin}` — alleen admins mogen deze wijzigen, referees niet.

### 2. "Playoff Speeldag X" verkorten naar "Playoff X"

**Bestand:** `src/services/match/playoffService.ts` (regels 411, 440)

- Wijzig `speeldag: \`Playoff Speeldag ${matchday}\`` naar `speeldag: \`Playoff ${matchday}\``

Dit past enkel toekomstige playoff-wedstrijden aan. Voor bestaande data:

**Bestand:** `src/components/pages/admin/matches/services/matchesFormService.ts`

- In de mapping van matches, een simpele replace toevoegen:
  ```
  matchdayDisplay = matchdayDisplay.replace('Playoff Speeldag', 'Playoff')
  ```

### 3. "(niet beschikbaar)" weghalen bij scheidsrechter

**Bestand:** `src/components/modals/matches/wedstrijdformulier-modal.tsx` (regel 2046)

De conditie `!loadingReferees && !isTeamManager` toont "(niet beschikbaar)" voor admins en referees wanneer de geselecteerde scheidsrechter niet in de lijst zit. Dit is misleidend als de scheidsrechter zichzelf ziet.

- Verwijder de "(niet beschikbaar)" tekst volledig. De scheidsrechter staat gewoon als optie in de dropdown, en kan een andere selecteren indien nodig.

### 4. Niet-toegewezen wedstrijden ook tonen voor referees op /admin/match-forms/playoffs

**Bestand:** `src/components/pages/admin/matches/services/matchesFormService.ts` (regel 59-61)

Huidige filter voor referees:
```
query.or(`assigned_referee_id.eq.${refereeFilter.userId},referee.eq.${refereeFilter.username}`)
```

Dit filtert alleen op toegewezen wedstrijden. Uitbreiden met wedstrijden zonder scheidsrechter:
```
query.or(`assigned_referee_id.eq.${refereeFilter.userId},referee.eq.${refereeFilter.username},referee.is.null`)
```

Hierdoor ziet de referee ook wedstrijden waar nog geen scheidsrechter is toegewezen, en kan deze zichzelf toewijzen via het formulier.

### Technische details

| Bestand | Wijziging |
|---------|-----------|
| `wedstrijdformulier-modal.tsx` | 4 velden `disabled={!isAdmin}`, verwijder "(niet beschikbaar)" tekst |
| `playoffService.ts` | "Playoff Speeldag" → "Playoff" |
| `matchesFormService.ts` | Replace "Playoff Speeldag" → "Playoff" in mapping + referee filter uitbreiden met `referee.is.null` |

