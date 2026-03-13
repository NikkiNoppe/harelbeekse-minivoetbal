

## Probleem: Playoff data corruptie + preventie

### 1. Data Herstel

Er is momenteel 1 beschadigde wedstrijd gevonden:

| Match | Huidig | Moet zijn |
|-------|--------|-----------|
| PO-22 (match_id 2197, Team 16 vs Team 2) | Speeldag 2, 2026-01-27 19:30 | Speeldag 4, 2026-02-10 18:30 |

Dit verklaart waarom Speeldag 2 ineens 8 wedstrijden toont en Speeldag 4 maar 6.

**Herstel**: Een SQL-migratie die deze ene wedstrijd corrigeert:
- `speeldag` terug naar "Playoff Speeldag 4"
- `match_date` terug naar "2026-02-10 18:30:00+00" (overeenkomend met het patroon van andere PO2-wedstrijden in Speeldag 4)

### 2. Bug Fix: Voorkom toekomstige corruptie

**Oorzaak**: Wanneer een gebruiker het wedstrijdformulier opslaat (score, spelers, etc.), stuurt de code ALTIJD ook de velden `date`, `time`, `location` en `matchday` mee (regel 598-600 in `wedstrijdformulier-modal.tsx`). Deze waarden worden uit de lokale `matchData` state gehaald, die bij het openen van het formulier wordt gevuld met de huidige wedstrijdgegevens. Als er iets misgaat met de state (bv. verkeerde match data geladen), worden de originele waarden overschreven.

**Oplossing**: Alleen `date`, `time`, `location` en `matchday` meesturen als de gebruiker admin of scheidsrechter is (de enigen die deze velden mogen wijzigen). Voor team managers worden deze velden niet meegestuurd, waardoor ze niet per ongeluk overschreven kunnen worden.

In `createUpdatedMatch` wordt de spread `...matchData` conditioneel gemaakt:
- Admin/scheidsrechter: `matchData` wordt meegestuurd (zij mogen deze velden wijzigen)
- Team manager: `matchData` wordt NIET meegestuurd, alleen score, spelers en kaarten

### Technische Details

**Bestanden die gewijzigd worden:**

1. **Nieuwe SQL-migratie** - Herstel PO-22:
```
UPDATE matches 
SET speeldag = 'Playoff Speeldag 4', 
    match_date = '2026-02-10 18:30:00+00'
WHERE match_id = 2197 
AND unique_number = 'PO-22-1766492793564-7079';
```

2. **`src/components/modals/matches/wedstrijdformulier-modal.tsx`** - In `createUpdatedMatch` (rond regel 598):
   - De huidige code `...matchData` (die altijd date/time/location/matchday meestuurt) wordt vervangen door een conditionele spread
   - Alleen als `isAdmin || isReferee` worden de `matchData` velden meegestuurd
   - Voor team managers wordt `matchData` weggelaten uit het update-object

Dit voorkomt dat team managers per ongeluk datum, tijd, locatie of speeldag overschrijven wanneer zij enkel een score of spelerslijst indienen.
