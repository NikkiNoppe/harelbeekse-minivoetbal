

## Late Submission Penalty: Analyse en Plan

### Huidige situatie

De tekst "⚠️ BOETE: Wedstrijdblad te laat ingevuld - €5.00" wordt momenteel **alleen** opgeslagen als tekst in het `referee_notes` veld van de wedstrijd. Er wordt **geen** financiële transactie aangemaakt in `team_costs`. Dit betekent dat de boete op dit moment **niet financieel verwerkt wordt** -- het is puur een tekstnotitie.

### Wat moet er gebeuren

1. **Financiële verwerking toevoegen**: Bij een te late inzending moet er een `team_costs` record aangemaakt worden voor het team dat te laat is, gekoppeld aan een "Boete te laat ingevuld" cost setting.
2. **Notitie verwijderen uit referee_notes**: Daarna kan de boetetekst veilig verwijderd worden uit de `referee_notes`, zodat alleen echte scheidsrechternotities daar verschijnen.

### Technische wijzigingen

#### 1. Cost setting aanmaken (database migratie)

Een nieuw record in de `costs` tabel voor de late penalty:
```sql
INSERT INTO costs (name, amount, category, is_active)
VALUES ('Boete te laat ingevuld', 5.00, 'penalty', true)
ON CONFLICT DO NOTHING;
```

#### 2. Financiële boete creëren bij late submission (`enhancedMatchService.ts`)

In de `isLateSubmission` code block (regel 144-151):
- **Stop** met het toevoegen van de boetetekst aan `referee_notes`
- **Start** met het aanmaken van een `team_costs` record via de background side effects

De late penalty wordt toegevoegd als een nieuwe background side effect in `backgroundSideEffects.ts`:
- Zoek de "Boete te laat ingevuld" cost setting op
- Insert een `team_costs` record voor het team dat te laat indient
- Idempotent: check of er al een late-penalty record bestaat voor deze match + team

#### 3. RefereeNotesCard filteren (`RefereeNotesCard.tsx`)

Als extra veiligheid: filter notities die beginnen met "⚠️ BOETE:" uit het overzicht, zodat eventuele oude boete-notities niet meer verschijnen.

### Bestanden

1. **Nieuwe SQL migratie** -- cost setting "Boete te laat ingevuld" toevoegen
2. **`src/services/match/enhancedMatchService.ts`** -- stop met boetetekst in referee_notes, geef `isLateSubmission` + team info door aan side effects
3. **`src/services/match/backgroundSideEffects.ts`** -- nieuwe `syncLatePenalty` side effect die een `team_costs` record aanmaakt
4. **`src/components/pages/user/RefereeNotesCard.tsx`** -- filter "⚠️ BOETE:" notities uit het overzicht

