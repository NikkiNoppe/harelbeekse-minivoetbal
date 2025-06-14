
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { delay, refreshWithRetry } from "../utils/playerCRUDUtils";

export const useRemovePlayer = (refreshPlayers: () => Promise<void>) => {
  const { toast } = useToast();

  const removePlayer = async (playerId: number) => {
    try {
      console.log('🗑️ Starting player removal for ID:', playerId, 'at:', new Date().toISOString());

      // First check if player exists and is active
      const { data: currentPlayer, error: fetchError } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, is_active')
        .eq('player_id', playerId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching player for removal:', fetchError);
        toast({
          title: "Fout bij ophalen speler",
          description: `Kon spelergegevens niet ophalen: ${fetchError.message}`,
          variant: "destructive",
        });
        return false;
      }

      if (!currentPlayer) {
        console.error('❌ Player not found for removal:', playerId);
        toast({
          title: "Speler niet gevonden",
          description: "De speler bestaat niet meer",
          variant: "destructive",
        });
        return false;
      }

      if (!currentPlayer.is_active) {
        console.warn('⚠️ Player already inactive:', playerId);
        toast({
          title: "Speler al verwijderd",
          description: "Deze speler is al gedeactiveerd",
          variant: "destructive",
        });
        return false;
      }

      const { data, error } = await supabase
        .from('players')
        .update({ is_active: false })
        .eq('player_id', playerId)
        .select();
      
      if (error) {
        console.error('❌ Supabase error removing player:', error);
        toast({
          title: "Database fout",
          description: `Kon speler niet verwijderen: ${error.message}`,
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Player removed successfully at:', new Date().toISOString(), data);
      
      // Add delay before refresh
      console.log('⏱️ Waiting 500ms for database transaction to commit...');
      await delay(500);
      
      // Enhanced refresh with retry logic
      await refreshWithRetry(refreshPlayers);
      
      toast({
        title: "Speler verwijderd",
        description: `${currentPlayer.first_name} ${currentPlayer.last_name} is verwijderd uit het team`,
      });
      
      return true;
    } catch (error) {
      console.error('💥 Error removing player:', error);
      toast({
        title: "Fout bij verwijderen",
        description: error instanceof Error ? error.message : "Er is een fout opgetreden bij het verwijderen van de speler.",
        variant: "destructive",
      });
      return false;
    }
  };

  return { removePlayer };
};
