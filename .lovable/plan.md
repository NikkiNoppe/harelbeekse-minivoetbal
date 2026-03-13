

## Schorsingsregels toevoegen aan Settings

### Situatie
Het component `SuspensionRulesSettings.tsx` bestaat al met volledige functionaliteit:
- Dynamische gele kaart regels (van X tot Y kaarten → Z wedstrijden schorsing)
- Rode kaart standaard/maximum schorsing
- Reset regels
- Toevoegen/verwijderen van regels
- Opslaan naar `application_settings` (category `suspension_rules`)

Het enige wat ontbreekt is de registratie in `SettingsPanel.tsx`.

### Wijziging

**`src/components/pages/admin/settings/components/SettingsPanel.tsx`**:
- Import `SuspensionRulesSettings`
- Voeg nieuw accordion-item toe met `AlertTriangle` of `ShieldAlert` icon en label "Kaarten & Schorsingen"
- Plaatsen na "Wedstrijdformulieren"

Dat is alles — 1 bestand, 3 regels wijziging.

