import type { MatchFormsRow } from "@/services/core/matchesSessionFetch";
import type {
  PlayerCard,
  PlayerCardEvent,
  Suspension,
} from "../services/suspensionService";
import type { SuspensionRules } from "../services/suspensionRulesService";
import {
  resolveSuspensionMatchesAfterCard,
} from "./suspensionMatchSchedule";

const todayDateKey = (): string => {
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const episodeStatus = (
  suspendedForMatches: Array<{ date: string; opponent: string }>,
): Suspension["status"] => {
  if (!suspendedForMatches.length) return "completed";
  const today = todayDateKey();
  return suspendedForMatches.some((m) => m.date >= today) ? "active" : "completed";
};

const finalizeEpisodeStatuses = (
  episodes: Suspension[],
  remainingMatches: number,
): Suspension[] => {
  if (remainingMatches <= 0) {
    return episodes.map((episode) => ({ ...episode, status: "completed" as const }));
  }

  let activeAssigned = false;
  return episodes.map((episode) => {
    const hasUpcoming = episode.suspendedForMatches?.some(
      (m) => m.date >= todayDateKey(),
    );
    if (!activeAssigned && hasUpcoming) {
      activeAssigned = true;
      return { ...episode, status: "active" as const };
    }
    return { ...episode, status: "completed" as const };
  });
};

export function derivePlayerSuspensionEpisodes(
  player: PlayerCard,
  rules: SuspensionRules,
  scheduleMatches: MatchFormsRow[],
): Suspension[] {
  if (!player.teamId) return [];

  const yellowEvents = [...(player.cardEvents ?? [])]
    .filter((e) => e.cardType === "yellow")
    .sort((a, b) => a.matchDate.localeCompare(b.matchDate));
  const redEvents = [...(player.cardEvents ?? [])]
    .filter((e) => e.cardType === "red")
    .sort((a, b) => a.matchDate.localeCompare(b.matchDate));

  const episodes: Suspension[] = [];
  const triggeredYellowThresholds = new Set<number>();
  let yellowTotal = 0;

  for (const event of yellowEvents) {
    yellowTotal += 1;
    const sortedRules = [...rules.yellow_card_rules].sort((a, b) => {
      const countA = a.card_count ?? a.min_cards ?? 0;
      const countB = b.card_count ?? b.min_cards ?? 0;
      return countA - countB;
    });

    for (const rule of sortedRules) {
      const threshold = rule.card_count ?? rule.min_cards ?? 0;
      if (threshold <= 0 || yellowTotal < threshold) continue;
      if (triggeredYellowThresholds.has(threshold)) continue;

      triggeredYellowThresholds.add(threshold);
      const matchCount = rule.suspension_matches || 0;
      if (matchCount <= 0) continue;

      const suspendedForMatches = resolveSuspensionMatchesAfterCard(
        player.teamId,
        { matchId: event.matchId, matchDate: event.matchDate },
        matchCount,
        scheduleMatches,
      );

      episodes.push({
        id: `history-yellow-${player.playerId}-${threshold}-${event.matchId}`,
        playerId: player.playerId,
        playerName: player.playerName,
        teamName: player.teamName,
        teamId: player.teamId,
        source: "automatic",
        automaticKind: "yellow",
        reason: `${yellowTotal} gele kaarten`,
        matches: matchCount,
        status: episodeStatus(suspendedForMatches),
        cardDate: event.matchDate,
        suspendedForMatches,
        suspendedForMatch: suspendedForMatches[0],
      });
    }
  }

  for (const event of redEvents) {
    const matchCount = rules.red_card_rules.default_suspension_matches || 1;
    const suspendedForMatches = resolveSuspensionMatchesAfterCard(
      player.teamId,
      { matchId: event.matchId, matchDate: event.matchDate },
      matchCount,
      scheduleMatches,
    );

    episodes.push({
      id: `history-red-${player.playerId}-${event.matchId}`,
      playerId: player.playerId,
      playerName: player.playerName,
      teamName: player.teamName,
      teamId: player.teamId,
      source: "automatic",
      automaticKind: "red",
      reason: "1 rode kaart",
      matches: matchCount,
      status: episodeStatus(suspendedForMatches),
      cardDate: event.matchDate,
      suspendedForMatches,
      suspendedForMatch: suspendedForMatches[0],
    });
  }

  const sorted = episodes.sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (b.status === "active" && a.status !== "active") return 1;
    const dateA = a.cardDate || a.suspendedForMatch?.date || "";
    const dateB = b.cardDate || b.suspendedForMatch?.date || "";
    return dateB.localeCompare(dateA);
  });

  return finalizeEpisodeStatuses(sorted, player.suspendedMatches ?? 0);
}

export function formatCardEventMatchLine(event: PlayerCardEvent): string {
  const typeLabel = event.cardType === "red" ? "Rood" : "Geel";
  const comp =
    event.competitionType === "beker"
      ? "Beker"
      : event.competitionType === "playoff"
        ? "Play-off"
        : "Competitie";
  return `${typeLabel} · ${event.matchDate} · vs ${event.opponent} (${comp})`;
}
