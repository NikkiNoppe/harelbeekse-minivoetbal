

## ✅ Voltooid: Wedstrijdformulier uitbreidingen (4 onderdelen)

Alle 4 onderdelen zijn geïmplementeerd:

1. **Scheidsrechter leeg laten** — "Geen scheidsrechter" optie in dropdown, `__none__` mapped naar lege string, `enhancedMatchService.ts` zet `referee: updateData.referee || null`
2. **Boetes verwijderen** — `savedPenalties` bevat nu `id` van `team_costs` rij, `removeSavedPenalty` roept `costSettingsService.deleteTransaction` via `withUserContext` aan
3. **Financieel kadertje** — Admin-only Collapsible sectie met CRUD voor alle match-gebonden kosten (inline edit bedrag, verwijderen, toevoegen)
4. **Referee null mapping** — Lege referee string wordt als `null` naar DB gestuurd
