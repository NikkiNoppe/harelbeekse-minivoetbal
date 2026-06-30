import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveService, ArchivedStanding, ArchivedCupWinner, ArchivedPlayoff } from '@/services/archiveService';
import { useOrgQueryScope } from '@/hooks/useOrganization';
import { withOrgQueryKey } from '@/lib/orgQueryKey';

export const ARCHIVES_KEY = ['season-archives'] as const;

export const useArchives = () => {
  const { organizationId, orgQueryEnabled } = useOrgQueryScope();

  return useQuery({
    queryKey: withOrgQueryKey(ARCHIVES_KEY, organizationId),
    queryFn: () => archiveService.listArchives(organizationId!),
    enabled: orgQueryEnabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useArchiveCompetition = () => {
  const qc = useQueryClient();
  const { organizationId } = useOrgQueryScope();

  return useMutation({
    mutationFn: ({ label, standings }: { label: string; standings: ArchivedStanding[] }) =>
      archiveService.upsertCompetition(label, standings),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: withOrgQueryKey(ARCHIVES_KEY, organizationId),
      }),
  });
};

export const useArchiveCup = () => {
  const qc = useQueryClient();
  const { organizationId } = useOrgQueryScope();

  return useMutation({
    mutationFn: ({ label, cup }: { label: string; cup: ArchivedCupWinner }) =>
      archiveService.upsertCup(label, cup),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: withOrgQueryKey(ARCHIVES_KEY, organizationId),
      }),
  });
};

export const useArchivePlayoff = () => {
  const qc = useQueryClient();
  const { organizationId } = useOrgQueryScope();

  return useMutation({
    mutationFn: ({ label, playoff }: { label: string; playoff: ArchivedPlayoff }) =>
      archiveService.upsertPlayoff(label, playoff),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: withOrgQueryKey(ARCHIVES_KEY, organizationId),
      }),
  });
};
