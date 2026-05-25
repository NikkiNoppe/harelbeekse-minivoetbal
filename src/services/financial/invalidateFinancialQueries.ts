import type { QueryClient } from "@tanstack/react-query";

export async function invalidateFinancialTransactionQueries(
  queryClient: QueryClient,
  teamId?: number,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["all-team-transactions"] }),
    queryClient.invalidateQueries({ queryKey: ["team-transactions"] }),
    ...(teamId
      ? [queryClient.invalidateQueries({ queryKey: ["team-transactions", teamId] })]
      : []),
  ]);
}
