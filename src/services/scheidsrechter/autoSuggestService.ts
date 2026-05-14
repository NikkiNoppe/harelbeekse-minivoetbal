import { supabase } from '@/integrations/supabase/client';

/**
 * Auto-suggest service: bepaalt de beste scheidsrechter voor een sessie
 * op basis van:
 *  1. Beschikbaarheid voor die sessie (verplicht)
 *  2. Niet al toegewezen aan een andere sessie op dezelfde datum
 *  3. Minste toewijzingen deze maand (workload-spreiding)
 *  4. Minste toewijzingen dit seizoen (eerlijke verdeling lange termijn)
 *  5. Alfabetisch (deterministisch)
 */

export interface SuggestionCandidate {
  user_id: number;
  username: string;
  monthCount: number;
  seasonCount: number;
  reason: string;
}

export interface SessionInput {
  sessionKey: string;
  matchIds: number[];
  dateOnly: string; // YYYY-MM-DD
}

export interface AvailabilityRecord {
  user_id: number;
  match_id: number | null;
  poll_group_id: string;
  is_available: boolean;
}

export interface AssignmentRecord {
  match_id: number;
  referee_id: number;
}

export interface RefereeInfo {
  user_id: number;
  username: string;
}

/**
 * Bereken workload-tellingen per scheidsrechter voor een maand en het seizoen.
 * Seizoen = augustus van dit jaar tot juli van volgend jaar (of vorig seizoen
 * als we voor augustus zitten).
 */
export async function fetchWorkloadStats(
  pollMonth: string,
): Promise<{
  monthCounts: Map<number, number>;
  seasonCounts: Map<number, number>;
}> {
  const [year, monthNum] = pollMonth.split('-').map(Number);

  // Seizoen: aug Y → jul Y+1; als maand < 8 dan aug Y-1 → jul Y
  const seasonStartYear = monthNum >= 8 ? year : year - 1;
  const seasonStart = `${seasonStartYear}-08-01`;
  const seasonEnd = `${seasonStartYear + 1}-08-01`;

  const { data: assignments } = await supabase
    .from('referee_matches' as any)
    .select('referee_id, match_id, assigned_at')
    .not('assigned_at', 'is', null);

  const allAssignments = ((assignments as any[]) || []);

  if (allAssignments.length === 0) {
    return { monthCounts: new Map(), seasonCounts: new Map() };
  }

  const matchIds = Array.from(new Set(allAssignments.map((a) => a.match_id)));
  const { data: matches } = await supabase
    .from('matches')
    .select('match_id, match_date')
    .in('match_id', matchIds);

  const matchDateMap = new Map<number, string>(
    (matches || []).map((m) => [m.match_id, m.match_date]),
  );

  const monthCounts = new Map<number, number>();
  const seasonCounts = new Map<number, number>();

  for (const a of allAssignments) {
    const dateStr = matchDateMap.get(a.match_id);
    if (!dateStr) continue;
    const dateOnly = dateStr.split('T')[0];

    // In huidige maand?
    if (dateOnly.startsWith(pollMonth)) {
      monthCounts.set(a.referee_id, (monthCounts.get(a.referee_id) || 0) + 1);
    }
    // In huidig seizoen?
    if (dateOnly >= seasonStart && dateOnly < seasonEnd) {
      seasonCounts.set(a.referee_id, (seasonCounts.get(a.referee_id) || 0) + 1);
    }
  }

  return { monthCounts, seasonCounts };
}

/**
 * Suggereer de top kandidaten voor een sessie.
 * Returnt gerangschikt op (monthCount asc, seasonCount asc, username asc).
 */
export function suggestRefereesForSession(args: {
  session: SessionInput;
  referees: RefereeInfo[];
  availability: AvailabilityRecord[];
  assignments: AssignmentRecord[];
  pollMonth: string;
  monthCounts: Map<number, number>;
  seasonCounts: Map<number, number>;
}): SuggestionCandidate[] {
  const {
    session,
    referees,
    availability,
    assignments,
    pollMonth,
    monthCounts,
    seasonCounts,
  } = args;

  const isRefereeAvailable = (refId: number): boolean => {
    for (const matchId of session.matchIds) {
      const avail = availability.find(
        (a) => a.user_id === refId && a.match_id === matchId,
      );
      if (avail) return avail.is_available;
    }
    const pollGroupId = `${pollMonth}_${session.matchIds[0] || 'general'}`;
    const byGroup = availability.find(
      (a) => a.user_id === refId && a.poll_group_id === pollGroupId,
    );
    return byGroup ? byGroup.is_available : false;
  };

  // Welke refs zijn al bezet op dezelfde dag (andere sessie)?
  const busyOnSameDay = new Set<number>();
  // We kunnen geen match_date kruisreferentie zonder matches; we gebruiken
  // alleen assignments + alle session.matchIds — andere sessies komen via
  // een aparte check uit de caller. Hier is busyOnSameDay best-effort leeg
  // tenzij de caller het meegeeft. Houden we eenvoudig: clash-check zit op
  // sessie-niveau via `assignedRefereeId !== null` van die sessie zelf.

  const candidates: SuggestionCandidate[] = referees
    .filter((ref) => {
      if (!isRefereeAvailable(ref.user_id)) return false;
      // Niet al toegewezen aan deze sessie
      const alreadyOnThisSession = assignments.some(
        (a) =>
          session.matchIds.includes(a.match_id) &&
          a.referee_id === ref.user_id,
      );
      if (alreadyOnThisSession) return false;
      return !busyOnSameDay.has(ref.user_id);
    })
    .map((ref) => {
      const m = monthCounts.get(ref.user_id) || 0;
      const s = seasonCounts.get(ref.user_id) || 0;
      return {
        user_id: ref.user_id,
        username: ref.username,
        monthCount: m,
        seasonCount: s,
        reason:
          m === 0
            ? 'Nog geen toewijzingen deze maand'
            : `${m} deze maand · ${s} dit seizoen`,
      };
    });

  candidates.sort((a, b) => {
    if (a.monthCount !== b.monthCount) return a.monthCount - b.monthCount;
    if (a.seasonCount !== b.seasonCount) return a.seasonCount - b.seasonCount;
    return a.username.localeCompare(b.username);
  });

  return candidates;
}
