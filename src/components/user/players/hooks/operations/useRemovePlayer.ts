
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
        .select('player_id, first_name, last_name, is_active, team_id, birth_date')
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

      if (!currentPlayer.is_active) {
        toast({
          title: "Speler al verwijderd",
          description: "Deze speler is al gedeactiveerd",
          variant: "destructive",
        });
        return false;
      }

      // Perform the removal in one go
      const { data: removeResult, error: removeError } = await supabase
        .from('players')
        .update({ is_active: false })
        .eq('player_id', playerId)
        .select('*');

      if (removeError) {
        toast({
          title: "Database fout",
          description: `Kon speler niet verwijderen: ${removeError.message}`,
          variant: "destructive",
        });
        return false;
      }

      // Final check
      const { data: finalCheck, error: finalError } = await supabase
        .from('players')
        .select('player_id, is_active')
        .eq('player_id', playerId)
        .single();

      if (finalError || typeof finalCheck?.is_active !== "boolean" || finalCheck.is_active !== false) {
        toast({
          title: "Verificatie mislukt",
          description: "Speler lijkt niet gedeactiveerd te zijn.",
          variant: "destructive",
        });
        return false;
      }

      // Only one refresh
      await refreshPlayers();

      toast({
        title: "Speler verwijderd",
        description: `${currentPlayer.first_name} ${currentPlayer.last_name} is verwijderd uit het team`,
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
