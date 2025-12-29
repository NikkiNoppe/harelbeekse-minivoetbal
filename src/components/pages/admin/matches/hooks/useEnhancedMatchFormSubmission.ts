import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { enhancedMatchService } from "@/services/match";
import { MatchFormData } from "../types";
import { useToast } from "@/hooks/use-toast";

export const useEnhancedMatchFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitMatchForm = async (matchData: MatchFormData, isAdmin: boolean = false, userRole?: string) => {
    console.log('🟡 [useEnhancedMatchFormSubmission] Starting submitMatchForm');
    console.log('🟡 [useEnhancedMatchFormSubmission] Match data:', matchData);
    console.log('🟡 [useEnhancedMatchFormSubmission] isAdmin:', isAdmin, 'userRole:', userRole);
    
    // Keep all player slots (including empty ones) to preserve positions
    // This ensures that when data is loaded, the positions are maintained
    const homePlayersToSave = matchData.homePlayers || [];
    const awayPlayersToSave = matchData.awayPlayers || [];
    
    console.log('🟡 [useEnhancedMatchFormSubmission] Players to save - Home:', homePlayersToSave.length, 'Away:', awayPlayersToSave.length);
    console.log('🟡 [useEnhancedMatchFormSubmission] Home players data:', homePlayersToSave.map(p => ({ playerId: p?.playerId, playerName: p?.playerName, jerseyNumber: p?.jerseyNumber })));
    console.log('🟡 [useEnhancedMatchFormSubmission] Away players data:', awayPlayersToSave.map(p => ({ playerId: p?.playerId, playerName: p?.playerName, jerseyNumber: p?.jerseyNumber })));
    
    const processedRefereeNotes = matchData.refereeNotes !== undefined && matchData.refereeNotes !== null ? matchData.refereeNotes : "";
    
    console.log('🟡 [useEnhancedMatchFormSubmission] Processing referee notes:', {
      original: matchData.refereeNotes,
      originalType: typeof matchData.refereeNotes,
      originalLength: matchData.refereeNotes?.length || 0,
      isUndefined: matchData.refereeNotes === undefined,
      isNull: matchData.refereeNotes === null,
      processed: processedRefereeNotes,
      processedType: typeof processedRefereeNotes,
      processedLength: processedRefereeNotes?.length || 0
    });
    
    const updateData = {
      homeScore: matchData.homeScore,
      awayScore: matchData.awayScore,
      referee: matchData.referee,
      refereeNotes: processedRefereeNotes,
      matchday: matchData.matchday,
      location: matchData.location,
      date: matchData.date,
      time: matchData.time,
      homePlayers: homePlayersToSave,
      awayPlayers: awayPlayersToSave,
      isCompleted: matchData.isCompleted,
      isLocked: matchData.isLocked
    };
    
    console.log('🟡 [useEnhancedMatchFormSubmission] Final updateData:', {
      matchId: matchData.matchId,
      refereeNotes: updateData.refereeNotes,
      refereeNotesType: typeof updateData.refereeNotes,
      refereeNotesLength: updateData.refereeNotes?.length || 0
    });

    // Validate required data
    console.log('🟡 [useEnhancedMatchFormSubmission] Validating match ID...');
    if (!matchData.matchId || isNaN(matchData.matchId)) {
      console.error('❌ [useEnhancedMatchFormSubmission] Invalid match ID');
      const errorMsg = "Ongeldige wedstrijd ID";
      toast({
        title: "Validatie Fout",
        description: errorMsg,
        variant: "destructive"
      });
      return { success: false, error: errorMsg };
    }
    console.log('✅ [useEnhancedMatchFormSubmission] Match ID validated');

    // Validate player data if provided - only check selected players (with playerId)
    console.log('🟡 [useEnhancedMatchFormSubmission] Validating player data...');
    if (matchData.homePlayers && Array.isArray(matchData.homePlayers)) {
      const selectedHomePlayers = matchData.homePlayers.filter(p => p.playerId !== null);
      const invalidHomePlayers = selectedHomePlayers.filter(p => !p.playerId || !p.playerName);
      if (invalidHomePlayers.length > 0) {
        console.error('❌ [useEnhancedMatchFormSubmission] Invalid home players:', invalidHomePlayers);
        const errorMsg = "Ongeldige spelergegevens voor thuisteam";
        toast({
          title: "Validatie Fout", 
          description: errorMsg,
          variant: "destructive"
        });
        return { success: false, error: errorMsg };
      }
    }

    if (matchData.awayPlayers && Array.isArray(matchData.awayPlayers)) {
      const selectedAwayPlayers = matchData.awayPlayers.filter(p => p.playerId !== null);
      const invalidAwayPlayers = selectedAwayPlayers.filter(p => !p.playerId || !p.playerName);
      if (invalidAwayPlayers.length > 0) {
        console.error('❌ [useEnhancedMatchFormSubmission] Invalid away players:', invalidAwayPlayers);
        const errorMsg = "Ongeldige spelergegevens voor uitteam";
        toast({
          title: "Validatie Fout",
          description: errorMsg, 
          variant: "destructive"
        });
        return { success: false, error: errorMsg };
      }
    }
    console.log('✅ [useEnhancedMatchFormSubmission] Player data validated');

    setIsSubmitting(true);
    
    try {
      console.log('🟡 [useEnhancedMatchFormSubmission] Calling enhancedMatchService.updateMatch...');
      // Optimistic update for better UX
      queryClient.setQueryData(['match', matchData.matchId], (oldData: any) => ({
        ...oldData,
        ...updateData
      }));

      const result = await enhancedMatchService.updateMatch(matchData.matchId, updateData, isAdmin, userRole);
      console.log('🟡 [useEnhancedMatchFormSubmission] Service response:', result);

      if (result.success) {
        console.log('✅ [useEnhancedMatchFormSubmission] Service call succeeded');
        
        // IMMEDIATE: Show success toast to user
        toast({
          title: "Succesvol",
          description: result.message
        });

        // DEFERRED: Query invalidation runs after user sees success (500ms delay)
        // This ensures UI feels snappy while data refreshes in background
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['teamMatches'] });
          queryClient.invalidateQueries({ queryKey: ['match', matchData.matchId] });
          console.log('🔄 [useEnhancedMatchFormSubmission] Deferred query invalidation complete');
        }, 500);

        return { success: true };
      } else {
        console.error('❌ [useEnhancedMatchFormSubmission] Service returned error:', result.message);
        // Revert optimistic update on failure
        queryClient.invalidateQueries({ queryKey: ['match', matchData.matchId] });
        
        toast({
          title: "Fout",
          description: result.message,
          variant: "destructive"
        });
        return { success: false, error: result.message };
      }
    } catch (error: any) {
      console.error('❌ [useEnhancedMatchFormSubmission] ERROR in submitMatchForm:', error);
      console.error('❌ [useEnhancedMatchFormSubmission] Error type:', typeof error);
      console.error('❌ [useEnhancedMatchFormSubmission] Error details:', {
        name: error?.name || 'Unknown',
        message: error?.message || String(error),
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
        fullError: error
      });
      
      // Revert optimistic update on failure
      queryClient.invalidateQueries({ queryKey: ['match', matchData.matchId] });
      
      const errorMessage = error?.message || error?.code || 'Onbekende fout';
      const errorDetails = error?.details ? ` (${JSON.stringify(error.details)})` : '';
      const errorCode = error?.code ? ` [${error.code}]` : '';
      
      toast({
        title: "Fout bij opslaan",
        description: `${errorMessage}${errorCode}${errorDetails}`,
        variant: "destructive"
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  const lockMatch = async (matchId: number) => {
    if (!matchId || isNaN(matchId)) {
      const errorMsg = "Ongeldige wedstrijd ID voor vergrendeling";
      toast({
        title: "Validatie Fout",
        description: errorMsg,
        variant: "destructive"
      });
      return { success: false, error: errorMsg };
    }

    try {
      const result = await enhancedMatchService.lockMatch(matchId);

      if (result.success) {
        // Subtiele strategie: 1 invalidatie + refetch enkel voor actieve queries
        await queryClient.invalidateQueries({ queryKey: ['teamMatches'] });
        await queryClient.refetchQueries({ queryKey: ['teamMatches'], type: 'active' });

        toast({
          title: "Succesvol",
          description: result.message
        });
        return { success: true };
      } else {
        toast({
          title: "Fout",
          description: result.message,
          variant: "destructive"
        });
        return { success: false, error: result.message };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
      toast({
        title: "Fout",
        description: `Fout bij vergrendelen wedstrijd: ${errorMessage}`,
        variant: "destructive"
      });
      return { success: false, error: errorMessage };
    }
  };

  const unlockMatch = async (matchId: number) => {
    if (!matchId || isNaN(matchId)) {
      const errorMsg = "Ongeldige wedstrijd ID voor ontgrendeling";
      toast({
        title: "Validatie Fout",
        description: errorMsg,
        variant: "destructive"
      });
      return { success: false, error: errorMsg };
    }

    try {
      const result = await enhancedMatchService.unlockMatch(matchId);

      if (result.success) {
        // Subtiele strategie: 1 invalidatie + refetch enkel voor actieve queries
        await queryClient.invalidateQueries({ queryKey: ['teamMatches'] });
        await queryClient.refetchQueries({ queryKey: ['teamMatches'], type: 'active' });

        toast({
          title: "Succesvol",
          description: result.message
        });
        return { success: true };
      } else {
        toast({
          title: "Fout",
          description: result.message,
          variant: "destructive"
        });
        return { success: false, error: result.message };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
      toast({
        title: "Fout",
        description: `Fout bij ontgrendelen wedstrijd: ${errorMessage}`,
        variant: "destructive"
      });
      return { success: false, error: errorMessage };
    }
  };

  return {
    isSubmitting,
    submitMatchForm,
    lockMatch,
    unlockMatch
  };
};
