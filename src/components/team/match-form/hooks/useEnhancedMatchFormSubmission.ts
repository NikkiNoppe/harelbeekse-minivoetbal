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
    const updateData = {
      homeScore: matchData.homeScore,
      awayScore: matchData.awayScore,
      referee: matchData.referee,
      refereeNotes: matchData.refereeNotes,
      matchday: matchData.matchday,
      location: matchData.location,
      date: matchData.date,
      time: matchData.time,
      homePlayers: matchData.homePlayers,
      awayPlayers: matchData.awayPlayers,
      isCompleted: matchData.isCompleted,
      isLocked: matchData.isLocked
    };

    // Validate required data
    if (!matchData.matchId || isNaN(matchData.matchId)) {
      const errorMsg = "Ongeldige wedstrijd ID";
      toast({
        title: "Validatie Fout",
        description: errorMsg,
        variant: "destructive"
      });
      return { success: false, error: errorMsg };
    }

    setIsSubmitting(true);
    
    try {
      const result = await enhancedMatchService.updateMatch(matchData.matchId, updateData, isAdmin, userRole);

      if (result.success) {
        // Refresh queries after successful update
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['teamMatches'] }),
          queryClient.invalidateQueries({ queryKey: ['matches'] }),
          queryClient.invalidateQueries({ queryKey: ['matchData'] }),
          queryClient.invalidateQueries({ queryKey: ['match', matchData.matchId] })
        ]);

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
        description: `Fout bij opslaan wedstrijd: ${errorMessage}`,
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
        // Refresh queries after successful lock
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['teamMatches'] }),
          queryClient.invalidateQueries({ queryKey: ['matches'] }),
          queryClient.invalidateQueries({ queryKey: ['match', matchId] })
        ]);

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
        // Refresh queries after successful unlock
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['teamMatches'] }),
          queryClient.invalidateQueries({ queryKey: ['matches'] }),
          queryClient.invalidateQueries({ queryKey: ['match', matchId] })
        ]);

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
