import { describe, expect, it } from "vitest";
import {
  assignFirstRoundWeekIndex,
  getCupBracketPlan,
  getCupFirstRoundPairs,
  getKnockoutWeekIndices,
  matchDateFromWeekMonday,
  pickSpacedIndices,
  suggestIdealCupDates,
} from "./cupBracketPlan";

describe("getCupFirstRoundPairs", () => {
  it("16 teams → 8 paren", () => {
    expect(getCupFirstRoundPairs(16)).toBe(8);
  });
  it("15 teams → 7 paren (1 bye)", () => {
    expect(getCupFirstRoundPairs(15)).toBe(7);
  });
  it("22 teams → 11 paren", () => {
    expect(getCupFirstRoundPairs(22)).toBe(11);
  });
});

describe("getCupBracketPlan", () => {
  it("16 teams / 7 slots → 5 weken (2×1/8 + QF + SF + F)", () => {
    const plan = getCupBracketPlan(16, 7);
    expect(plan.firstRoundPairs).toBe(8);
    expect(plan.firstRoundWeeks).toBe(2);
    expect(plan.requiredWeeks).toBe(5);
  });

  it("14 teams / 7 slots → 4 weken", () => {
    const plan = getCupBracketPlan(14, 7);
    expect(plan.firstRoundPairs).toBe(7);
    expect(plan.firstRoundWeeks).toBe(1);
    expect(plan.requiredWeeks).toBe(4);
  });

  it("22 teams / 7 slots → 5 weken", () => {
    const plan = getCupBracketPlan(22, 7);
    expect(plan.firstRoundPairs).toBe(11);
    expect(plan.firstRoundWeeks).toBe(2);
    expect(plan.requiredWeeks).toBe(5);
  });

  it("meer paren dan 2× slots → 6+ weken", () => {
    const plan = getCupBracketPlan(30, 7); // 15 paren
    expect(plan.firstRoundWeeks).toBe(3);
    expect(plan.requiredWeeks).toBe(6);
  });
});

describe("assignFirstRoundWeekIndex", () => {
  it("vult weken opeenvolgend op slotcapaciteit", () => {
    expect(assignFirstRoundWeekIndex(0, 8, 2, 7)).toBe(0);
    expect(assignFirstRoundWeekIndex(6, 8, 2, 7)).toBe(0);
    expect(assignFirstRoundWeekIndex(7, 8, 2, 7)).toBe(1);
  });
});

describe("getKnockoutWeekIndices", () => {
  it("laatste 3 weken voor QF/SF/Finale", () => {
    expect(getKnockoutWeekIndices(5)).toEqual({
      firstRoundWeeks: 2,
      quarterFinal: 2,
      semiFinal: 3,
      final: 4,
    });
    expect(getKnockoutWeekIndices(4)).toEqual({
      firstRoundWeeks: 1,
      quarterFinal: 1,
      semiFinal: 2,
      final: 3,
    });
  });
});

describe("matchDateFromWeekMonday", () => {
  it("maandag en vrijdag correct t.o.v. weekmaandag", () => {
    expect(matchDateFromWeekMonday("2026-09-07", 1)).toBe("2026-09-07");
    expect(matchDateFromWeekMonday("2026-09-07", 5)).toBe("2026-09-11");
  });
});

describe("pickSpacedIndices", () => {
  it("kiest gelijkmatig", () => {
    expect(pickSpacedIndices(10, 4)).toEqual([0, 3, 6, 9]);
  });
});

describe("suggestIdealCupDates", () => {
  it("vermijdt competitieweken wanneer mogelijk", () => {
    const suggestion = suggestIdealCupDates({
      requiredWeeks: 4,
      seasonStart: "2025-09-01",
      seasonEnd: "2026-05-31",
      competitionMondays: [
        "2025-09-08",
        "2025-09-15",
        "2025-09-22",
        "2025-09-29",
        "2025-10-06",
      ],
      timeslots: [{ day_of_week: 1 }, { day_of_week: 5 }],
    });
    expect(suggestion.dates).toHaveLength(4);
    expect(suggestion.overlappingMondays).toHaveLength(0);
    expect(suggestion.daySeparation.earlyLabel).toBe("Maandag");
    expect(suggestion.daySeparation.lateLabel).toBe("Vrijdag");
  });

  it("meldt overlap als er te weinig vrije weken zijn", () => {
    const suggestion = suggestIdealCupDates({
      requiredWeeks: 3,
      seasonStart: "2025-09-01",
      seasonEnd: "2025-09-22",
      vacations: [],
      competitionMondays: ["2025-09-01", "2025-09-08", "2025-09-15", "2025-09-22"],
      timeslots: [{ day_of_week: 1 }, { day_of_week: 5 }],
    });
    expect(suggestion.dates.length).toBeGreaterThan(0);
    expect(suggestion.overlappingMondays.length).toBeGreaterThan(0);
    expect(suggestion.notes.some((n) => n.includes("overlappen"))).toBe(true);
  });
});
