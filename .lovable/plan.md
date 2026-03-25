

## Plan: Merge Boetes + Financieel & Fix CRUD

### Kernprobleem gevonden

De `delete_team_cost_as_admin` en `update_team_cost_as_admin` RPC functies checken `v_role != 'admin'` en weigeren dus **alle** scheidsrechter-verzoeken. Scheidsrechters kunnen via RLS wel boetes *toevoegen* maar niet *verwijderen* of *aanpassen*. Daarom lijkt het "succesvol" (geen error) maar verdwijnt het record niet echt.

### Wijzigingen

#### 1. Database migratie: RPC functies voor referee CRUD

Nieuwe `manage_team_cost_for_match` SECURITY DEFINER functie die zowel admin als referee toelaat:
- **Admin**: altijd toegestaan
- **Referee**: alleen voor `team_costs` gekoppeld aan wedstrijden waar ze toegewezen zijn
- Operaties: `delete`, `update` (bedrag, cost_setting_id, team_id)
- Bevat gedetailleerde RAISE NOTICE logging voor debuggability

#### 2. Service laag: referee-aware CRUD

**`src/services/financial/costSettingsService.ts`**:
- `deleteTransaction`: detecteer rol uit localStorage; gebruik nieuwe RPC als referee, bestaande `delete_team_cost_as_admin` als admin
- `updateTransaction`: idem
- Toevoegen: gedetailleerde `console.log` bij elke operatie (request, response, error)

#### 3. UI: Merge Boetes + Financieel secties

**`src/components/modals/matches/wedstrijdformulier-modal.tsx`**:

Verwijder aparte `isBoetesOpen` state en `boetesSection`. Eén sectie "Financieel" (`isFinancieelOpen`), zichtbaar voor `showRefereeFields` (admin + referee):

```text
┌─────────────────────────────────────┐
│ Financieel                     ▼    │
├─────────────────────────────────────┤
│ ── Boetes ──                        │
│ [Nieuwe boete toevoegen formulier]  │
│ [Opgeslagen boetes lijst + CRUD]    │
│                                     │
│ ── Wedstrijdkosten ── (admin only)  │
│ [Kosten lijst + CRUD]              │
│ [Kost toevoegen formulier]          │
└─────────────────────────────────────┘
```

- **Boetes subsectie**: zichtbaar voor admin + referee
  - Toevoegen: bestaand penalty-formulier (team + type selectie)
  - Opgeslagen boetes: met edit (bedrag + type + team) en delete knoppen
  - Edit inline: klik op bedrag/naam opent edit-modus met dropdowns
- **Wedstrijdkosten subsectie**: `{isAdmin && (...)}` — alleen admin
  - Bestaande matchCosts lijst met edit/delete
  - Bestaand "Kost toevoegen" formulier

#### 4. Console logging toevoegen

Elke CRUD actie krijgt gedetailleerde logs:
```
🔵 [PENALTY-CRUD] DELETE request: { costId: 2211, userId: 5, role: 'referee' }
🔵 [PENALTY-CRUD] DELETE response: { success: true, deletedId: 2211 }
❌ [PENALTY-CRUD] DELETE failed: { costId: 2211, error: '...' }
```

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `supabase/migrations/new.sql` | Nieuwe `manage_team_cost_for_match` RPC |
| `src/services/financial/costSettingsService.ts` | Referee-aware CRUD + logging |
| `src/components/modals/matches/wedstrijdformulier-modal.tsx` | Merge secties, edit-functionaliteit voor boetes |

### Geen wijzigingen aan
- Database triggers (`process_match_financial_costs`) — dirty-tracking in enhancedMatchService voorkomt al ongewenste re-creatie
- FinancialPage.tsx — al correct na eerdere wijziging
- backgroundSideEffects.ts — al correct met `_submissionTransition` flag

