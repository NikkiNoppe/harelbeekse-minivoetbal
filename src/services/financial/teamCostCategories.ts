export interface TeamCostTransaction {
  team_id: number;
  amount: number | string | null | undefined;
  cost_settings?: {
    name?: string | null;
    category?: string | null;
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

function costCategory(transaction: TeamCostTransaction): string {
  return (transaction.cost_settings?.category || "").toLowerCase();
}

function amountValue(transaction: TeamCostTransaction, absolute = false): number {
  const value = Number(transaction.amount ?? 0);
  return absolute ? Math.abs(value) : value;
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

export function computeTeamFinances(
  teamId: number,
  transactions: TeamCostTransaction[],
): TeamFinancesSummary {
  const teamTransactions = transactions.filter((t) => t.team_id === teamId);

  const startCapital = teamTransactions
    .filter((t) => costCategory(t) === "deposit")
    .reduce((sum, t) => sum + amountValue(t), 0);

  const fieldCosts = teamTransactions
    .filter(isFieldCostTransaction)
    .reduce((sum, t) => sum + amountValue(t, true), 0);

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

  const currentBalance = startCapital - fieldCosts - refereeCosts - adminCosts - fines + adjustments;

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
