import type { MatchFormsRow } from "@/services/core/matchesSessionFetch";

export interface SuspensionMatchRef {
  date: string;
  opponent: string;
}

export interface CardSuspensionTrigger {
  matchId?: number;
  /** Datum of volledige ISO-timestamp van de wedstrijd waar de kaart viel */
  matchDate: string;
}

const matchToDateKey = (matchDate: string): string => {
  const date = new Date(matchDate);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const mapTeamMatch = (
  match: MatchFormsRow,
  teamId: number,
): SuspensionMatchRef => {
  const isHome = match.home_team_id === teamId;
  const opponent = isHome
    ? match.away_team_name || "Onbekend"
    : match.home_team_name || "Onbekend";
  return {
    date: matchToDateKey(match.match_date),
    opponent,
  };
};

/** Tijdstip van de trigger-wedstrijd — schorsing geldt pas voor wedstrijden erna. */
const resolveTriggerMatchTime = (
  trigger: CardSuspensionTrigger,
  teamSchedule: MatchFormsRow[],
): number | null => {
  if (trigger.matchId != null) {
    const triggerMatch = teamSchedule.find((m) => m.match_id === trigger.matchId);
    if (triggerMatch?.match_date) {
      return new Date(triggerMatch.match_date).getTime();
    }
  }

  if (trigger.matchDate.includes("T")) {
    const parsed = new Date(trigger.matchDate).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }

  const parts = trigger.matchDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [year, month, day] = parts;
  return Date.UTC(year, month - 1, day, 23, 59, 59, 999);
};

/**
 * Volgende teamwedstrijden ná de wedstrijd waarin de kaart viel (zelfde match_id uitgesloten).
 * Zelfde logica als notify-auto-suspension edge function.
 */
export function resolveSuspensionMatchesAfterCard(
  teamId: number,
  trigger: CardSuspensionTrigger,
  count: number,
  allMatches: MatchFormsRow[],
): SuspensionMatchRef[] {
  if (!teamId || count <= 0) return [];

  const teamSchedule = allMatches
    .filter((m) => m.home_team_id === teamId || m.away_team_id === teamId)
    .sort((a, b) => {
      const byDate = a.match_date.localeCompare(b.match_date);
      return byDate !== 0 ? byDate : a.match_id - b.match_id;
    });

  if (!teamSchedule.length) return [];

  const triggerTime = resolveTriggerMatchTime(trigger, teamSchedule);
  let startIndex = 0;

  if (trigger.matchId != null) {
    const triggerIndex = teamSchedule.findIndex((m) => m.match_id === trigger.matchId);
    if (triggerIndex >= 0) {
      startIndex = triggerIndex + 1;
    }
  }

  if (startIndex === 0 && triggerTime != null) {
    startIndex = teamSchedule.findIndex(
      (m) =>
        m.match_id !== trigger.matchId &&
        new Date(m.match_date).getTime() > triggerTime,
    );
  }

  if (startIndex < 0) return [];

  return teamSchedule
    .slice(startIndex, startIndex + count)
    .map((match) => mapTeamMatch(match, teamId));
}
