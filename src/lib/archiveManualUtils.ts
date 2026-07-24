/** Helpers for historical season archives (manual + public display). */

import type { ArchivedStanding } from "@/services/archiveService";

export const MAX_HISTORICAL_SEASONS = 10;

const SEASON_LABEL_RE = /^(\d{4})-(\d{4})$/;

export function isValidSeasonLabel(label: string): boolean {
  const m = label.trim().match(SEASON_LABEL_RE);
  if (!m) return false;
  const start = Number(m[1]);
  const end = Number(m[2]);
  return end === start + 1;
}

/** Parse "2025-2026" → start year 2025, or null. */
export function parseSeasonLabelStartYear(label: string): number | null {
  const m = label.trim().match(SEASON_LABEL_RE);
  if (!m) return null;
  const start = Number(m[1]);
  const end = Number(m[2]);
  if (end !== start + 1) return null;
  return start;
}

export function formatSeasonLabel(startYear: number): string {
  return `${startYear}-${startYear + 1}`;
}

/**
 * Tot `count` seizoenlabels terug t.o.v. huidig label (inclusief huidig).
 * Voorbeeld: base 2025-2026, count 10 → 2025-2026 … 2016-2017.
 */
export function buildHistoricalSeasonLabels(
  baseLabel: string,
  count: number = MAX_HISTORICAL_SEASONS,
): string[] {
  const start = parseSeasonLabelStartYear(baseLabel);
  if (start == null) return [];
  const n = Math.max(1, Math.min(count, MAX_HISTORICAL_SEASONS));
  const labels: string[] = [];
  for (let i = 0; i < n; i++) {
    labels.push(formatSeasonLabel(start - i));
  }
  return labels;
}

/** Merge voorgestelde labels met bestaande archieflabels (uniek, nieuwste eerst). */
export function mergeSeasonLabelOptions(
  suggested: string[],
  existing: string[],
): string[] {
  const set = new Set<string>();
  const out: string[] = [];
  for (const label of [...suggested, ...existing]) {
    const t = label.trim();
    if (!t || set.has(t)) continue;
    set.add(t);
    out.push(t);
  }
  return out.sort((a, b) => {
    const ya = parseSeasonLabelStartYear(a) ?? 0;
    const yb = parseSeasonLabelStartYear(b) ?? 0;
    return yb - ya;
  });
}

export type StandingDivisionGroup = {
  division: string | null;
  standings: ArchivedStanding[];
};

/** Groepeer op division; null/lege division → één anonieme groep. */
export function groupStandingsByDivision(
  standings: ArchivedStanding[] | null | undefined,
): StandingDivisionGroup[] {
  if (!standings?.length) return [];

  const order: string[] = [];
  const map = new Map<string, ArchivedStanding[]>();

  for (const row of standings) {
    const key = row.division?.trim() || "";
    if (!map.has(key)) {
      order.push(key);
      map.set(key, []);
    }
    map.get(key)!.push(row);
  }

  return order.map((key) => ({
    division: key || null,
    standings: [...(map.get(key) ?? [])].sort((a, b) => a.position - b.position),
  }));
}

export function flattenDivisionStandings(
  groups: Array<{ division: string | null; standings: ArchivedStanding[] }>,
): ArchivedStanding[] {
  const out: ArchivedStanding[] = [];
  for (const group of groups) {
    const name = group.division?.trim() || null;
    for (const row of group.standings) {
      out.push({
        ...row,
        division: name,
      });
    }
  }
  return out;
}

export function createEmptyStandingRow(
  position: number,
  division?: string | null,
): ArchivedStanding {
  return {
    position,
    team_name: "",
    played: 0,
    won: 0,
    draw: 0,
    lost: 0,
    goals_for: 0,
    goals_against: 0,
    goal_diff: 0,
    points: 0,
    division: division?.trim() || null,
  };
}

/** Validatie klassement: teamnaam verplicht; unieke posities per reeks. */
export function validateArchivedStandings(
  standings: ArchivedStanding[],
): string | null {
  const filled = standings.filter((s) => s.team_name.trim().length > 0);
  if (filled.length === 0) {
    return "Voeg minstens één team toe aan het klassement.";
  }

  const byDivision = groupStandingsByDivision(filled);
  for (const group of byDivision) {
    const positions = new Set<number>();
    for (const row of group.standings) {
      if (!Number.isFinite(row.position) || row.position < 1) {
        return "Positie moet een geheel getal ≥ 1 zijn.";
      }
      if (positions.has(row.position)) {
        const label = group.division ? `reeks “${group.division}”` : "klassement";
        return `Dubbele positie ${row.position} in ${label}.`;
      }
      positions.add(row.position);
      if (!Number.isFinite(row.points)) {
        return "Punten moeten een getal zijn.";
      }
    }
  }

  return null;
}

export function archiveHasStandings(
  standings: ArchivedStanding[] | null | undefined,
): boolean {
  return (standings?.length ?? 0) > 0;
}

export function archiveHasCup(cup: { winner?: string } | null | undefined): boolean {
  return Boolean(cup?.winner?.trim());
}

export function archiveHasPlayoff(playoff: {
  top_ranking?: unknown[];
  bottom_ranking?: unknown[];
} | null | undefined): boolean {
  return (
    (playoff?.top_ranking?.length ?? 0) > 0 ||
    (playoff?.bottom_ranking?.length ?? 0) > 0
  );
}
