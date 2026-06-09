export interface TeamCostTransaction {
  team_id: number;
  amount: number | string | null | undefined;
  transaction_type?: string | null;
  cost_settings?: {
    name?: string | null;
    category?: string | null;
    amount?: number | string | null;
  } | null;
  description?: string | null;
}

export interface TeamFinancesSummary {
  startCapital: number;
  fieldCosts: number;
  refereeCosts: number;
  adminCosts: number;
  fines: number;
  adjustments: number;
  currentBalance: number;
}

function costLabel(transaction: TeamCostTransaction): string {
  return (transaction.cost_settings?.name || transaction.description || "").toLowerCase();
}

export function costCategory(transaction: TeamCostTransaction): string {
  return (transaction.cost_settings?.category || transaction.transaction_type || "")
    .toLowerCase()
    .trim();
}

function amountValue(transaction: TeamCostTransaction, absolute = false): number {
  const value = resolveTeamCostAmount(transaction);
  return absolute ? Math.abs(value) : value;
}

/** Bedrag uit team_costs rij, met fallback naar costs.amount (zoals elders in de app). */
export function resolveTeamCostAmount(transaction: TeamCostTransaction): number {
  if (transaction.amount !== null && transaction.amount !== undefined && transaction.amount !== "") {
    return Number(transaction.amount);
  }
  return Number(transaction.cost_settings?.amount ?? 0);
}

export interface DatedTeamCostTransaction extends TeamCostTransaction {
  transaction_date: string;
}

export interface PeriodCostTotals {
  totalFieldCosts: number;
  totalRefereeCosts: number;
  totalAdminCosts: number;
  totalFines: number;
}

function transactionInReportPeriod(
  transactionDate: string,
  seasonYear: number,
  selectedMonth: number | null,
): boolean {
  const txDate = transactionDate.slice(0, 10);

  if (selectedMonth === null) {
    return txDate >= `${seasonYear}-07-01` && txDate <= `${seasonYear + 1}-06-30`;
  }

  const year = selectedMonth <= 12 ? seasonYear : seasonYear + 1;
  const month = selectedMonth <= 12 ? selectedMonth : selectedMonth - 12;
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return txDate >= monthStart && txDate <= monthEnd;
}

/** Sommeert veld/scheids/admin/boetes voor een seizoen of maand — zelfde logica als teamoverzicht. */
export function computePeriodCostTotals(
  transactions: DatedTeamCostTransaction[],
  seasonYear: number,
  selectedMonth: number | null,
): PeriodCostTotals {
  const filtered = transactions.filter((t) =>
    transactionInReportPeriod(t.transaction_date, seasonYear, selectedMonth),
  );

  return {
    totalFieldCosts: filtered
      .filter(isFieldCostTransaction)
      .reduce((sum, t) => sum + amountValue(t, true), 0),
    totalRefereeCosts: filtered
      .filter(isRefereeCostTransaction)
      .reduce((sum, t) => sum + amountValue(t, true), 0),
    totalAdminCosts: filtered
      .filter(isAdminCostTransaction)
      .reduce((sum, t) => sum + amountValue(t, true), 0),
    totalFines: filtered
      .filter((t) => costCategory(t) === "penalty")
      .reduce((sum, t) => sum + amountValue(t, true), 0),
  };
}

export function isFieldCostTransaction(transaction: TeamCostTransaction): boolean {
  if (costCategory(transaction) !== "match_cost") return false;
  const label = costLabel(transaction);
  return label.includes("veld") || label.includes("field");
}

export function isRefereeCostTransaction(transaction: TeamCostTransaction): boolean {
  if (costCategory(transaction) !== "match_cost") return false;
  const label = costLabel(transaction);
  return label.includes("scheids");
}

export function isAdminCostTransaction(transaction: TeamCostTransaction): boolean {
  if (costCategory(transaction) !== "match_cost") return false;
  const label = costLabel(transaction);
  return label.includes("administratie") || label.includes("admin");
}

function isUncategorizedMatchCost(transaction: TeamCostTransaction): boolean {
  return (
    costCategory(transaction) === "match_cost" &&
    !isFieldCostTransaction(transaction) &&
    !isRefereeCostTransaction(transaction) &&
    !isAdminCostTransaction(transaction)
  );
}

export function computeCurrentBalance(transactions: TeamCostTransaction[]): number {
  return transactions.reduce((balance, transaction) => {
    const category = costCategory(transaction);
    if (category === "deposit") {
      return balance + amountValue(transaction, true);
    }
    if (category === "adjustment" || category === "other") {
      return balance + amountValue(transaction);
    }
    return balance - amountValue(transaction, true);
  }, 0);
}

export function computeTeamFinances(
  teamId: number,
  transactions: TeamCostTransaction[],
): TeamFinancesSummary {
  const teamTransactions = transactions.filter((t) => t.team_id === teamId);

  const startCapital = teamTransactions
    .filter((t) => costCategory(t) === "deposit")
    .reduce((sum, t) => sum + amountValue(t, true), 0);

  const uncategorizedMatchCosts = teamTransactions
    .filter(isUncategorizedMatchCost)
    .reduce((sum, t) => sum + amountValue(t, true), 0);

  const fieldCosts =
    teamTransactions
      .filter(isFieldCostTransaction)
      .reduce((sum, t) => sum + amountValue(t, true), 0) + uncategorizedMatchCosts;

  const refereeCosts = teamTransactions
    .filter(isRefereeCostTransaction)
    .reduce((sum, t) => sum + amountValue(t, true), 0);

  const adminCosts = teamTransactions
    .filter(isAdminCostTransaction)
    .reduce((sum, t) => sum + amountValue(t, true), 0);

  const fines = teamTransactions
    .filter((t) => costCategory(t) === "penalty")
    .reduce((sum, t) => sum + amountValue(t, true), 0);

  const adjustments = teamTransactions
    .filter((t) => costCategory(t) === "adjustment" || costCategory(t) === "other")
    .reduce((sum, t) => sum + amountValue(t), 0);

  const currentBalance = computeCurrentBalance(teamTransactions);

  return {
    startCapital,
    fieldCosts,
    refereeCosts,
    adminCosts,
    fines,
    adjustments,
    currentBalance,
  };
}
