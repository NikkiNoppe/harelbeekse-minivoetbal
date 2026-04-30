# Audit /admin/scheidsrechters

Een kritische, end-to-end review van de admin-pagina voor scheidsrechtersbeheer. Bevindingen zijn gerangschikt op impact: eerst de leesbaarheidsproblemen die je expliciet aanhaalde, dan UX-pijnpunten, dan design-system-consistentie, dan kleinere polish.

---

## A. Leesbaarheid & contrast (HOOG — direct fixen)

### A1. Onzichtbare borders door token-conflict
- In `tailwind.config.ts` is `border: 'transparent'`.
- In `src/index.css` is `--border: 0 0 0 0`.
- Resultaat: élke `border-border`/`border` class in de matrix, kaarten, legend, workload-balk, sticky headers en zebra-rijen produceert een **onzichtbare** rand. Dat is dé reden waarom je matrix "vlak" oogt en celgrenzen wegvallen.
- **Plekken die hierdoor lijden:** `AvailabilityMatrix` (sticky headers, cellen, mobile-buttons), `AssignmentManagement` stat-cards, `WorkflowBanner`, `RefereeStatsSection`, legend-balk.
- **Fix-plan:** in deze view consistent een lokale rand-class gebruiken die naar `--color-200` / `--color-300` verwijst, of in `index.css` een echte hairline-token introduceren (`--hairline: var(--color-200)`) en die op de relevante elementen toepassen. We vervangen `border-border` op deze pagina door `border-[hsl(var(--hairline))]` of een Tailwind utility `border-hairline` die we in `tailwind.config.ts` toevoegen.

### A2. Zwarte tekst in plaats van token-tekst
- `Card` heeft een hardcoded `style={{ backgroundColor: 'white' }}` + `text-card-foreground`. `--card-foreground` resolved naar `var(--color-600)` (donker paars) — dat is OK qua contrast.
- Maar in de matrix gebruiken we `text-foreground` op cellen die op `bg-card` of `bg-muted/20` staan. `--foreground` is gedefinieerd als `var(--color-600)` — eveneens een **kleur-token (paars)**, geen `hsl()`-tuple. Tailwind injecteert dat als `hsl(var(--foreground))`, wat een **ongeldige CSS-waarde** is en in veel browsers terugvalt op zwart.
- Resultaat: de rij-titels "Sessie", scheidsrechter-namen, sessie-team-namen renderen als **zwart** in plaats van het paarse merk-tint. Dat verklaart wat je ziet.
- **Fix-plan:** in deze view tekst expliciet stylen via `text-[hsl(var(--color-700))]` voor body en `text-[hsl(var(--color-600))]` voor headings, of een page-scoped CSS-class `.scheids-text` die `color: var(--color-700)` zet. Op iconen `text-primary` gebruiken zoals reeds.

### A3. Wit-op-licht-success in mobiele pill
- `AvailabilityMatrix` mobile: `bg-success text-white` — `--color-success: #22c55e`. Wit op `#22c55e` haalt **net niet** AA voor body-tekst (≈3.0:1). In de Workflow-banner wordt `bg-warning` met `text-warning` (oranje op licht oranje) gebruikt → contrast onleesbaar.
- **Fix-plan:** voor pills `text-success-foreground` (= wit) is OK alleen op grotere/bold tekst. Voor body labels: `bg-success/15 text-success-dark` met een donkergroene token. Voor de warning-alert bekijken: `border-warning bg-warning/10 text-foreground` ipv `text-warning`.

### A4. PollsTable badges: "🟠 Verwerking" en "✅ Voltooid"
- `bg-primary/20 text-primary` op de "Voltooid"-badge: paars-op-paars geeft minimaal contrast.
- **Fix-plan:** vervangen door `bg-success/15 text-success-dark` of expliciete `text-foreground`.

### A5. Workload-heatmap: tekst onleesbaar bij hoge intensiteit
- `backgroundColor: hsl(var(--primary) / 0.30)` met `text-foreground` (= broken token, valt op zwart) — bij donkere paarse achtergrond is zwart oké, maar `text-muted-foreground` voor het cijfer is **te licht**.
- **Fix-plan:** vaste donkere tekstkleur (`color-700`) en lichtere span met betere contrast, of badges met semantisch licht/zwaar verschil (groen → oranje → rood gradient ipv pure primary-tint).

### A6. Suggereer-knop counter-tekst
- `text-[10px] text-muted-foreground` voor "X× deze maand" is te klein én te licht. Onleesbaar op niet-retina.
- **Fix-plan:** minimaal `text-xs` + `text-foreground/70` (na A2-fix).

---

## B. UX-pijnpunten (MIDDEL — actiegericht)

### B1. Drie maand-selectors die onafhankelijk werken
Op één pagina staan momenteel:
1. WorkflowBanner: leest *meest recente actieve poll* — geen selector.
2. AssignmentWorkspace toolbar: maand-selector voor matrix.
3. PollManagement: aparte selector voor auto-genereer-dropdown.
4. AssignmentManagement (lijst-mode): heeft eigen interne selector → die in `AssignmentWorkspace` verborgen is in matrix-mode maar in lijst-mode toont de child zijn eigen.
- Resultaat: je wijzigt boven de maand, maar Lijst-mode toont een andere — verwarrend.
- **Fix:** één globale `selectedMonth` op `ScheidsrechtersPage`-niveau, doorgeven aan álle kinderen (banner, matrix, lijst, poll-dropdown).

### B2. Banner toont alleen "actieve poll" — geen maand-keuze
Als je in september bent en wilt voorbereiden voor oktober, toont de banner nog de september-poll. Geen knop "Plan volgende maand".
- **Fix:** banner reageert op de globale maand-selector. Toont voor die maand: "geen poll → maak aan", "open → toon stats", "gesloten → toewijzen".

### B3. Workflow heeft geen duidelijke 4-stappen-flow
Admin moet weten: (1) Poll aanmaken / auto-genereren, (2) Wachten op antwoorden, (3) Toewijzen (auto+manual), (4) Bevestiging. Nu zit dat verspreid over banner + 2 tabs + auto-knop.
- **Fix:** een **Stepper** bovenaan met 4 stappen + status (✓/in-progress/locked) en deeplinks naar de juiste sectie.

### B4. Auto-genereer geeft geen preview
Klik je op "Auto-genereer → April 2026" dan gebeurt het direct, zonder te tonen welke groepen worden aangemaakt of welke al bestaan.
- **Fix:** dropdown vervangen door een modal die eerst groepen toont met checkboxes ("3 nieuwe groepen, 1 bestaat al") en pas op confirmatie aanmaakt.

### B5. Matrix mist filter "Verberg refs zonder reactie"
Bij 12+ scheidsrechters waarvan er 4 nog niet reageerden, krijg je een zee aan dashes. Geen filter beschikbaar.
- **Fix:** toggle "Toon alleen wie reageerde" + zoekvak voor refnamen.

### B6. Toewijzen-cel klikbaar zonder bevestiging
Klik op een groene cel → directe assign, snelle muis-slip kost je een fout. Undo-toast verzacht het, maar 5s is kort.
- **Fix:** of confirm-popover bij klik, of undo-toast 10s en duidelijker call-to-action.

### B7. Geen bulk-undo na auto-toewijzen
"Auto-toewijzen" maakt N toewijzingen aan zonder verzamel-undo. Eén undo per assignment zou een reeks toasts geven.
- **Fix:** één gegroepeerde toast "5 toewijzingen aangemaakt — Alles ongedaan maken" die alle nieuwe assignments terugdraait.

### B8. Geen export / printview
Admin kan toewijzingen niet eenvoudig delen met zaalbeheerders.
- **Fix:** "Export PDF/ICS" knop in workspace-toolbar (we hebben al `icalUtils`).

### B9. Geen audit-trail / history
Wie wees toe, wanneer? Er is een `assigned_by` kolom maar geen UI om het te zien.
- **Fix:** in de cel-tooltip "Toegewezen door X op Y", en optioneel een log-modal.

### B10. Scheidsrechter-side: poll opent niet rechtstreeks vanuit notificatie
Geen indicator hoeveel groepen nog niet zijn aangevinkt. `RefereeStatsSection` toont assignments-stats maar niet "je moet nog 3 groepen invullen".
- **Fix:** extra stat-tegel "Nog te beantwoorden" bovenop assignments.

---

## C. Code- & design-systeem-consistentie (LAAG-MIDDEL)

### C1. Twee parallelle assign-services
`AssignmentCard` gebruikt `assignRefereeToSession`, terwijl `AvailabilityMatrix` `assignReferee` met handmatige loop gebruikt. Subtiel afwijkend gedrag (cascade naar zelfde sessie).
- **Fix:** beide via `assignRefereeToSession` laten lopen.

### C2. `referee_assignments as any` casts
Op meerdere plekken `(supabase.from('referee_assignments' as any) ...)` — types ontbreken in `supabase/types.ts`.
- **Fix:** types regenereren of een handgeschreven interface en helper exporteren.

### C3. Inconsistente tab-iconen / labels
Tab "Toewijzen" gebruikt `UserCheck`, banner gebruikt soms `Users`, soms `CheckCircle2`. Geen vaste iconenset per concept.
- **Fix:** mini-style-guide in commentaar bovenin de page.

### C4. Geen skeletons in matrix-toolbar / WorkflowBanner toont skeleton zonder maand-selector vorm
- **Fix:** consistent skeleton-systeem (al aanwezig, maar inconsistent toegepast).

### C5. Mobile matrix verbergt refs zonder beschikbaarheid altijd
Op mobiel toont `AvailabilityMatrix` enkel pills van available/assigned refs, met fallback "Geen beschikbaarheid". Maar geen mogelijkheid om alsnog handmatig iemand toe te wijzen die níét beschikbaar zei te zijn.
- **Fix:** "Toon alle scheidsrechters" expand-knop op mobiel.

### C6. Geen empty-state illustratie
"Geen wedstrijden gevonden voor deze maand" is droog. Niet-admins begrijpen niet altijd waarom.
- **Fix:** uitleg + CTA "Plan wedstrijden via /admin/wedstrijden".

---

## D. A11y & micro-UX (LAAG)

- Sticky table-headers hebben `bg-muted` maar door A1 geen onderkant-rand → ze "kleven" zonder visuele scheiding bij scroll.
- Cellen met `role="button"` hebben geen `aria-pressed` voor de toegewezen-state.
- Tooltip-content bevat vrij lange zinnen — overweeg primair label + dim secundair.
- Iconen-only knoppen (Refresh) hebben title maar geen `aria-label` consistent.
- Focus-ring is gedefinieerd maar de matrix-cellen hebben `outline-none` impliciet.

---

## E. Voorgestelde implementatie-fases

```text
Fase 1 — Leesbaarheid & contrast (A-blok)
  ├─ Voeg utility `.border-hairline` toe (tailwind config of index.css)
  ├─ Vervang border-border in scheids-pagina door border-hairline
  ├─ Fix text-foreground → expliciete color-700/600 tokens
  ├─ Workload-heatmap: contrast-veilige cijfers
  ├─ PollsTable badges + Workflow warning-alert kleur
  └─ Mobile success-pill: text-success-dark variant

Fase 2 — Eén globale maand + Stepper (B1, B2, B3)
  ├─ Lift selectedMonth naar ScheidsrechtersPage
  ├─ Banner + Matrix + Lijst + PollManagement consumeren
  └─ 4-stappen Stepper-component bovenaan

Fase 3 — Slimmere acties (B4, B6, B7, B8)
  ├─ Auto-genereer-modal met preview
  ├─ Bulk-undo toast voor auto-assign
  ├─ Export-PDF/ICS knop
  └─ Cel-confirm of langere undo-window

Fase 4 — Filter + history + a11y (B5, B9, D)
  ├─ Matrix-filters (alleen-reactie, zoek)
  ├─ Audit-trail in tooltip
  ├─ Aria-pressed, focus-ring, betere semantics
  └─ Mobile expand-toggle

Fase 5 — Code-cleanup (C1, C2, C3)
  ├─ assignRefereeToSession overal
  ├─ Types voor referee_assignments
  └─ Iconenset consistent
```

---

## F. Concreet startpunt

Ik raad aan **Fase 1 nu uit te voeren** want dat lost direct de "zwart/wit-onleesbaar" klacht op én herstelt zichtbaarheid van de matrix. Daarna kan Fase 2 (één globale maand + stepper) — dat is een grondige refactor maar geeft duidelijkheid voor admin.

Wil je dat ik direct met Fase 1 start, of eerst een specifiek subblok (bv. enkel kleuren/tokens, of enkel de stepper)?
