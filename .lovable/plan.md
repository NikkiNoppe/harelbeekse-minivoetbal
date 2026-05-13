# Plan: Financieel-sectie opschonen + bug "Boete toevoegen" oplossen

Bestand: `src/components/modals/matches/wedstrijdformulier-modal.tsx` (regio rond regels 391–405 en 1910–2210).

## Deel 1 — UI/UX evaluatie & verbeteringen

### Wat overbodig of verwarrend is vandaag

1. **Dubbele/verbose lege-state tekst (regel 1967–1969)**
   `"Gebruik bovenstaande knoppen. 'Forfait verwittigd' slaat direct op bij een bekende stand (bv. 0–10); anders kies je het team en klik je op Boetes opslaan."`
   → Te lang, herhaalt wat de knoppen al zeggen.
2. **Sub-koppen "Boetes" en "Wedstrijdkosten"** binnen een al gelabelde "Financieel"-collapsible voegen visueel ruis toe maar zijn nuttig als scheiding. Ze blijven, maar styling kan rustiger (geen border-bottom als er direct een knoppenrij volgt).
3. **"Forfait actief"-banner (regel 2158–2165)** is correct maar de zin _"Boetes beheer je in het blok hierboven."_ is overbodig — gebruiker ziet het blok hierboven al.
4. **Lege-kosten state (regel 2201–2205)** toont _"Standaardkosten worden automatisch aangemaakt bij indiening."_ óók wanneer forfait actief is. Dat is misleidend: bij forfait worden ze juist NIET aangemaakt. Deze placeholder moet verborgen worden als `hasForfaitPenalty === true` (de blauwe banner is dan voldoende).
5. **Opgeslagen boete-rij**: "Gildeg Genoeg" + "Forfait verwittigd" + "€25" staat nu op 2 regels met een 44px icoon-tegel. Kan compacter (1 regel op desktop, badge inline).
6. **Knoppenrij**: "Boete toevoegen" en "Forfait verwittigd (€25)" hebben beide `flex-1` → op desktop worden ze even breed. Primaire actie hoort visueel dominant; "Forfait verwittigd" is een snelkoppeling, mag smaller (`sm:flex-none`).

### Concrete tekst-/layoutwijzigingen

| Plek | Huidig | Voorstel |
|---|---|---|
| Lege state boetes | Lange uitleg | _"Nog geen boetes. Gebruik de knoppen hierboven."_ |
| Forfait-banner | 2 zinnen | _"Forfait actief — standaard wedstrijdkosten vervallen voor deze wedstrijd."_ |
| Lege kosten (zonder forfait) | 2 regels | _"Nog geen kosten. Worden automatisch aangemaakt bij indiening."_ (1 regel) |
| Lege kosten (met forfait) | toon placeholder | **niet tonen** — banner dekt de lading |
| Knoppenrij desktop | 50/50 split | Primair full-flex, snelkoppeling auto-breed |

Geen wijzigingen aan business-logica, queries of services.

## Deel 2 — Bug "Boete toevoegen klapt niet correct uit"

### Verwacht gedrag
Klik op "Boete toevoegen" → Financieel-collapsible opent (indien dicht) + er verschijnt een blok "Nieuwe boetes" met één lege rij (Team-select + Type Boete-select) tussen de knoppenrij en het "Opgeslagen boetes"-blok.

### Code-pad (regel 391–405)
```ts
const addPenalty = useCallback(() => {
  flushSync(() => {
    setIsFinancieelOpen(true);
    setPenalties(prev => {
      const validPenalties = prev.filter(p => p.teamId && p.costSettingId);
      return [...validPenalties, { costSettingId: null, teamId: null }];
    });
  });
}, []);
```

### Hypotheses (in volgorde van waarschijnlijkheid)

1. **`flushSync` in een React-event-handler binnen een Radix `CollapsibleTrigger`** — Radix wikkelt de trigger met `asChild` rond `CardHeader`. `flushSync` mag niet aangeroepen worden tijdens een lopende render-fase; in DEV geeft dat soms een warning + state-update wordt gemist. Het renderpad van Radix kan triggeren dat de eerste klik enkel de collapsible toggelt en de `setPenalties`-update verloren gaat.
2. **CSS-overflow op de Card**: `Card` heeft `overflow-hidden`. Het nieuwe rijtje renderen mét `Select`-dropdowns binnen een `overflow-hidden` parent kan ervoor zorgen dat de eerste keer een layout-shift "klein" lijkt (rij verschijnt achter de bestaande "Opgeslagen boetes"-divider zonder visuele cue).
3. **Geen scroll-into-view**: het nieuwe rijtje wordt onder de knoppenrij ingevoegd, maar als de modal-scrollpositie laag staat (gebruiker scrollt naar Financieel onderaan) blijft de nieuwe rij buiten het viewport en lijkt het "niet uitgeklapt".
4. **`canEdit` flikkert**: na opslaan van forfait wordt `match.isLocked` mogelijk waar (auto-lock) → `isAddPenaltyButtonDisabled` wordt true → klik registreert maar handler wordt niet uitgevoerd. Verklaart "klapt niet correct uit".

### Onderzoekstap (vóór elke fix)
- Console-log toevoegen in `addPenalty` om te zien of de handler überhaupt vuurt en wat `penalties.length` is direct erna.
- React-DevTools: state `penalties` inspecteren na klik.
- Visueel: scroll naar de Financieel-sectie en klik nogmaals.

### Voorgestelde fix (na bevestiging hypothese 1+3)

```ts
const addPenalty = useCallback(() => {
  setIsFinancieelOpen(true);
  setPenalties(prev => {
    const valid = prev.filter(p => p.teamId && p.costSettingId);
    return [...valid, { costSettingId: null, teamId: null }];
  });
  // Scroll de nieuwe rij in beeld op de volgende frame
  requestAnimationFrame(() => {
    document.getElementById('penalties-new-list')?.scrollIntoView({
      behavior: 'smooth', block: 'center'
    });
  });
}, []);
```

- `flushSync` weghalen (niet nodig — React batcht state-updates al, Collapsible re-rendert prima).
- `id="penalties-new-list"` op de wrapper rond de "Nieuwe boetes"-lijst zetten.
- Visuele cue: korte `animate-in slide-in-from-top-1 fade-in duration-200` op de nieuwe rij.

## Stappen

1. UI/UX-tekstwijzigingen + knoplayout aanpassen (Deel 1).
2. `addPenalty` herschrijven zonder `flushSync` + scroll-into-view + animatie (Deel 2).
3. Lege-kosten-placeholder verbergen wanneer `hasForfaitPenalty` true is.
4. Visueel verifiëren in preview op /admin/match-forms/playoffs voor de wedstrijd Gildeg Genoeg vs MVC Timeless.

## Out of scope
- Database, RPC's, edge functions, financial services — niet aanraken.
- Layout van andere collapsible-secties.
