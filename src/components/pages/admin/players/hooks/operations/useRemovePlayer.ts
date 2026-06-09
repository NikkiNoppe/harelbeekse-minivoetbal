
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";
import { useToast } from "@/hooks/use-toast";
import { refreshWithRetry } from "../utils/playerCRUDUtils";
import { fetchPlayersForSession } from "@/services/core/playersSessionFetch";

export const useRemovePlayer = (refreshPlayers: () => Promise<void>) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const { toast } = useToast();

  const removePlayer = async (playerId: number) => {
    if (isRemoving) return false;
    setIsRemoving(true);

    try {
      const players = await fetchPlayersForSession(null);
      const currentPlayer = players.find((p) => p.player_id === playerId);

      if (!currentPlayer) {
        toast({
          title: "Speler niet gevonden",
          description: "De speler bestaat niet meer",
          variant: "destructive",
        });
        return false;
      }

      const { data, error } = await supabase.rpc("delete_player_for_session", {
        ...getRpcSessionArgs(),
        p_player_id: playerId,
      });

      if (error) {
        toast({
          title: "Database fout",
          description: `Kon speler niet verwijderen: ${error.message}`,
          variant: "destructive",
        });
        return false;
      }

      const result = Array.isArray(data) ? data[0] : data;
      if (!result?.success) {
        toast({
          title: "Verwijderen mislukt",
          description: result?.message || "Kon speler niet verwijderen",
          variant: "destructive",
        });
        return false;
      }

      await refreshWithRetry(refreshPlayers);

      toast({
        title: "Speler verwijderd",
        description: `${currentPlayer.first_name} ${currentPlayer.last_name} is permanent verwijderd`,
      });

      return true;
    } catch (error) {
      console.error("Error removing player:", error);
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
