/**
 * Background Side Effects Manager
 * 
 * Handles fire-and-forget side effects with:
 * - Structured logging for observability
 * - Single retry with exponential backoff
 * - Failure tracking for admin detection
 * - Idempotent operations (safe to re-run)
 */

import { supabase } from "@/integrations/supabase/client";
import { bekerService } from "@/services/match/cupService";

// Correlation ID for tracing related logs
const generateCorrelationId = () => `se-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface SideEffectContext {
  matchId: number;
  correlationId: string;
  timestamp: string;
}

interface SideEffectResult {
  name: string;
  success: boolean;
  error?: string;
  retried?: boolean;
  duration?: number;
}

interface MatchInfo {
  match_date?: string;
  home_team_id?: number;
  away_team_id?: number;
  is_cup_match?: boolean;
  unique_number?: string;
}

interface UpdateData {
  homePlayers?: any[];
  awayPlayers?: any[];
  isCompleted?: boolean;
  referee?: string;
}

/**
 * Logs a side effect event with structured data
 */
const logSideEffect = (
  ctx: SideEffectContext,
  name: string,
  level: 'info' | 'warn' | 'error',
  message: string,
  data?: Record<string, any>
) => {
  const logData = {
    correlationId: ctx.correlationId,
    matchId: ctx.matchId,
    sideEffect: name,
    timestamp: new Date().toISOString(),
    ...data
  };

  const prefix = `[${ctx.correlationId}] [${name}]`;
  
  switch (level) {
    case 'info':
      console.log(`✅ ${prefix} ${message}`, logData);
      break;
    case 'warn':
      console.warn(`⚠️ ${prefix} ${message}`, logData);
      break;
    case 'error':
      console.error(`❌ ${prefix} ${message}`, logData);
      break;
  }
};

/**
 * Records a failed side effect for admin detection
 * Uses application_settings table as a simple failure log
 */
const recordFailure = async (
  ctx: SideEffectContext,
  name: string,
  error: string
): Promise<void> => {
  try {
    const failureData = {
      matchId: ctx.matchId,
      sideEffect: name,
      error: error.substring(0, 500), // Truncate long errors
      correlationId: ctx.correlationId,
      timestamp: ctx.timestamp,
      canRetry: true
    };

    await supabase
      .from('application_settings')
      .insert({
        setting_category: 'failed_side_effects',
        setting_name: `${name}_${ctx.matchId}_${Date.now()}`,
        setting_value: failureData,
        is_active: true
      });

    logSideEffect(ctx, name, 'info', 'Failure recorded for admin review');
  } catch (recordErr) {
    // Don't throw - this is best effort
    console.error('Failed to record side effect failure:', recordErr);
  }
};

/**
 * Executes a side effect with single retry on failure
 */
const executeWithRetry = async <T>(
  ctx: SideEffectContext,
  name: string,
  operation: () => Promise<T>,
  retryDelayMs: number = 1000
): Promise<SideEffectResult> => {
  const startTime = Date.now();

  try {
    await operation();
    return {
      name,
      success: true,
      duration: Date.now() - startTime
    };
  } catch (firstError: any) {
    logSideEffect(ctx, name, 'warn', 'First attempt failed, retrying...', {
      error: firstError?.message || String(firstError)
    });

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, retryDelayMs));

    try {
      await operation();
      return {
        name,
        success: true,
        retried: true,
        duration: Date.now() - startTime
      };
    } catch (retryError: any) {
      const errorMessage = retryError?.message || String(retryError);
      logSideEffect(ctx, name, 'error', 'Both attempts failed', {
        error: errorMessage
      });

      // Record failure for admin detection
      await recordFailure(ctx, name, errorMessage);

      return {
        name,
        success: false,
        error: errorMessage,
        retried: true,
        duration: Date.now() - startTime
      };
    }
  }
};

/**
 * Cup advancement side effect
 * IDEMPOTENT: Recalculates based on current scores, safe to re-run
 */
const processCupAdvancement = async (
  ctx: SideEffectContext,
  matchId: number
): Promise<void> => {
  const current = await bekerService.getCupMatchById(matchId);
  if (!current) {
    logSideEffect(ctx, 'cup_advancement', 'info', 'Match not found or not a cup match');
    return;
  }

  const nextRound = bekerService.getNextRound(current.unique_number!);
  if (!nextRound) {
    logSideEffect(ctx, 'cup_advancement', 'info', 'No next round available');
    return;
  }

  const hsNew = current.home_score;
  const asNew = current.away_score;

  if (hsNew == null || asNew == null || hsNew === asNew) {
    await bekerService.clearAdvancement(current.unique_number!, nextRound);
    await bekerService.clearAdvancementCascade(current.unique_number!);
    logSideEffect(ctx, 'cup_advancement', 'info', 'Cleared advancement (no winner or tie)');
  } else {
    const winnerTeamId = hsNew > asNew ? current.home_team_id! : current.away_team_id!;
    await bekerService.updateAdvancement(current.unique_number!, winnerTeamId, nextRound);
    logSideEffect(ctx, 'cup_advancement', 'info', 'Updated advancement', { winnerTeamId });
  }
};

/**
 * Card penalties sync side effect
 * IDEMPOTENT: Uses upsert/delete pattern based on current player cards
 */
const syncCardPenalties = async (
  ctx: SideEffectContext,
  matchId: number,
  matchInfo: MatchInfo,
  updateData: UpdateData
): Promise<void> => {
  const mapPlayers = (arr?: any[]) => (arr || []).map(p => ({
    playerId: p?.playerId ?? null,
    cardType: p?.cardType ?? null,
  }));

  const { data, error } = await supabase.functions.invoke('sync-card-penalties', {
    body: {
      matchId,
      matchDateISO: matchInfo?.match_date || null,
      homeTeamId: matchInfo?.home_team_id,
      awayTeamId: matchInfo?.away_team_id,
      homePlayers: mapPlayers(updateData.homePlayers),
      awayPlayers: mapPlayers(updateData.awayPlayers)
    }
  });

  if (error) throw error;
  if (data && !data.success) throw new Error(data.message || 'Unknown error from sync-card-penalties');

  logSideEffect(ctx, 'card_penalties', 'info', 'Synced successfully', {
    processedCounts: data?.processedCounts
  });
};

/**
 * Match costs sync side effect
 * IDEMPOTENT: Ensures exactly one cost record per team/cost_type
 */
const syncMatchCosts = async (
  ctx: SideEffectContext,
  matchId: number,
  matchInfo: MatchInfo,
  updateData: UpdateData
): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('sync-match-costs', {
    body: {
      matchId,
      matchDateISO: matchInfo?.match_date || null,
      homeTeamId: matchInfo?.home_team_id,
      awayTeamId: matchInfo?.away_team_id,
      isSubmitted: updateData.isCompleted,
      referee: updateData.referee || null
    }
  });

  if (error) throw error;
  if (data && !data.success) throw new Error(data.message || 'Unknown error from sync-match-costs');

  logSideEffect(ctx, 'match_costs', 'info', 'Synced successfully', {
    processedCosts: data?.processedCosts
  });
};

/**
 * Main entry point for scheduling all background side effects
 * Fire-and-forget pattern - does not block caller
 */
export const scheduleBackgroundSideEffects = (
  matchId: number,
  updateData: UpdateData,
  matchInfo: MatchInfo | null,
  isCupMatch: boolean
): void => {
  // Don't await - run in background
  Promise.resolve().then(async () => {
    const ctx: SideEffectContext = {
      matchId,
      correlationId: generateCorrelationId(),
      timestamp: new Date().toISOString()
    };

    console.log(`🔄 [${ctx.correlationId}] Starting background side effects for match ${matchId}`);

    const results: SideEffectResult[] = [];

    // 1. Cup advancement (if applicable)
    if (isCupMatch) {
      const result = await executeWithRetry(
        ctx,
        'cup_advancement',
        () => processCupAdvancement(ctx, matchId)
      );
      results.push(result);
    }

    // 2. Sync card penalties (if players changed)
    const playersProvided = updateData.homePlayers !== undefined || updateData.awayPlayers !== undefined;
    if (playersProvided && matchInfo) {
      const result = await executeWithRetry(
        ctx,
        'card_penalties',
        () => syncCardPenalties(ctx, matchId, matchInfo, updateData),
        1500 // Slightly longer delay for edge function
      );
      results.push(result);
    }

    // 3. Sync match costs (if match completed)
    if (updateData.isCompleted && matchInfo) {
      const result = await executeWithRetry(
        ctx,
        'match_costs',
        () => syncMatchCosts(ctx, matchId, matchInfo, updateData),
        1500
      );
      results.push(result);
    }

    // Summary log
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);

    console.log(`✅ [${ctx.correlationId}] Background side effects completed`, {
      matchId,
      total: results.length,
      succeeded: successCount,
      failed: failedCount,
      totalDurationMs: totalDuration,
      results: results.map(r => ({
        name: r.name,
        success: r.success,
        retried: r.retried,
        duration: r.duration,
        error: r.error
      }))
    });

  }).catch(err => {
    // Catch-all for unexpected errors
    console.error('❌ [backgroundSideEffects] Unexpected error in side effects orchestration:', err);
  });
};

/**
 * Utility to check for failed side effects (for admin UI)
 */
export const getFailedSideEffects = async (matchId?: number): Promise<any[]> => {
  let query = supabase
    .from('application_settings')
    .select('*')
    .eq('setting_category', 'failed_side_effects')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (matchId) {
    query = query.contains('setting_value', { matchId });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch failed side effects:', error);
    return [];
  }

  return data || [];
};

/**
 * Utility to manually retry a failed side effect
 */
export const retryFailedSideEffect = async (failureId: number): Promise<boolean> => {
  const { data: failure, error } = await supabase
    .from('application_settings')
    .select('*')
    .eq('id', failureId)
    .single();

  if (error || !failure) {
    console.error('Failed to fetch failure record:', error);
    return false;
  }

  const value = failure.setting_value as any;
  const matchId = value?.matchId;
  const sideEffect = value?.sideEffect;

  if (!matchId || !sideEffect) {
    console.error('Invalid failure record');
    return false;
  }

  // Fetch current match data
  const { data: matchInfo } = await supabase
    .from('matches')
    .select('*')
    .eq('match_id', matchId)
    .single();

  if (!matchInfo) {
    console.error('Match not found');
    return false;
  }

  const ctx: SideEffectContext = {
    matchId,
    correlationId: generateCorrelationId(),
    timestamp: new Date().toISOString()
  };

  try {
    switch (sideEffect) {
      case 'cup_advancement':
        await processCupAdvancement(ctx, matchId);
        break;
      case 'card_penalties':
        await syncCardPenalties(ctx, matchId, matchInfo, {
          homePlayers: matchInfo.home_players as any[] | undefined,
          awayPlayers: matchInfo.away_players as any[] | undefined
        });
        break;
      case 'match_costs':
        await syncMatchCosts(ctx, matchId, matchInfo, {
          isCompleted: matchInfo.is_submitted,
          referee: matchInfo.referee
        });
        break;
      default:
        console.error('Unknown side effect type:', sideEffect);
        return false;
    }

    // Mark as resolved
    await supabase
      .from('application_settings')
      .update({ is_active: false })
      .eq('id', failureId);

    return true;
  } catch (err) {
    console.error('Manual retry failed:', err);
    return false;
  }
};
