import { describe, expect, it } from "vitest";
import {
  isSeasonTopUpDeposit,
  seasonTopUpDepositCutoffDate,
} from "./teamCostCategories";

describe("season top-up deposits", () => {
  it("uses 1 juni van het seizoenseinde als cutoff", () => {
    expect(seasonTopUpDepositCutoffDate(2025)).toBe("2026-06-01");
  });

  it("herkent bijstortingen vanaf 1 juni", () => {
    expect(
      isSeasonTopUpDeposit(
        {
          team_id: 1,
          amount: 516,
          transaction_type: "deposit",
          transaction_date: "2026-06-15",
          cost_settings: { category: "deposit", name: "Storting" },
        },
        2025,
      ),
    ).toBe(true);
  });

  it("laat startkapitaal-stortingen in het begin van het seizoen meetellen", () => {
    expect(
      isSeasonTopUpDeposit(
        {
          team_id: 1,
          amount: 600,
          transaction_type: "deposit",
          transaction_date: "2025-09-02",
          cost_settings: { category: "deposit", name: "Storting" },
        },
        2025,
      ),
    ).toBe(false);
  });
});
