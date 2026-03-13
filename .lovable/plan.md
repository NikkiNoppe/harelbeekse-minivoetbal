

## Schorsingsregels aanpassen: nieuw model

### Gewenst gedrag

**Gele kaarten** -- exacte drempels (niet ranges):
- 2 gele kaarten → 1 wedstrijd schorsing
- 4 gele kaarten → 2 wedstrijden schorsing  
- 6 gele kaarten → 2 wedstrijden schorsing
- Dynamisch toevoegbaar (admin kan drempels toevoegen/verwijderen)

**Rode kaarten** -- cumulatief:
- 1 rode kaart → 1 wedstrijd (standaard, admin aanpasbaar)
- 2 rode kaarten → 2 wedstrijden
- Etc.

**Reset regels**:
- Verwijder "reset na X wedstrijden"
- Behoud alleen "reset aan einde seizoen"

### Wijzigingen

#### 1. Data model aanpassen (`suspensionRulesService.ts`)

Het `YellowCardRule` type wordt vereenvoudigd: weg met `min_cards`/`max_cards` range, vervangen door een enkel `card_count` veld.

```
interface YellowCardRule {
  card_count: number;        // was min_cards/max_cards
  suspension_matches: number;
}
```

`ResetRules` verliest `reset_yellow_cards_after_matches`, houdt alleen `reset_at_season_end`.

Default rules worden:
```
yellow_card_rules: [
  { card_count: 2, suspension_matches: 1 },
  { card_count: 4, suspension_matches: 2 },
  { card_count: 6, suspension_matches: 2 }
]
```

`findSuspensionMatches()` wordt aangepast: zoekt exact match op `card_count` in plaats van range check. Backwards compatible: als oude data met `min_cards`/`max_cards` binnenkomt, wordt dat geconverteerd.

#### 2. UI aanpassen (`SuspensionRulesSettings.tsx`)

**Gele kaarten sectie**: Per regel wordt getoond:
```
[X] gele kaarten: schorsing [Y] wedstrijd(en)  [🗑]
```
Twee inputvelden per regel: card_count en suspension_matches.

**Rode kaarten sectie**: Ongewijzigd (standaard + max + admin toggle).

**Reset regels sectie**: Verwijder het "reset na X wedstrijden" inputveld. Alleen de switch "Reset aan einde van seizoen" blijft.

#### 3. Suspension berekening (`suspensionService.ts`)

In `getActiveSuspensions()` (regel 455-487): de check `player.yellowCards >= rule.min_cards && player.yellowCards <= rule.max_cards` wordt vervangen door exacte match: `player.yellowCards === rule.card_count`. Backwards compatible met oude ranges via fallback.

### Bestanden

1. **`src/domains/cards-suspensions/services/suspensionRulesService.ts`** -- type wijzigen, defaults updaten, `findSuspensionMatches` aanpassen, backwards compat
2. **`src/components/pages/admin/settings/components/SuspensionRulesSettings.tsx`** -- UI vereenvoudigen (1 veld i.p.v. 2 voor gele kaarten), reset sectie trimmen
3. **`src/domains/cards-suspensions/services/suspensionService.ts`** -- `getActiveSuspensions` aanpassen voor nieuw `card_count` model

