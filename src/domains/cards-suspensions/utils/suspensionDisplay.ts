import { formatDateForDisplay } from "@/lib/dateUtils";
import type { Suspension } from "../services/suspensionService";

/** Komende (of geplande) wedstrijden waarvoor de speler geschorst is. */
export function formatSuspensionMatchLines(suspension: Suspension): string[] {
  if (suspension.suspendedForMatches && suspension.suspendedForMatches.length > 0) {
    return suspension.suspendedForMatches.map(
      (match) => `${formatDateForDisplay(match.date)} tegen ${match.opponent}`,
    );
  }
  if (suspension.suspendedForMatch) {
    return [
      `${formatDateForDisplay(suspension.suspendedForMatch.date)} tegen ${suspension.suspendedForMatch.opponent}`,
    ];
  }
  return [];
}

export function formatSuspensionCardDate(cardDate?: string): string | null {
  if (!cardDate) return null;
  return formatDateForDisplay(cardDate);
}
