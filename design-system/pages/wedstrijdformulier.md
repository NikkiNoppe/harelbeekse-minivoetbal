# Wedstrijdformulier — page override

> Rol-first layout voor `WedstrijdformulierModal`.  
> Componenten: `src/components/modals/matches/`

## Doel per rol

| Rol | Primaire taak | Secundair |
|-----|---------------|-----------|
| Team manager | Eigen spelers invullen | Tegenstander herkennen (kleuren, contact via score) |
| Scheidsrechter | Score + kaarten + boetes | Spelers controleren |
| Admin | Alles + datum/locatie/speeldag | Financieel |

## Mobiel (`< md`) — tabs

Sticky tabbalk onder modaltitel. Min. `min-h-[44px]` per tab.

Late-submission banner staat **boven** de tabs (altijd zichtbaar).

| Rol | Tabs | Default tab |
|-----|------|-------------|
| Team manager | Spelers · Score | Spelers |
| Scheidsrechter / Admin | Score · Spelers · Overig | Score |

### Tab-inhoud

| Tab | Inhoud |
|-----|--------|
| **Spelers** | Thuis/uit spelerslijsten + aanvoerder |
| **Score** | `MatchFormScoreSection` + **Wedstrijdinfo** (kits, contact via teamnaam) |
| **Overig** | Alleen scheidsrechter/admin: Kaarten · Financieel · Notities |

## Desktop (`md+`) — sectievolgorde

Geen tabs; verticale stack volgens rol. Late-submission banner bovenaan (buiten sectievolgorde).

| Rol | Volgorde |
|-----|----------|
| Team manager | **Spelers** → Score → Gegevens |
| Scheidsrechter | **Score** → Gegevens → Spelers → Wedstrijd |
| Admin | **Score** → Gegevens → Spelers → Wedstrijd |

## Default open (collapsibles)

| Rol | Open bij openen |
|-----|-----------------|
| Team manager | Eigen ploeg-spelers |
| Scheidsrechter | Kaarten |
| Admin | Gegevens |

## Visueel

- Secties: `MatchFormSectionCard` — `border-primary/20 shadow-lg card-hover`
- Score: `MatchFormScoreSection` — kitkolommen + `TeamKitColorBar`; contact via teamnaam-knop
- Modal-body gradient: volledige hoogte (`getSubtleMatchScoreBackground` op `AppModal` body)
- Labels/koppen: `text-[var(--color-700)]` of `text-brand-dark`
- Geen emoji als UI-icoon — Lucide only

## Data

- Kleuren: `fetchPublicTeams` (publiek)
- Contact: `get_match_teams_contact_for_session`
- Spelers: `useTeamPlayersWithSuspensions` + skeleton min. 250ms
- Query: `staleTime: 0`, `placeholderData: keepPreviousData`

## Toegankelijkheid

- Team manager score: read-only tekst + hint scheidsrechter
- Focus bij openen: team manager → eerste speler-select; scheids/admin → home-score
- `aria-busy` op skeletons; `role="status"` op read-only score
- Contact: teamnaam als knop met `aria-expanded` + hint *"Tik op teamnaam voor contactgegevens"*

## Componenten (P4 splits)

| Bestand | Verantwoordelijkheid |
|---------|---------------------|
| `matchFormLayout.ts` | Rol, tab- en sectievolgorde |
| `MatchFormMobileTabs.tsx` | Mobiele tabnavigatie |
| `MatchFormScoreSection.tsx` | Score UI + contact toggle |
| `MatchFormTeamContactDetails.tsx` | Contactpanel (telefoon/e-mail) |
| `MatchFormPlayerSelectionTable.tsx` | Spelers per team |
| `MatchFormCaptainSelect.tsx` | Aanvoerder |
| `MatchFormSectionCard.tsx` | Collapsible sectie |
| `MatchFormCardsSection.tsx` | Kaarten (skeleton laden) |
| `MatchFormFinancialSection.tsx` | Boetes + wedstrijdkosten (skeleton) |
| `MatchFormNotesSection.tsx` | Scheidsnotities |
| `matchFormTypes.ts` | Gedeelde types |
| `wedstrijdformulier-modal.tsx` | State, submit, orchestratie |
