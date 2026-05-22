import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveService, ArchivedStanding, ArchivedCupWinner, ArchivedPlayoff } from '@/services/archiveService';

export const ARCHIVES_KEY = ['season-archives'] as const;

export const useArchives = () =>
  useQuery({
    queryKey: ARCHIVES_KEY,
    queryFn: () => archiveService.listArchives(),
    staleTime: 5 * 60 * 1000,
  });

export const useArchiveCompetition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ label, standings }: { label: string; standings: ArchivedStanding[] }) =>
      archiveService.upsertCompetition(label, standings),
    onSuccess: () => qc.invalidateQueries({ queryKey: ARCHIVES_KEY }),
  });
};

export const useArchiveCup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ label, cup }: { label: string; cup: ArchivedCupWinner }) =>
      archiveService.upsertCup(label, cup),
    onSuccess: () => qc.invalidateQueries({ queryKey: ARCHIVES_KEY }),
  });
};

export const useArchivePlayoff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ label, playoff }: { label: string; playoff: ArchivedPlayoff }) =>
      archiveService.upsertPlayoff(label, playoff),
    onSuccess: () => qc.invalidateQueries({ queryKey: ARCHIVES_KEY }),
  });
};
