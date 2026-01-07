
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { delay, refreshWithRetry } from "../utils/playerCRUDUtils";
import { withUserContext } from "@/lib/supabaseUtils";

export const useRemovePlayer = (refreshPlayers: () => Promise<void>) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const { toast } = useToast();

  const removePlayer = async (playerId: number) => {
    console.log('🗑️ REMOVE PLAYER OPERATION START - DETAILED DEBUG');
    console.log('📊 Remove parameters:', {
      playerId,
      timestamp: new Date().toISOString()
    });

    if (isRemoving) return false;
    setIsRemoving(true);

    try {
      // Fetch player for context
      console.log('🔍 Fetching player data for removal...');
      const { data: currentPlayer, error: fetchError } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, team_id, birth_date')
        .eq('player_id', playerId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching current player:', fetchError);
        toast({
          title: "Fout bij ophalen speler",
          description: `Kon spelergegevens niet ophalen: ${fetchError.message}`,
          variant: "destructive",
        });
        return false;
      }

      if (!currentPlayer) {
        console.error('❌ Player not found with ID:', playerId);
        toast({
          title: "Speler niet gevonden",
          description: "De speler bestaat niet meer",
          variant: "destructive",
        });
        return false;
      }

      console.log('📝 Found player to remove:', currentPlayer);

      // Perform the real delete with RLS context
      console.log('🗑️ Executing database DELETE with RLS context...');
      const { error: deleteError } = await withUserContext(async () => {
        return await supabase
          .from('players')
          .delete()
          .eq('player_id', playerId);
      });

      if (deleteError) {
        console.error('❌ Database DELETE error:', deleteError);
        toast({
          title: "Database fout",
          description: `Kon speler niet verwijderen: ${deleteError.message}`,
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Database DELETE successful');

      // Verify deletion
      console.log('🔍 Verifying deletion...');
      const { data: verifyCheck, error: verifyError } = await supabase
        .from('players')
        .select('player_id')
        .eq('player_id', playerId)
        .maybeSingle();

      if (verifyError) {
        console.error('❌ Error verifying deletion:', verifyError);
      }

      if (verifyCheck) {
        console.error('❌ Player still exists after deletion');
        toast({
          title: "Verificatie mislukt",
          description: "Speler lijkt niet verwijderd te zijn.",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Deletion verified successfully');

      // Refresh player list
      console.log('🔄 Starting refresh process...');
      await refreshWithRetry(refreshPlayers);
      console.log('✅ Refresh process completed');

      toast({
        title: "Speler verwijderd",
        description: `${currentPlayer.first_name} ${currentPlayer.last_name} is permanent verwijderd`,
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
    } finally {
      setIsRemoving(false);
    }
  };

  return { removePlayer, isRemoving };
};
