import { describe, it, expect } from "vitest";
import {
  normalizePlayerListLockPeriods,
  toPlayerListLockSettingValue,
  getPlayerListLockScheduleStatus,
  isSettingsPlayerListLocked,
  findActiveLockPeriod,
  findNextLockPeriod,
  validatePlayerListLockPeriods,
  resolveLockMessageDates,
} from "./playerListLockUtils";

const day = (iso: string) => new Date(`${iso}T12:00:00`);

describe("normalizePlayerListLockPeriods", () => {
  it("leest periods[]", () => {
    const periods = normalizePlayerListLockPeriods({
      lock_enabled: true,
      periods: [
        { from: "2026-01-15", until: "2026-06-30" },
        { from: "2025-09-01", until: "2025-12-24" },
      ],
    });
    expect(periods).toEqual([
      { from: "2025-09-01", until: "2025-12-24" },
      { from: "2026-01-15", until: "2026-06-30" },
    ]);
  });

  it("valt terug op legacy lock_from_date / lock_until_date", () => {
    expect(
      normalizePlayerListLockPeriods({
        lock_enabled: true,
        lock_from_date: "2025-09-01",
        lock_until_date: null,
      }),
    ).toEqual([{ from: "2025-09-01", until: null }]);
  });

  it("negeert periodes zonder from", () => {
    expect(
      normalizePlayerListLockPeriods({
        periods: [{ from: "", until: "2025-12-01" }, { from: "2025-09-01", until: null }],
      }),
    ).toEqual([{ from: "2025-09-01", until: null }]);
  });
});

describe("toPlayerListLockSettingValue", () => {
  it("schrijft periods en legacy mirrors van eerste periode", () => {
    expect(
      toPlayerListLockSettingValue(true, [
        { from: "2026-01-15", until: "2026-06-30" },
        { from: "2025-09-01", until: "2025-12-24" },
      ]),
    ).toEqual({
      lock_enabled: true,
      periods: [
        { from: "2025-09-01", until: "2025-12-24" },
        { from: "2026-01-15", until: "2026-06-30" },
      ],
      lock_from_date: "2025-09-01",
      lock_until_date: "2025-12-24",
    });
  });
});

describe("multi-periode schedule status", () => {
  const setting = {
    lock_enabled: true,
    periods: [
      { from: "2025-09-01", until: "2025-12-24" },
      { from: "2026-01-15", until: "2026-06-30" },
    ],
  };

  it("is actief in eerste periode", () => {
    expect(getPlayerListLockScheduleStatus(setting, day("2025-10-01"))).toBe("active");
    expect(isSettingsPlayerListLocked(setting, day("2025-10-01"))).toBe(true);
  });

  it("is niet vergrendeld in de gap tussen periodes", () => {
    expect(getPlayerListLockScheduleStatus(setting, day("2026-01-05"))).toBe("scheduled");
    expect(isSettingsPlayerListLocked(setting, day("2026-01-05"))).toBe(false);
  });

  it("is actief in tweede periode", () => {
    expect(getPlayerListLockScheduleStatus(setting, day("2026-03-01"))).toBe("active");
  });

  it("is gepland vóór de eerste periode", () => {
    expect(getPlayerListLockScheduleStatus(setting, day("2025-08-01"))).toBe("scheduled");
  });

  it("is verlopen na alle periodes", () => {
    expect(getPlayerListLockScheduleStatus(setting, day("2026-07-01"))).toBe("expired");
  });

  it("vindt actieve en volgende periode", () => {
    expect(findActiveLockPeriod(normalizePlayerListLockPeriods(setting), day("2025-10-01"))).toEqual({
      from: "2025-09-01",
      until: "2025-12-24",
    });
    expect(findNextLockPeriod(normalizePlayerListLockPeriods(setting), day("2026-01-05"))).toEqual({
      from: "2026-01-15",
      until: "2026-06-30",
    });
  });
});

describe("validatePlayerListLockPeriods", () => {
  it("vereist minstens één startdatum als enabled", () => {
    expect(validatePlayerListLockPeriods(true, [{ from: "", until: null }])).toMatch(/minstens/i);
  });

  it("valideert eind vóór start", () => {
    expect(
      validatePlayerListLockPeriods(true, [{ from: "2025-12-01", until: "2025-11-01" }]),
    ).toMatch(/Einddatum/i);
  });

  it("accepteert geldige periodes", () => {
    expect(
      validatePlayerListLockPeriods(true, [
        { from: "2025-09-01", until: "2025-12-24" },
        { from: "2026-01-15", until: "2026-06-30" },
      ]),
    ).toBeNull();
  });
});

describe("resolveLockMessageDates", () => {
  it("gebruikt actieve periode", () => {
    expect(
      resolveLockMessageDates(
        {
          lock_enabled: true,
          periods: [
            { from: "2025-09-01", until: "2025-12-24" },
            { from: "2026-01-15", until: "2026-06-30" },
          ],
        },
        day("2025-10-01"),
      ),
    ).toEqual({ from: "2025-09-01", until: "2025-12-24" });
  });
});
