import { describe, expect, it } from "vitest";
import type { ArchivedStanding } from "@/services/archiveService";
import {
  buildHistoricalSeasonLabels,
  flattenDivisionStandings,
  groupStandingsByDivision,
  isValidSeasonLabel,
  mergeSeasonLabelOptions,
  validateArchivedStandings,
} from "./archiveManualUtils";

const row = (
  position: number,
  team: string,
  points: number,
  division?: string | null,
): ArchivedStanding => ({
  position,
  team_name: team,
  played: 0,
  won: 0,
  draw: 0,
  lost: 0,
  goals_for: 0,
  goals_against: 0,
  goal_diff: 0,
  points,
  division,
});

describe("season labels", () => {
  it("valideert YYYY-YYYY", () => {
    expect(isValidSeasonLabel("2025-2026")).toBe(true);
    expect(isValidSeasonLabel("2025-2027")).toBe(false);
    expect(isValidSeasonLabel("abc")).toBe(false);
  });

  it("bouwt 10 seizoenen terug inclusief basis", () => {
    const labels = buildHistoricalSeasonLabels("2025-2026", 10);
    expect(labels).toHaveLength(10);
    expect(labels[0]).toBe("2025-2026");
    expect(labels[9]).toBe("2016-2017");
  });

  it("merged bestaande labels", () => {
    const merged = mergeSeasonLabelOptions(
      ["2025-2026", "2024-2025"],
      ["2019-2020", "2025-2026"],
    );
    expect(merged[0]).toBe("2025-2026");
    expect(merged).toContain("2019-2020");
    expect(merged.filter((l) => l === "2025-2026")).toHaveLength(1);
  });
});

describe("division grouping", () => {
  it("groepeert en flatten behoudt division", () => {
    const standings = [
      row(1, "A", 30, "Eerste klasse"),
      row(2, "B", 20, "Eerste klasse"),
      row(1, "C", 25, "Tweede klasse"),
    ];
    const groups = groupStandingsByDivision(standings);
    expect(groups).toHaveLength(2);
    expect(groups[0].division).toBe("Eerste klasse");
    expect(groups[1].standings[0].team_name).toBe("C");

    const flat = flattenDivisionStandings(groups);
    expect(flat).toHaveLength(3);
    expect(flat.every((s) => s.division)).toBe(true);
  });

  it("zonder division = één groep", () => {
    const groups = groupStandingsByDivision([row(1, "A", 10), row(2, "B", 8)]);
    expect(groups).toHaveLength(1);
    expect(groups[0].division).toBeNull();
  });

  it("valideert dubbele posities per reeks", () => {
    expect(
      validateArchivedStandings([
        row(1, "A", 10, "EK"),
        row(1, "B", 8, "EK"),
      ]),
    ).toMatch(/Dubbele positie/);
    expect(
      validateArchivedStandings([
        row(1, "A", 10, "EK"),
        row(1, "B", 8, "TK"),
      ]),
    ).toBeNull();
  });
});
