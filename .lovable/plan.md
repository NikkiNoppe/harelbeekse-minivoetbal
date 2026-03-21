

## Twee kleine UI-aanpassingen in het wedstrijdformulier (read-only modus)

### Wat verandert

1. **`#` weghalen bij rugnummers** — in read-only weergave tonen we het rugnummer zonder `#` prefix (bv. `4` i.p.v. `#4`)
2. **`(K)` badge weghalen bij spelernaam** — de kapitein staat al onderaan vermeld, dus de inline badge is overbodig

### Bestanden & locaties

**`src/components/modals/matches/wedstrijdformulier-modal.tsx`** — 4 kleine wijzigingen:

| Regel | Wat | Wijziging |
|-------|-----|-----------|
| 1243-1245 | Desktop: `(K)` badge bij spelernaam | Verwijderen |
| 1265 | Desktop: `#{selection.jerseyNumber}` | → `{selection.jerseyNumber}` |
| 1403-1405 | Mobiel: `(K)` badge bij spelernaam | Verwijderen |
| 1423 | Mobiel: `` `#${selection.jerseyNumber}` `` | → `selection.jerseyNumber` |

Geen andere bestanden, dependencies of logica-wijzigingen nodig.

