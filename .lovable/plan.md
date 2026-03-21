

## Diagnose: "Geen spelers gevonden" bij tegenstander terwijl spelers wél zichtbaar zijn

### Oorzaak

Het probleem zit in de combinatie van twee dingen:

1. **Beveiligingsregel**: De `get_players_for_team` RPC retourneert **geen spelers** voor de tegenpartij bij een **ingediend** wedstrijdformulier. Dit is correct gedrag — team managers mogen alleen tegenstander-spelers zien bij niet-ingediende wedstrijden.

2. **Spelernamen staan al in de opgeslagen data**: De JSONB-velden `home_players`/`away_players` bevatten de namen van de geselecteerde spelers. Die worden correct weergegeven in de UI.

3. **Foutmelding is misleidend**: De `InlinePlayerRetry` component (regel 1095-1103) controleert `hasEmptyResult` (regel 1078):
   ```
   hasEmptyResult = !isLoading && !error && memoizedPlayers !== undefined && memoizedPlayers.length === 0
   ```
   Dit is `true` voor de tegenpartij bij een ingediende wedstrijd, want de RPC retourneert terecht 0 spelers. Maar de melding "Geen spelers gevonden + Opnieuw" is verwarrend, want de spelersnamen staan er wél.

### Oplossing

**In `renderPlayerSelectionTable` (wedstrijdformulier-modal.tsx, rond regel 1078-1103)**:

De `InlinePlayerRetry` banner niet tonen wanneer er al spelerselecties bestaan met namen. Als de selecties al gevulde `playerName` waarden bevatten, zijn de dropdown-data niet nodig voor weergave — de banner is dan misleidend.

Concrete wijziging:
- `hasEmptyResult` uitbreiden met een check: toon de banner alleen als er ook geen selecties met `playerName` bestaan.
- Pseudo-logica: `const hasExistingSelections = selections.some(s => s.playerName && s.playerName !== '(niet beschikbaar)');`
- Alleen `InlinePlayerRetry` renderen als `hasEmptyResult && !hasExistingSelections`.

Dit is een minimale, veilige aanpassing die het gedrag niet wijzigt voor scenario's waar spelers écht niet geladen kunnen worden.

### Wat betreft laadsnelheid

Na analyse van de huidige implementatie:

- **React Query caching** (2 min staleTime) werkt correct — herhaald openen herlaadt niet.
- **Exponential backoff** (1.5s → 10s max, 4 retries) is adequaat.
- **`placeholderData`** voorkomt flikkering bij cache-hit.
- **SECURITY DEFINER RPC** is atomair — geen RLS context-verlies.
- **Min loading time** (250ms) in `useTeamPlayers` is redelijk voor UX stabiliteit.
- **Timeout** (15s) met auto-retry is aanwezig.

**Geen significante verbeterpunten** gevonden in de laadlogica. De architectuur is robuust na de 100+ eerdere iteraties. Het enige echte probleem is de misleidende foutmelding.

### Technische details

- Bestand: `src/components/modals/matches/wedstrijdformulier-modal.tsx`
- Wijziging: ~5 regels rond regel 1078-1103
- Geen database/RPC wijzigingen nodig
- Geen nieuwe dependencies

