

## Analysis: Blank Player Data in Playoff Match Forms

### Root Cause Analysis

After thorough code inspection, there are **two likely causes** for blank player data:

**Cause 1 (Most Likely): Team managers never filled in players for some playoff matches.**
Playoff matches are generated with default empty player arrays (`[]`). The finalization step only assigns `home_team_id`, `away_team_id`, and `is_playoff_finalized` -- it never touches player data. Evidence: match 2224 has home team players filled but away team blank; match 2229 has away filled but home blank. This is consistent with one team manager filling in their side while the other didn't.

**Cause 2 (Bug): `handleSavePlayerSelection` bypasses dirty tracking.**
In `wedstrijdformulier-modal.tsx` (line 878-883), when a team manager clicks "Save Players", the function sends `homeTeamSelections` and `awayTeamSelections` directly without checking dirty flags. If the form state contains blank players (e.g., because players failed to load due to RLS), it overwrites existing data with blanks.

### Plan: Protect Player Data from Being Wiped

**1. Database trigger to prevent wiping populated player data**
Create a trigger on the `matches` table that blocks updates setting `home_players` or `away_players` to blank arrays when they previously contained player data (non-null playerIds), UNLESS the caller is an admin.

```sql
CREATE FUNCTION prevent_player_data_wipe() RETURNS trigger ...
  -- If old data had players with non-null playerIds
  -- And new data is all-null playerIds
  -- And caller is NOT admin → RAISE EXCEPTION
```

**2. Fix `handleSavePlayerSelection` to respect dirty tracking**
Only include each team's player data if it was actually modified (dirty flag is true), preventing accidental overwrites.

**3. Add server-side protection in `update_match_with_context` RPC**
Before accepting a `home_players`/`away_players` update, verify that the new data isn't wiping existing populated data (unless the user is admin). If the current data has real players and the new data is all blank, reject the update for that field.

**4. Prevent referees from accidentally clearing player data**
When a referee submits (scores only), ensure `homePlayers` and `awayPlayers` are explicitly excluded from the update payload, regardless of dirty flags. Referees should only update: scores, referee, referee_notes, is_submitted, is_locked.

**5. Lock submitted matches for non-admin users**
Once a match has `is_submitted = true` AND contains player data AND scores, only admins should be able to modify player lists. Referees can still update referee_notes and scores. Team managers are fully locked out of submitted matches.

### Technical Details

Files to modify:
- `src/components/modals/matches/wedstrijdformulier-modal.tsx` -- fix `handleSavePlayerSelection`, restrict referee payload
- `src/services/match/enhancedMatchService.ts` -- add guard against blank player overwrites
- `update_match_with_context` RPC -- add server-side blank-data protection
- New migration: `prevent_player_data_wipe` trigger

### What this does NOT fix
The already-blank matches need manual data restoration (if the original player data was ever entered). If team managers simply never filled them in, the data was never there to lose.

