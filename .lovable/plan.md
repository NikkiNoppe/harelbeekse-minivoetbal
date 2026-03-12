

## Wedstrijdformulier Instellingen - Settings Dashboard

### Samenvatting
Een nieuw instellingenpaneel onder `/admin/settings` waarmee de admin het vergrendelings- en boetesysteem voor wedstrijdformulieren configureert. De huidige hardcoded 5-minutenregel wordt vervangen door configureerbare waarden uit `application_settings`.

### Wat wordt gebouwd

**1. Nieuw accordion-item "Wedstrijdformulieren"** in SettingsPanel met:

- **Tijdslimiet instellen**: Een numeriek invoerveld (standaard 5 min) dat bepaalt hoeveel minuten voor aanvang het formulier automatisch sluit voor team managers.

- **"Te laat invullen" modus (checkbox/switch)**:
  - Indien aangevinkt: team managers mogen het formulier **nog invullen** nadat de tijdslimiet verstreken is, maar:
    - Er verschijnt een duidelijke waarschuwing ("Dit formulier is te laat. Bij opslaan wordt automatisch een boete aangerekend.")
    - Bij opslaan wordt automatisch een boete-transactie aangemaakt in `team_costs`
    - Er wordt een standaard notitie in `referee_notes` geplaatst (bijv. "⚠️ BOETE: Wedstrijdblad te laat ingevuld")
  - Indien uitgevinkt: formulier is hard gesloten na tijdslimiet (huidig gedrag)

- **Boetebedrag**: Configureerbaar bedrag (standaard €5,00)

- **Definitieve afsluiting**: Informatieve tekst dat na het invullen van scores het formulier onherroepelijk gesloten is voor team managers en scheidsrechters. Dit is bestaand gedrag, wordt alleen visueel bevestigd.

```text
┌─ Wedstrijdformulieren ──────────────────────┐
│                                              │
│  Automatische vergrendeling                  │
│  ┌──────────────────────────────────────┐    │
│  │ Sluit formulier [5] minuten voor     │    │
│  │ aanvang wedstrijd                    │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ☐ Sta te laat invullen toe (met boete)      │
│    └─ Boetebedrag: € [5.00]                 │
│    └─ Team managers zien een waarschuwing    │
│       en krijgen automatisch een boete       │
│                                              │
│  ℹ️ Na invullen van scores is het formulier  │
│     onherroepelijk afgesloten.               │
│                                              │
│  [Opslaan]                                   │
└──────────────────────────────────────────────┘
```

### Technische aanpak

**Database**: Nieuwe rij in `application_settings`:
- `setting_category`: `'match_form_settings'`
- `setting_name`: `'lock_rules'`
- `setting_value` (jsonb):
  ```json
  {
    "lock_minutes_before": 5,
    "allow_late_submission": false,
    "late_penalty_amount": 5.00,
    "late_penalty_note": "⚠️ BOETE: Wedstrijdblad te laat ingevuld"
  }
  ```
- Nieuwe RLS SELECT policy voor publieke leestoegang (alle rollen moeten de lock-regels kennen)

**Bestanden te wijzigen/maken**:

1. **`src/components/pages/admin/settings/components/MatchFormSettings.tsx`** (nieuw)
   - Settings component, zelfde patroon als `PlayerListLockSettings.tsx`
   - Laadt/schrijft naar `application_settings` met category `match_form_settings`

2. **`src/components/pages/admin/settings/components/SettingsPanel.tsx`**
   - Voeg nieuw accordion-item toe met `FileText` icon en label "Wedstrijdformulieren"

3. **`src/lib/matchLockUtils.ts`**
   - `shouldAutoLockMatch` krijgt optionele `lockMinutes` parameter (default 5)
   - Nieuwe functie `shouldAllowLateSubmission` die checkt of late modus actief is

4. **`src/hooks/useMatchFormSettings.ts`** (nieuw)
   - React Query hook om match form settings op te halen uit `application_settings`
   - Cached, wordt gebruikt door zowel admin settings als match formulieren

5. **`src/services/match/enhancedMatchService.ts`**
   - Huidige hardcoded 5-minuten en 15-minuten logica vervangen door DB-waarden
   - Late submission penalty bedrag uit settings halen i.p.v. hardcoded €5.00

6. **`src/components/pages/admin/matches/MatchesFormList.tsx`** + **`src/components/pages/user/UserProfilePage.tsx`**
   - Gebruik configureerbare `lockMinutes` uit hook i.p.v. hardcoded 5 min
   - Bij "late submission allowed": toon status "Te laat" i.p.v. "Gesloten"

7. **Wedstrijdformulier modal** (`wedstrijdformulier-modal.tsx`)
   - Indien `allow_late_submission` actief en match voorbij tijdslimiet: toon waarschuwingsbanner
   - Bij opslaan: automatisch boete + notitie toevoegen

