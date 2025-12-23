# Player Loading Reliability Issue - Investigation Report

## Executive Summary

**Problem**: Player lists are not loading reliably after recent refactors, particularly in match forms.

**Root Cause**: The addition of `authContextReady` dependency and complex retry logic has introduced race conditions and dependency array issues that prevent reliable loading.

**Recommendation**: **Adjustment** (not rollback) - Fix the dependency arrays and simplify the auth context waiting logic.

---

## 1. Comparison: Old vs Current Implementation

### Old Stable Version (commit 6249b31)

**File**: `src/components/pages/admin/matches/hooks/useTeamPlayers.ts`

**Key Characteristics**:
- ✅ Simple, straightforward implementation
- ✅ Single `useEffect` with `[fetchPlayers]` dependency
- ✅ No `authContextReady` dependency
- ✅ Direct fetch on mount and teamId change
- ✅ Simple error handling

**Code Structure**:
```typescript
const fetchPlayers = useCallback(async () => {
  // Simple fetch logic
}, [teamId]);

useEffect(() => {
  fetchPlayers();
}, [fetchPlayers]);
```

### Current Version (after refactor)

**Key Changes**:
- ❌ Added `authContextReady` dependency to `fetchPlayers` callback
- ❌ Added retry logic with exponential backoff
- ❌ Added in-memory cache
- ❌ Two separate `useEffect` hooks with complex dependencies
- ❌ `hasFetchedWithContext` ref tracking

**Code Structure**:
```typescript
const fetchPlayers = useCallback(async (attempt = 0) => {
  if (!authContextReady) {
    return; // Early return
  }
  // Complex retry logic
}, [teamId, authContextReady]); // ⚠️ PROBLEM: authContextReady in deps

useEffect(() => {
  if (authContextReady) {
    fetchPlayers(0);
  }
}, [fetchPlayers, authContextReady]); // ⚠️ PROBLEM: fetchPlayers recreates

useEffect(() => {
  if (authContextReady && (!players || players.length === 0) && hasFetchedWithContext.current === false) {
    fetchPlayers(0);
  }
}, [authContextReady, players, fetchPlayers]); // ⚠️ PROBLEM: players in deps
```

---

## 2. Identified Breaking Changes

### 2.1 Dependency Array Issue #1: `fetchPlayers` Callback

**Location**: Line 167 in `useTeamPlayers.ts`

```typescript
const fetchPlayers = useCallback(async (attempt = 0) => {
  // ...
}, [teamId, authContextReady]); // ⚠️ PROBLEM
```

**Issue**: 
- `authContextReady` in dependency array causes `fetchPlayers` to be recreated every time auth context changes
- This triggers the `useEffect` that depends on `fetchPlayers`, causing unnecessary re-fetches
- Can create race conditions where multiple fetches happen simultaneously

**Impact**: 
- Players may load multiple times
- Race conditions can cause empty results
- Loading state may flicker

### 2.2 Dependency Array Issue #2: Second useEffect with `players`

**Location**: Lines 185-190 in `useTeamPlayers.ts`

```typescript
useEffect(() => {
  if (authContextReady && (!players || players.length === 0) && hasFetchedWithContext.current === false) {
    console.log('🔄 Auth context now ready, retrying player fetch...');
    fetchPlayers(0);
  }
}, [authContextReady, players, fetchPlayers]); // ⚠️ PROBLEM: players in deps
```

**Issue**:
- `players` in dependency array causes this effect to run every time players state changes
- When `fetchPlayers` sets `players`, it triggers this effect again
- Can create infinite loops or unnecessary re-fetches
- The `hasFetchedWithContext.current === false` check may not prevent all cases

**Impact**:
- Infinite fetch loops possible
- Players may be fetched multiple times unnecessarily
- Performance degradation

### 2.3 Early Return Logic Issue

**Location**: Lines 97-101 in `useTeamPlayers.ts`

```typescript
if (!authContextReady) {
  console.log('⏳ Waiting for auth context to be ready before fetching players...');
  setLoading(true);
  return; // Will be triggered again when authContextReady changes
}
```

**Issue**:
- Early return sets `loading: true` but doesn't actually fetch
- Relies on `useEffect` to trigger again when `authContextReady` changes
- If `authContextReady` changes while component is unmounting/remounting, fetch may never happen
- No guarantee that fetch will be triggered when context becomes ready

**Impact**:
- Players may never load if timing is off
- Loading state may be stuck
- Silent failures

### 2.4 Retry Logic with setTimeout

**Location**: Lines 152 in `useTeamPlayers.ts`

```typescript
setTimeout(() => fetchPlayers(attempt + 1), retryDelay);
```

**Issue**:
- Uses `setTimeout` which doesn't clean up on unmount
- If component unmounts during retry, `fetchPlayers` may still execute
- Can cause memory leaks and state updates on unmounted components
- No cleanup mechanism

**Impact**:
- Memory leaks
- React warnings about state updates on unmounted components
- Unpredictable behavior

---

## 3. Why Players Sometimes Fail to Load

### Scenario 1: Auth Context Timing
1. Component mounts
2. `authContextReady` is `false`
3. `fetchPlayers` is called, returns early
4. `useEffect` with `authContextReady` dependency should trigger when context becomes ready
5. **BUT**: If `fetchPlayers` callback was recreated in the meantime, the effect may not trigger correctly
6. **RESULT**: Players never load

### Scenario 2: Race Condition
1. Component mounts
2. `authContextReady` becomes `true`
3. First `useEffect` triggers `fetchPlayers(0)`
4. Second `useEffect` also triggers because `players` is empty
5. Two fetches happen simultaneously
6. One may overwrite the other's results
7. **RESULT**: Empty or inconsistent player list

### Scenario 3: Infinite Loop
1. Component mounts
2. `fetchPlayers` sets `players` to empty array `[]`
3. Second `useEffect` sees `players.length === 0` and triggers again
4. `hasFetchedWithContext.current` may not be set correctly
5. Loop continues
6. **RESULT**: Continuous fetching, performance issues

### Scenario 4: Unmount During Retry
1. Fetch fails, retry scheduled with `setTimeout`
2. Component unmounts (user navigates away)
3. `setTimeout` callback still executes
4. Tries to update state on unmounted component
5. **RESULT**: React warnings, potential crashes

---

## 4. Recommended Fix

### Option A: Simplify Auth Context Waiting (RECOMMENDED)

**Changes**:
1. Remove `authContextReady` from `fetchPlayers` dependency array
2. Move auth check inside `useEffect` instead of callback
3. Remove second `useEffect` with `players` dependency
4. Use `useRef` to track if fetch has been attempted
5. Add cleanup for `setTimeout` in retry logic

**Implementation**:

```typescript
export const useTeamPlayers = (teamId: number): UseTeamPlayersReturn => {
  const { authContextReady } = useAuth();
  const [players, setPlayers] = useState<TeamPlayer[] | undefined>(() => {
    return playerCache.get(teamId) || undefined;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const hasFetchedWithContext = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPlayers = useCallback(async (attempt = 0) => {
    if (!teamId) {
      setPlayers(undefined);
      setLoading(false);
      return;
    }

    // Wait for auth context INSIDE the function, not in dependency
    if (!authContextReady) {
      console.log('⏳ Waiting for auth context to be ready...');
      setLoading(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (attempt > 0) {
        const baseDelay = Math.min(1000 * Math.pow(2, attempt), 5000);
        const jitter = Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
      }

      const { data, error: fetchError } = await withUserContext(async () => {
        return await supabase
          .from('players')
          .select('player_id, first_name, last_name, team_id')
          .eq('team_id', teamId)
          .order('first_name')
          .abortSignal(AbortSignal.timeout(10000));
      });

      if (fetchError) {
        throw fetchError;
      }

      hasFetchedWithContext.current = true;
      setPlayers(data || []);
      if (data && data.length > 0) {
        playerCache.set(teamId, data);
      }
      setRetryCount(0);
      setLoading(false);
    } catch (err) {
      console.error(`Error fetching team players (attempt ${attempt + 1}):`, err);
      setError(err);
      
      if (attempt < 3) {
        setRetryCount(attempt + 1);
        setLoading(true);
        const retryDelay = Math.min(1000 * Math.pow(2, attempt + 1), 8000);
        
        // Clear previous timeout
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        
        retryTimeoutRef.current = setTimeout(() => {
          fetchPlayers(attempt + 1);
        }, retryDelay);
      } else {
        const cachedData = playerCache.get(teamId);
        if (cachedData && cachedData.length > 0) {
          console.log('Using cached player data after fetch failure');
          setPlayers(cachedData);
          setError(null);
        } else {
          setPlayers(undefined);
        }
        setRetryCount(0);
        setLoading(false);
      }
    }
  }, [teamId]); // ✅ FIXED: Remove authContextReady from deps

  const refetch = useCallback(async () => {
    setRetryCount(0);
    hasFetchedWithContext.current = false;
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    await fetchPlayers(0);
  }, [fetchPlayers]);

  const memoizedPlayers = useMemo(() => players, [players]);

  // Single useEffect - fetch when teamId changes OR when auth becomes ready
  useEffect(() => {
    // Only fetch if auth is ready and we haven't fetched yet
    if (authContextReady && !hasFetchedWithContext.current) {
      fetchPlayers(0);
    }
  }, [teamId, authContextReady, fetchPlayers]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    players: memoizedPlayers,
    loading: loading || retryCount > 0,
    error: retryCount >= 3 ? error : null,
    retryCount,
    refetch,
  };
};
```

### Option B: Rollback to Simple Version (NOT RECOMMENDED)

**Why not recommended**:
- Loses retry logic benefits
- Loses caching benefits
- May reintroduce issues for Team Managers with RLS
- Doesn't address the root cause of auth timing issues

---

## 5. Additional Issues Found

### 5.1 Missing Cleanup in Retry Logic

**Location**: Line 152
- `setTimeout` is not cleaned up on unmount
- Can cause memory leaks

**Fix**: Use `useRef` to store timeout ID and clear on unmount

### 5.2 `hasFetchedWithContext` Logic

**Location**: Lines 129-133, 186-190
- The ref is set to `true` after first successful fetch
- But the second `useEffect` checks `hasFetchedWithContext.current === false`
- This may not work correctly if fetch fails and retries

**Fix**: Reset ref in `refetch` function (already done), but also reset on teamId change

---

## 6. Testing Recommendations

After implementing the fix, test:

1. **Normal Load**: Players load correctly on first mount
2. **Auth Delay**: Players load when auth context is delayed
3. **Team Change**: Players reload when teamId changes
4. **Network Failure**: Retry logic works correctly
5. **Unmount During Fetch**: No memory leaks or warnings
6. **Concurrent Fetches**: No race conditions
7. **Cache Usage**: Cached data is used when available

---

## 7. Summary

**Root Cause**: 
- `authContextReady` in `fetchPlayers` dependency array causes callback recreation
- Second `useEffect` with `players` dependency can cause infinite loops
- Missing cleanup for `setTimeout` in retry logic

**Solution**: 
- Remove `authContextReady` from callback dependencies
- Simplify to single `useEffect` with proper dependencies
- Add cleanup for retry timeouts
- Keep retry logic and caching benefits

**Priority**: **HIGH** - This affects core functionality (player selection in matches)

**Estimated Fix Time**: 30-60 minutes
