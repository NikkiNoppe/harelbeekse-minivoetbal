

## Analyse: Dirty tracking is correct, maar heeft een bug

### Wat er aan de hand is

De dirty tracking aanpak is **de juiste oplossing** — het is een standaard frontend pattern (React forms gebruiken dit overal). Het vergroot je database niet en voegt geen extra queries toe. Het enige wat het doet is: "stuur alleen data mee die de gebruiker daadwerkelijk heeft gewijzigd."

**Maar er zit een bug in de huidige implementatie waardoor het niet werkt.**

### De bug

In `wedstrijdformulier-modal.tsx` regels 522-558 staan twee "name sync" effecten. Deze draaien automatisch wanneer spelerdata wordt geladen en roepen `setHomeTeamSelections` / `setAwayTeamSelections` aan. Dit zijn de **tracked** setters die `dirty = true` zetten.

```text
Modal opent
  → spelers laden uit DB
  → name sync effect vuurt automatisch
  → setHomeTeamSelections() aangeroepen
  → homePlayersDirty = true  ← BUG: niemand heeft iets gewijzigd!
  → spelers worden ALTIJD meegestuurd (zelfde als zonder dirty tracking)
```

Resultaat: de dirty tracking heeft **geen effect** — het gedrag is identiek aan vóór de fix.

### De fix: 6 regels code

Exporteer `suppressDirtyRef` uit `useMatchFormState` (al aanwezig, maar niet geëxporteerd) en wrap de name sync effecten ermee:

**`useMatchFormState.ts`** — voeg `suppressDirtyRef` toe aan return object

**`wedstrijdformulier-modal.tsx`** — wrap de twee name sync effecten:
```typescript
// Regel 522-538 (home) en 541-558 (away):
suppressDirtyRef.current = true;
setHomeTeamSelections(prev => prev.map(...));
suppressDirtyRef.current = false;
```

### Waarom dit efficiënt is

- Geen database wijzigingen
- Geen extra queries
- Geen extra state of complexity
- Het `update_match_with_context` RPC ondersteunt dit al: `CASE WHEN p_update_data ? 'home_players'` — als de key niet in de JSON zit, wordt die kolom niet aangeraakt
- Team manager wijzigt spelers → dirty=true → data gaat mee ✅
- Referee wijzigt alleen scores → dirty=false → spelers worden niet aangeraakt ✅

### Bestanden
1. `src/components/pages/admin/matches/hooks/useMatchFormState.ts` — exporteer `suppressDirtyRef`
2. `src/components/modals/matches/wedstrijdformulier-modal.tsx` — wrap name sync effecten met suppress

