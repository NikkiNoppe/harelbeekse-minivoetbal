import { fetchScheidsWorkloadStats } from "@/services/scheidsrechter/scheidsSessionFetch";

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
  dateOnly: string;
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

export async function fetchWorkloadStats(
  pollMonth: string,
): Promise<{
  monthCounts: Map<number, number>;
  seasonCounts: Map<number, number>;
}> {
  const workload = await fetchScheidsWorkloadStats(pollMonth);
  const monthCounts = new Map<number, number>();
  const seasonCounts = new Map<number, number>();

  workload.forEach((counts, refereeId) => {
    monthCounts.set(refereeId, counts.monthCount);
    seasonCounts.set(refereeId, counts.seasonCount);
  });

  return { monthCounts, seasonCounts };
}

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

  const busyOnSameDay = new Set<number>();

  const candidates: SuggestionCandidate[] = referees
    .filter((ref) => {
      if (!isRefereeAvailable(ref.user_id)) return false;
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
