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
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};

export const useArchiveCompetition = () => {
  const qc = useQueryClient();
  const { organizationId } = useOrgQueryScope();

  return useMutation({
    mutationFn: ({ label, standings }: { label: string; standings: ArchivedStanding[] }) =>
      archiveService.upsertCompetition(label, standings),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ARCHIVES_KEY });
      void qc.invalidateQueries({
        queryKey: withOrgQueryKey(ARCHIVES_KEY, organizationId),
      });
    },
  });
};

export const useArchiveCup = () => {
  const qc = useQueryClient();
  const { organizationId } = useOrgQueryScope();

  return useMutation({
    mutationFn: ({ label, cup }: { label: string; cup: ArchivedCupWinner }) =>
      archiveService.upsertCup(label, cup),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ARCHIVES_KEY });
      void qc.invalidateQueries({
        queryKey: withOrgQueryKey(ARCHIVES_KEY, organizationId),
      });
    },
  });
};

export const useArchivePlayoff = () => {
  const qc = useQueryClient();
  const { organizationId } = useOrgQueryScope();

  return useMutation({
    mutationFn: ({ label, playoff }: { label: string; playoff: ArchivedPlayoff }) =>
      archiveService.upsertPlayoff(label, playoff),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ARCHIVES_KEY });
      void qc.invalidateQueries({
        queryKey: withOrgQueryKey(ARCHIVES_KEY, organizationId),
      });
    },
  });
};

export const useDeleteArchive = () => {
  const qc = useQueryClient();
  const { organizationId } = useOrgQueryScope();

  return useMutation({
    mutationFn: (archiveId: number) => archiveService.deleteArchive(archiveId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ARCHIVES_KEY });
      void qc.invalidateQueries({
        queryKey: withOrgQueryKey(ARCHIVES_KEY, organizationId),
      });
    },
  });
};
