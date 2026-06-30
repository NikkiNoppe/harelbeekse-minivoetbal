/** Voeg organizationId toe aan TanStack Query keys (tenant-cache-scheiding). */
export function withOrgQueryKey<T extends readonly unknown[]>(
  baseKey: T,
  organizationId: number | undefined,
): readonly [...T, number | 'pending'] {
  return [...baseKey, organizationId ?? 'pending'] as const;
}
