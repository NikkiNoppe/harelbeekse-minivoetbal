## Analyse: /admin/scheidsrechters

### Wat er nu gebeurt

De pagina is **2-in-1**: admins zien een tabbed admin-interface, scheidsrechters zien een dashboard. Onder admin zijn er drie tabs:

1. **Overzicht (AvailabilityMatrix)** – Sessies × scheidsrechters matrix met klik-om-toe-te-wijzen
2. **Toewijzingen (AssignmentManagement)** – Cards per speeldag met dropdown selectie
3. **Polls (PollManagement)** – CRUD op maandelijkse polls

De scheidsrechter-zijde toont:
- Beschikbaarheidspoll (checkboxes per datum)
- Toegewezen wedstrijden (bevestig/weiger)

### Pijnpunten die ik vond

**Admin-zijde**
1. **Versnipperde workflow**: Polls aanmaken (tab 3) → wachten op respons → toewijzen (tab 1 of 2). Twee tabs (Overzicht + Toewijzingen) doen overlappende dingen zonder duidelijke rolverdeling. De gebruiker weet niet welke tab waarvoor te gebruiken.
2. **Leesbaarheid matrix**: Namen worden afgekapt tot "Jan V." zonder hover-tooltip die werkt op touch. Cellen zijn klein (80px), weinig lucht. Geen sticky header op scroll. Op smalle desktop (<1280px) is de matrix bijna onleesbaar bij >6 scheidsrechters.
3. **Geen "next-step" sturing**: Nergens een statusbar die zegt "Poll loopt — 3/8 scheidsrechters hebben gereageerd — deadline over 2 dagen — 5 wedstrijden nog niet toegewezen." Admin moet zelf afleiden wat te doen.
4. **Stats Cards in tab 2** zijn statisch; geen klik om te filteren. "Poll respons" en "Wedstrijden" zijn redundant met de matrix.
5. **Verwijderen poll** is zelfs niet geïmplementeerd (`toast.info('nog niet geïmplementeerd')`).
6. **CreatePoll modal** is technisch maar niet gebruiksvriendelijk: admin moet handmatig data, locatie, tijdslot per match-datum invullen — terwijl die info al in `matches` staat. De `generate-monthly-polls` edge function bestaat al maar wordt niet gebruikt vanuit de UI.
7. **Geen bulk-acties**: niet "open alle drafts", niet "stuur reminder aan niet-respons", niet "auto-toewijzen op basis van beschikbaarheid + spreiding".
8. **Stats per scheidsrechter** onderaan tab 2 is een platte rij badges — geen sortering, geen historiek, geen workload-spreiding.
9. **Empty states** zijn schraal (📋-emoji + één regel). Geen call-to-action.
10. **Iconografie inconsistent**: ✅/🟢/⚪ emoji in PollsTable status badges naast lucide-icons elders.

**Scheidsrechter-zijde**
11. **Poll-keuze is binary** (beschikbaar ja/nee) zonder "voorkeur" of "alleen Harelbeke" of "niet na 21u". Realiteit is genuanceerder.
12. **Geen context bij datum**: scheidsrechter ziet "vrijdag 17 mei – 20:00 – Harelbeke – 4 wedstrijden" maar niet welke teams er spelen of wie er nog meer beschikbaar is.
13. **Geen historie**: geen overzicht van eerdere maanden, geen totaal aantal toewijzingen dit seizoen, geen kaart-conflicten ("je fluit team X waar je broer in zit").
14. **Toegewezen wedstrijden** tonen geen tegenstander-namen op de samenvatting; pas in de card-detail.
15. **Geen "ik kan inspringen" knop** bij andere wedstrijden waar nog geen ref is toegewezen.

**Cross-cutting**
16. **Geen audit-trail**: wie heeft wanneer toegewezen / verwijderd? Geen log zichtbaar.
17. **Notificaties ontbreken**: scheidsrechter krijgt geen melding bij nieuwe toewijzing (uit code te leiden — geen reference naar `notificationService` in deze flow).
18. **Mobile admin-matrix**: de mobiele card-fallback werkt, maar bij 8+ scheidsrechters is de chip-rij te lang. Geen filter op "alleen beschikbare".

---

## Voorstel: gefaseerde verbetering

### Fase 1 — Admin-workflow consolideren (hoogste impact)

**1.1 Vervang 3 tabs door 1 dashboard + 1 archief**

```text
┌─ Scheidsrechter Beheer ────────────────────────────────────┐
│                                                              │
│  [WorkflowBanner: actieve poll status]                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📅 Mei 2026 — Open · Deadline over 2d 4u               │ │
│  │ 👥 5/8 scheidsrechters reageerden  · ⚠ 7/12 toegewezen │ │
│  │ [Open poll-detail]  [Reminder sturen]  [Sluit poll]    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Tabs: Toewijzen │ Polls archief]                          │
│                                                              │
│  ───── Toewijzen tab (default) ─────                        │
│  [Maand selector] [Filter chips: Open · Toegewezen · Alle] │
│  [Toggle: Matrix-view ↔ Lijst-view]                         │
│                                                              │
│  → Per speeldag groep: matrix-strook + auto-suggest knop   │
└──────────────────────────────────────────────────────────────┘
```

De huidige `AvailabilityMatrix` en `AssignmentManagement` worden gefuseerd tot één **Toewijzen**-view met twee weergavemodi (toggle): de matrix voor power-users, de lijst voor stap-voor-stap.

**1.2 Workflow-banner bovenaan**

Eén component dat altijd zegt wat de volgende actie is:
- Geen actieve poll → "Maak poll voor [volgende maand]" (knop genereert via `generate-monthly-polls` edge function automatisch op basis van bestaande matches)
- Poll open, deadline >24u → "Wacht op respons (X/Y reageerden)"
- Poll open, deadline <24u → "⚠ Stuur reminder" (nieuwe edge function of e-mail)
- Poll gesloten, niet alle wedstrijden toegewezen → "Wijs N wedstrijden toe"
- Alles toegewezen → "✅ Klaar voor [maand]"

**1.3 Auto-suggest toewijzing per sessie**

Nieuwe knop "Suggereer" per speeldag-groep die:
- Beschikbare scheidsrechters filtert
- Sorteert op: minste toewijzingen deze maand → minste dit seizoen → alfabetisch
- Eén klik = top-suggestie toepassen, met undo-toast

### Fase 2 — Leesbaarheid van de matrix

**2.1 Matrix herontwerp**
- Bredere kolommen (min-w 100px), volledige naam i.p.v. afgekorte
- **Sticky header bij verticaal scrollen** (h-thead positie sticky top-0)
- Gestreepte rijen (zebra) en sterkere session-row contrast
- Status per cel met heldere kleurcodering:
  - ⬜ leeg: niet gereageerd
  - ✓ groen-licht: beschikbaar
  - ✗ grijs: niet beschikbaar
  - 🎯 vol-groen + ster: toegewezen
  - 🔒 lichtgrijs: andere ref toegewezen (niet meer klikbaar)
- Tooltip op desktop, longpress-popover op mobile

**2.2 Mobile alternatief: per-sessie-flow**
Op mobile: niet meer alle scheidsrechters als chips, maar:
1. Card per sessie
2. Klik → opent sheet met gefilterde lijst (default: alleen beschikbare)
3. Tap = toewijzen, swipe = verwijderen

### Fase 3 — Slimmer poll-aanmaken

**3.1 Auto-generate uit matches**
Standaard knop "Auto-genereer voor [maand]" die de bestaande edge function aanroept en alle wedstrijden van die maand cluster naar `poll_match_dates` (date+location). Manuele toevoegingen blijven mogelijk maar zijn de uitzondering.

**3.2 Default deadline**
Bij maandkeuze: deadline = laatste vrijdag voor de eerste wedstrijd, niet "vandaag + 3 dagen".

**3.3 Implementeer `deletePoll`**
Toevoegen in `pollService` met cascade-check op `referee_availability` en `poll_match_dates`. Confirm-modal met gevolgen.

### Fase 4 — Betere scheidsrechter-ervaring

**4.1 Rijkere poll-card per datum**
- Toon teams die spelen ("KRC vs FC X · 19:00", "Team Y vs Team Z · 20:00")
- Toon "andere refs die ja zeiden: 2" (sociaal bewijs zonder namen vrij te geven aan iedereen — alleen aantallen)
- Optionele notitie-veld per datum ("liever niet de eerste wedstrijd")

**4.2 Persoonlijke statistieken-strook**
Bovenaan dashboard:
```text
Mei: 3 toegewezen · Seizoen: 14 · Bevestigd: 12 · Geweigerd: 2
```

**4.3 "Beschikbaar maar niet toegewezen"-sectie**
Sessies waarvoor de scheidsrechter beschikbaar was maar niet toegewezen werd, met link "Ik kan alsnog inspringen" wanneer er nog open plekken zijn.

### Fase 5 — UX-polish (cross-cutting)

- Vervang emoji-status-badges door consistente lucide-iconen + kleurtokens
- Skeletons matchen exacte layout (geen rechthoek-soep)
- Empty states met illustratie + primaire actie ("Maak je eerste poll")
- Toasts: success-toast bij toewijzen toont undo-actie (5s)
- Audit-log table (nieuw): `referee_assignment_audit` — wie/wat/wanneer; admin kan via tooltip "ℹ" zien wie laatst wijzigde
- Notification op nieuwe toewijzing via bestaande `notificationService` — scheidsrechter krijgt bell-icon update

### Wat niet verandert (om scope te bewaken)
- Database-schema's (alleen optionele audit-tabel als losse fase)
- RLS policies
- Bestaande `pollService`/`assignmentService` API-contracten — alleen toevoegingen
- Edge functions bestaan al; we voegen alleen UI-aanroepen toe

---

## Vraag aan jou

Dit plan dekt veel grond. Ik raad aan in **deze volgorde** te bouwen, telkens in een aparte oplevering:

1. **Fase 1.1 + 1.2** (workflow-banner + tab-fusie) — geeft direct een veel duidelijkere admin-flow
2. **Fase 2** (matrix-leesbaarheid)
3. **Fase 3** (auto-generate poll + deadline default + delete)
4. **Fase 1.3** (auto-suggest)
5. **Fase 4** (scheidsrechter-zijde)
6. **Fase 5** (polish + audit + notifications)

Wil je dat ik **start met Fase 1+2** (admin-workflow + matrix-leesbaarheid) als eerste concrete oplevering, of liever een andere fase eerst? Of moeten we bepaalde fases combineren / weglaten?
