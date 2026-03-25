
Doel: Boetes en Financieel samenvoegen naar één "Financieel" sectie in het wedstrijdformulier.

## Status: ✅ Afgerond

### Uitgevoerd:

1. **Database migratie**: Nieuwe `manage_team_cost_for_match` SECURITY DEFINER RPC die zowel admin als referee toelaat om team_costs te verwijderen en bij te werken. Referees worden geautoriseerd op basis van hun toewijzing aan de wedstrijd.

2. **Service laag** (`costSettingsService.ts`):
   - `deleteTransaction` en `updateTransaction` gebruiken nu de nieuwe `manage_team_cost_for_match` RPC i.p.v. de admin-only functies
   - `_getUserContext()` haalt zowel userId als role op
   - Gedetailleerde console.log bij elke CRUD-operatie (🔵 request, 🔵 response, ❌ error, ⚠️ warning)
   - `updateTransaction` ondersteunt nu ook `team_id` wijziging

3. **UI merge** (`wedstrijdformulier-modal.tsx`):
   - Aparte "Boetes" sectie verwijderd
   - Eén "Financieel" sectie zichtbaar voor admin + referee
   - Boetes subsectie: volledige CRUD (toevoegen, opslaan, verwijderen)
   - Wedstrijdkosten subsectie: alleen zichtbaar voor admin
   - `loadMatchCosts` werkt nu ook voor referees

### Zichtbaarheid:
- **Admin + Referee**: Boetes (volledige CRUD) + Financieel sectie
- **Admin only**: Wedstrijdkosten subsectie binnen Financieel
- **Team managers**: Geen toegang tot Financieel sectie
