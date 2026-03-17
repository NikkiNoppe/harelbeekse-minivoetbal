

## Plan: Profielpagina verbeteren

### 1. Fix kaarten niet zichtbaar

**Oorzaak**: In `useTeamPlayerStats.ts` wordt een directe query op de `players` tabel gedaan voor `yellow_cards` en `red_cards` (regel 37-40), maar er is geen user context ingesteld. De RLS policies op `players` vereisen `get_current_user_role()` en `get_current_user_team_ids()`, waardoor de query stilletjes een leeg resultaat geeft. Alle kaarten worden dan 0.

**Fix**: Wrap de card data query met `withUserContext`, of beter: voeg `yellow_cards` en `red_cards` toe aan de bestaande RPC `get_players_for_team` zodat er geen aparte query nodig is. Aangezien we de RPC niet willen wijzigen (database migratie), wrappen we de players query met `withUserContext`.

**Bestand**: `src/hooks/useTeamPlayerStats.ts`

### 2. Volgorde secties herschikken

Huidige volgorde: Profiel → Spelers → RefereeNotes → Wedstrijd → Snelle Acties

Nieuwe volgorde:
1. Mijn Profiel (kaart)
2. Eerstvolgende Wedstrijd
3. Gespeelde wedstrijden per speler
4. Financieel overzicht (nieuw, pro forma)
5. Admin Berichten (nieuw kader)
6. Snelle Acties

**Bestand**: `src/components/pages/user/UserProfilePage.tsx` (render volgorde aanpassen in het return statement, regels 1248-1373)

### 3. Sorteer-dropdown in plaats van buttons

Vervang de drie sorteerbuttons ("Naam", "Wedstrijden", "Kaarten") door een compacte `Select` dropdown. Past beter bij de rest van de UI waar dropdowns worden gebruikt (bv. maandselectie bij referee matches).

**Bestand**: `src/components/pages/user/UserProfilePage.tsx` (TeamPlayersOverview component, regels 336-352)

### 4. Pro forma financieel overzicht

Nieuw compact `FinancialOverviewCard` component voor team managers. Toont een simpel overzicht met:
- Huidig saldo (opgehaald uit `team_costs` tabel, som van amounts per team)
- Aantal boetes dit seizoen
- Compacte weergave, consistent met de card-styling van de rest van de pagina

Dit is een klein pro forma blok — de echte financiële pagina blijft de volledige versie.

**Bestand**: `src/components/pages/user/UserProfilePage.tsx` (nieuw component inline)

### 5. Admin berichten kader

Nieuw `AdminMessageCard` component dat een bericht toont afkomstig van de admin. Voorlopig pro forma met placeholder tekst en de juiste styling. Later kan dit gekoppeld worden aan een `application_settings` entry (category `admin_messages`) zodat de admin via de settings pagina berichten kan posten.

Styling: Card met een subtiele `border-primary/20` rand, een `MessageSquare` icoon, en een lichte achtergrond. Toont "Geen berichten" als er niets is.

**Bestand**: `src/components/pages/user/UserProfilePage.tsx` (nieuw component inline)

### Bestanden
1. `src/hooks/useTeamPlayerStats.ts` — fix card data query met withUserContext
2. `src/components/pages/user/UserProfilePage.tsx` — herschik secties, dropdown sorteer, financieel overzicht, admin berichten kader

