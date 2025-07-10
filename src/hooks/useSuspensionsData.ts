import { useQuery, useQueryClient } from "@tanstack/react-query";
import { suspensionService, PlayerCard, Suspension } from "@/services/suspensionService";
import { useToast } from "@/hooks/use-toast";

export interface SuspensionStats {
  totalSuspensions: number;
  activeSuspensions: number;
  pendingSuspensions: number;
  completedSuspensions: number;
}

export const useSuspensionsData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const playerCardsQuery = useQuery({
    queryKey: ['playerCards'],
    queryFn: suspensionService.getPlayerCards,
    staleTime: 2 * 60 * 1000, // 2 minutes - player cards can change during matches
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });

  const suspensionsQuery = useQuery({
    queryKey: ['suspensions'],
    queryFn: suspensionService.getActiveSuspensions,
    staleTime: 2 * 60 * 1000, // 2 minutes - suspensions can be updated
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });

  // Process player cards to get top players with most yellow cards
  const topYellowCardPlayers = playerCardsQuery.data
    ?.filter(player => player.yellowCards > 0)
    ?.sort((a, b) => b.yellowCards - a.yellowCards)
    ?.slice(0, 10) || [];

  // Calculate suspension statistics
  const suspensionStats: SuspensionStats = {
    totalSuspensions: suspensionsQuery.data?.length || 0,
    activeSuspensions: suspensionsQuery.data?.filter(s => s.status === 'active').length || 0,
    pendingSuspensions: suspensionsQuery.data?.filter(s => s.status === 'pending').length || 0,
    completedSuspensions: suspensionsQuery.data?.filter(s => s.status === 'completed').length || 0
  };

  const handleRefresh = async () => {
    try {
      await suspensionService.refreshPlayerCards();
      queryClient.invalidateQueries({ queryKey: ['playerCards'] });
      queryClient.invalidateQueries({ queryKey: ['suspensions'] });
      toast({
        title: "Vernieuwd",
        description: "Kaarten en schorsingen zijn bijgewerkt."
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het vernieuwen.",
        variant: "destructive"
      });
    }
  };

  return {
    // Player cards data
    playerCards: playerCardsQuery.data,
    playerCardsLoading: playerCardsQuery.isLoading,
    playerCardsError: playerCardsQuery.error,
    
    // Suspensions data
    suspensions: suspensionsQuery.data,
    suspensionsLoading: suspensionsQuery.isLoading,
    suspensionsError: suspensionsQuery.error,
    
    // Processed data
    topYellowCardPlayers,
    suspensionStats,
    
    // Combined states
    isLoading: playerCardsQuery.isLoading || suspensionsQuery.isLoading,
    hasError: !!playerCardsQuery.error || !!suspensionsQuery.error,
    
    // Actions
    handleRefresh,
    refetchPlayerCards: playerCardsQuery.refetch,
    refetchSuspensions: suspensionsQuery.refetch
  };
}; 