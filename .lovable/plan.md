

## Fix: Spelerslijsten worden niet geladen op /profile

### Probleem

Twee plekken blokkeren spelersdata op de profielpagina:

1. **`useRefereeMatches.ts`** — haalt `home_players` en `away_players` niet op uit de database query
2. **`convertToMatchFormData` in `UserProfilePage.tsx`** — zet spelerslijsten hardcoded op lege arrays `[]`, zelfs als de data beschikbaar zou zijn

### Oplossing

**Bestand 1: `src/hooks/useRefereeMatches.ts`**
- `home_players` en `away_players` toevoegen aan de Supabase select query
- Toevoegen aan het `RefereeMatch` interface
- Meegeven in de return mapping

**Bestand 2: `src/components/pages/user/UserProfilePage.tsx`**
- In `convertToMatchFormData` (regel 1357-1358): vervang hardcoded lege arrays door de werkelijke match data:
  - `homePlayers: match.home_players || []`
  - `awayPlayers: match.away_players || []`

### Impact
- 2 bestanden, minimale wijzigingen
- Geen database-wijzigingen nodig
- Na fix: referee ziet bij het openen van een wedstrijdformulier vanuit `/profile` dezelfde spelersdata als via `/admin/match-forms`

