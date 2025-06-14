
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { delay, refreshWithRetry } from "../utils/playerCRUDUtils";

export const useRemovePlayer = (refreshPlayers: () => Promise<void>) => {
  const { toast } = useToast();

  const removePlayer = async (playerId: number) => {
    console.log('🗑️ REMOVE PLAYER OPERATION START - DETAILED DEBUG');
    console.log('📊 Remove parameters:', {
      playerId,
      timestamp: new Date().toISOString()
    });

    try {
      // First check if player exists and get full details
      console.log('🔍 Fetching current player data for removal...');
      const { data: currentPlayer, error: fetchError } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, is_active, team_id, birth_date')
        .eq('player_id', playerId)
        .single();

      console.log('📊 Current player fetch result:', {
        currentPlayer,
        fetchError,
        timestamp: new Date().toISOString()
      });

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

      // Perform the removal with detailed logging
      console.log('📝 EXECUTING REMOVE QUERY - START');
      console.log('📊 Remove operation details:', {
        operation: 'UPDATE is_active = false',
        where_condition: `player_id = ${playerId}`,
        current_is_active: currentPlayer.is_active
      });

      const { data: removeResult, error: removeError } = await supabase
        .from('players')
        .update({ is_active: false })
        .eq('player_id', playerId)
        .select('*');
      
      console.log('📊 REMOVE QUERY RESPONSE:', {
        removeResult,
        removeError,
        timestamp: new Date().toISOString()
      });

      if (removeError) {
        console.error('❌ Supabase remove error:', removeError);
        toast({
          title: "Database fout",
          description: `Kon speler niet verwijderen: ${removeError.message}`,
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Remove query completed successfully');
      console.log('📊 Removed player data:', removeResult);

      // Test immediate verification without delay
      console.log('🔍 IMMEDIATE VERIFICATION TEST');
      const { data: immediateCheck, error: immediateError } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, is_active')
        .eq('player_id', playerId)
        .single();

      console.log('📊 Immediate verification result:', {
        immediateCheck,
        immediateError,
        expected_is_active: false
      });

      // Add delay before refresh
      console.log('⏱️ Waiting 500ms for database transaction to commit...');
      await delay(500);
      
      // Enhanced refresh with retry logic
      console.log('🔄 Starting refresh process...');
      await refreshWithRetry(refreshPlayers);
      
      // Final verification that player is actually inactive
      console.log('🔍 FINAL VERIFICATION');
      const { data: finalCheck, error: finalError } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, is_active')
        .eq('player_id', playerId)
        .single();

      console.log('📊 Final verification result:', {
        finalCheck,
        finalError,
        successfully_deactivated: finalCheck?.is_active === false
      });

      if (finalCheck?.is_active !== false) {
        console.error('❌ Player removal verification failed - player still appears active');
        toast({
          title: "Verificatie mislukt",
          description: "De speler lijkt niet correct verwijderd te zijn. Ververs de pagina om de actuele status te zien.",
          variant: "destructive",
        });
      }
      
      toast({
        title: "Speler verwijderd",
        description: `${currentPlayer.first_name} ${currentPlayer.last_name} is verwijderd uit het team`,
      });
      
      console.log('🗑️ REMOVE PLAYER OPERATION END');
      return true;
    } catch (error) {
      console.error('💥 CRITICAL ERROR in removePlayer:', error);
      console.error('💥 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        timestamp: new Date().toISOString()
      });
      
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
