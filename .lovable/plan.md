

## Problem Analysis

The `get_players_for_team` RPC function (used by `useTeamPlayersQuery`) has a hardcoded role check that only returns players for `admin` and `player_manager` roles. When a referee calls this function, it falls through to the default branch (`-- 5. Other roles: no access`) and returns an empty result set.

This causes:
1. "Geen spelers gevonden" on first load
2. After refresh, player IDs exist from saved match data but names can't be resolved, showing "(niet beschikbaar)"

The existing `can_read_player_for_match` RLS function already handles referee access correctly (checking assigned matches), but the RPC bypasses RLS entirely since it's `SECURITY DEFINER`.

## Solution

Add referee support to the `get_players_for_team` RPC function. When a referee requests players for a specific team, the function should check if the referee is assigned to any match involving that team, and if so, return those players.

### Database Migration

Create a new migration that updates `get_players_for_team` to add a referee branch between the `player_manager` and default sections:

```text
-- After the player_manager block, before "Other roles: no access":

IF v_role = 'referee' THEN
  IF p_team_id IS NOT NULL THEN
    -- Check if referee is assigned to any match involving this team
    IF EXISTS (
      SELECT 1 FROM matches m
      WHERE (m.home_team_id = p_team_id OR m.away_team_id = p_team_id)
      AND (
        m.assigned_referee_id = p_user_id
        OR m.referee = (SELECT username FROM users WHERE user_id = p_user_id)
      )
    ) THEN
      RETURN QUERY SELECT p.player_id, p.first_name, p.last_name, p.birth_date, p.team_id
        FROM players p WHERE p.team_id = p_team_id ORDER BY p.last_name, p.first_name;
    END IF;
  END IF;
  RETURN;
END IF;
```

### Frontend Fix (useTeamPlayersQuery.ts)

No changes needed in `useTeamPlayersQuery.ts` itself -- the hook already works correctly, it just receives empty data because the RPC blocks referees.

### Frontend Fix (useTeamPlayers.ts)

The `useTeamPlayers` hook wraps `useTeamPlayersQuery` with complex loading time management (min 250ms, max 15s timeout). This is fine and doesn't need changes.

### Player Name Resolution Safety (wedstrijdformulier-modal.tsx)

The existing name sync logic at lines 508-544 already handles updating player names when player data loads. However, there's a timing issue: if `homePlayersWithSuspensions` loads after the initial render but the `useEffect` dependency doesn't re-trigger properly, names stay as "(niet beschikbaar)".

Add a fallback in `getPlayerDisplayName` to always attempt name resolution from loaded players, not just from the selection's cached `playerName`.

## Technical Details

### Files to modify:
1. **New SQL migration** - Add referee role support to `get_players_for_team` RPC
2. **src/components/modals/matches/wedstrijdformulier-modal.tsx** - Ensure `getPlayerDisplayName` has a robust fallback that checks loaded player data when `playerName` is missing or shows "(niet beschikbaar)"

### Files unchanged:
- `useTeamPlayersQuery.ts` - Already correct, just needs data from RPC
- `useTeamPlayers.ts` - Loading management is fine

### Risk Assessment:
- Low risk: The RPC change only adds a new branch for referees, existing admin/player_manager logic is untouched
- The referee access check mirrors the existing `can_read_player_for_match` logic, maintaining security consistency

