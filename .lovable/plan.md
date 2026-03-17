

## Plan: Spelersoverzicht met wedstrijden en kaarten op profielpagina

### Wat wordt gebouwd
Een compact "Mijn Spelers" kaart op de `/profile` pagina voor team managers. Per speler wordt getoond:
- Naam
- Aantal wedstrijden (gespeelde wedstrijden waarin de speler op het formulier staat)
- Gele kaarten (compact geel bolletje + aantal)
- Rode kaarten (compact rood bolletje + aantal)

### Data-aanpak

De spelersdata (naam, yellow_cards, red_cards) komt al uit de `players` tabel via de bestaande `get_players_for_team` RPC.

Voor het aantal wedstrijden per speler moet ik de `matches` tabel doorzoeken: alle `is_submitted = true` wedstrijden waar het team in speelt, en per match de `home_players`/`away_players` JSONB arrays parsen om te tellen in hoeveel wedstrijden elke `playerId` voorkomt.

### Technische aanpak

**1. Nieuwe hook: `src/hooks/useTeamPlayerStats.ts`**
- Accepteert `teamId`
- Fetcht spelers via `get_players_for_team` RPC (hergebruik bestaande pattern)
- Fetcht alle submitted matches voor dit team via Supabase query op `matches` (where `home_team_id = teamId OR away_team_id = teamId` AND `is_submitted = true`), selecteert alleen `home_players, away_players, home_team_id`
- Combineert: per speler tel in hoeveel wedstrijden hun `playerId` voorkomt in de juiste players-array
- Retourneert: `{ players: Array<{ player_id, name, matchCount, yellowCards, redCards }>, isLoading }`

**2. Nieuwe component in `UserProfilePage.tsx`: `TeamPlayersOverview`**
- Compact Card met titel "Mijn Spelers" + Users icon
- Lijst van spelers als compacte rijen (geen tabel, mobile-first)
- Per rij: naam links, rechts een cluster van badges:
  - Wedstrijden: klein getal met `Trophy` icon
  - Geel: geel bolletje + aantal (alleen als >0)
  - Rood: rood bolletje + aantal (alleen als >0)
- Gesorteerd op achternaam
- Skeleton loading state
- Getoond tussen de UserTeamInfoCard en NextMatchCard, alleen voor `player_manager` rol

### UI Design (compact, consistent met bestaande stijl)

```text
┌─────────────────────────────────────────┐
│ 👥 Mijn Spelers                    (12) │
├─────────────────────────────────────────┤
│ Janssen, Pieter        🏆 8  🟡 2  🔴 0 │
│─────────────────────────────────────────│
│ De Vries, Thomas       🏆 6  🟡 1       │
│─────────────────────────────────────────│
│ Bakker, Kevin          🏆 5             │
└─────────────────────────────────────────┘
```

Subtiele `border-border/50` scheidingen tussen rijen. Kaartindicatoren alleen getoond als count > 0. Rode kaarten alleen als > 0.

### Bestanden

1. `src/hooks/useTeamPlayerStats.ts` — nieuwe hook voor gecombineerde speler + wedstrijdtelling data
2. `src/components/pages/user/UserProfilePage.tsx` — nieuwe `TeamPlayersOverview` component + integratie in profiel layout

