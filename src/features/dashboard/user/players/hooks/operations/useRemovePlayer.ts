
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { delay, refreshWithRetry } from "../utils/playerCRUDUtils";

export const useRemovePlayer = (refreshPlayers: () => Promise<void>) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const { toast } = useToast();

  const removePlayer = async (playerId: number) => {
    if (isRemoving) return false;
    setIsRemoving(true);

    try {
      // Fetch player for context
      const { data: currentPlayer, error: fetchError } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, team_id, birth_date')
        .eq('player_id', playerId)
        .single();

      if (fetchError) {
        toast({
          title: "Fout bij ophalen speler",
          description: `Kon spelergegevens niet ophalen: ${fetchError.message}`,
          variant: "destructive",
        });
        return false;
      }

      if (!currentPlayer) {
        toast({
          title: "Speler niet gevonden",
          description: "De speler bestaat niet meer",
          variant: "destructive",
        });
        return false;
      }

      // Perform the real delete
      const { error: deleteError } = await supabase
        .from('players')
        .delete()
        .eq('player_id', playerId);

      if (deleteError) {
        toast({
          title: "Database fout",
          description: `Kon speler niet verwijderen: ${deleteError.message}`,
          variant: "destructive",
        });
        return false;
      }

      // Verify deletion
      const { data: verifyCheck, error: verifyError } = await supabase
        .from('players')
        .select('player_id')
        .eq('player_id', playerId)
        .maybeSingle();

      if (verifyError) {
        console.error('Error verifying deletion:', verifyError);
      }

      if (verifyCheck) {
        toast({
          title: "Verificatie mislukt",
          description: "Speler lijkt niet verwijderd te zijn.",
          variant: "destructive",
        });
        return false;
      }

      // Refresh player list
      await refreshPlayers();

      toast({
        title: "Speler verwijderd",
        description: `${currentPlayer.first_name} ${currentPlayer.last_name} is permanent verwijderd`,
      });

      return true;
    } catch (error) {
      toast({
        title: "Fout bij verwijderen",
        description: error instanceof Error ? error.message : "Er is een fout opgetreden bij het verwijderen van de speler.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsRemoving(false);
    }
  };

  return { removePlayer, isRemoving };
};
