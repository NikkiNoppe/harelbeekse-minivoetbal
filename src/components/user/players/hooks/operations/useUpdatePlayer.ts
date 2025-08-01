import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePlayerValidation } from "../usePlayerValidation";
import { useAuth } from "@/components/pages/login/AuthProvider";

export const useUpdatePlayer = (refreshPlayers: () => Promise<void>) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { validatePlayerData } = usePlayerValidation();
  const { user, isAuthenticated } = useAuth();

  const updatePlayer = async (playerId: number, firstName: string, lastName: string, birthDate: string) => {
    console.log('🚀 UPDATE FUNCTION CALLED');
    console.log('🔍 UPDATE TEST - Starting update for player:', playerId);
    console.log('📝 New data:', { firstName, lastName, birthDate });
    console.log('👤 Auth status:', { isAuthenticated, user: user?.username, role: user?.role });

    if (isUpdating) {
      console.log('⚠️ Already updating, skipping...');
      return false;
    }

    // Check authentication first
    if (!isAuthenticated || !user) {
      console.error('❌ User not authenticated');
      toast({
        title: "Niet geautoriseerd",
        description: "U moet ingelogd zijn om spelers te bewerken",
        variant: "destructive",
      });
      return false;
    }

    setIsUpdating(true);

    try {
      if (!validatePlayerData(firstName, lastName, birthDate)) {
        toast({
          title: "Onvolledige gegevens",
          description: "Vul alle velden in",
          variant: "destructive",
        });
        return false;
      }

      // First, let's see what the current player data looks like
      console.log('🔍 Reading current player data...');
      const { data: currentPlayer, error: readError } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, birth_date, team_id')
        .eq('player_id', playerId)
        .single();

      if (readError) {
        console.error('❌ Cannot read player:', readError);
        toast({
          title: "Fout bij lezen",
          description: `Kan speler niet lezen: ${readError.message}`,
          variant: "destructive",
        });
        return false;
      }

      console.log('📊 Current player data:', currentPlayer);

      // Check if user has permission to edit this player
      if (user.role === 'player_manager' && currentPlayer.team_id !== user.teamId) {
        console.error('❌ User does not have permission to edit this player');
        toast({
          title: "Geen toestemming",
          description: "U kunt alleen spelers van uw eigen team bewerken",
          variant: "destructive",
        });
        return false;
      }

      // Now try the update
      console.log('🔄 Attempting update...');
      const { data: updateResult, error: updateError } = await supabase
        .from('players')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          birth_date: birthDate
        })
        .eq('player_id', playerId)
        .select();

      if (updateError) {
        console.error('❌ Update failed:', updateError);
        toast({
          title: "Update mislukt",
          description: `Database fout: ${updateError.message}`,
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Update result:', updateResult);
      
      // Check if update actually worked - improved logic
      if (!updateResult || updateResult.length === 0) {
        console.log('⚠️ Update returned empty result - checking if data was actually updated...');
        
        // Let's try to read the player again to see if the update actually happened
        const { data: verifyPlayer, error: verifyError } = await supabase
          .from('players')
          .select('player_id, first_name, last_name, birth_date')
          .eq('player_id', playerId)
          .single();

        if (verifyError) {
          console.error('❌ Cannot verify update:', verifyError);
          toast({
            title: "Update geblokkeerd",
            description: "Database rechten staan updates niet toe. Contacteer de beheerder.",
            variant: "destructive",
          });
          return false;
        }

        // Check if the data was actually updated
        const wasUpdated = verifyPlayer.first_name === firstName.trim() && 
                          verifyPlayer.last_name === lastName.trim() && 
                          verifyPlayer.birth_date === birthDate;

        if (wasUpdated) {
          console.log('✅ Update was successful despite empty result - data was changed');
          // Continue with success flow
        } else {
          console.error('❌ Update did not work - data not changed');
          console.log('🔍 Data comparison:', {
            expected: { firstName: firstName.trim(), lastName: lastName.trim(), birthDate },
            actual: { 
              firstName: verifyPlayer.first_name, 
              lastName: verifyPlayer.last_name, 
              birthDate: verifyPlayer.birth_date 
            }
          });
          toast({
            title: "Update geblokkeerd",
            description: "Database rechten staan updates niet toe. Contacteer de beheerder.",
            variant: "destructive",
          });
          return false;
        }
      } else {
        console.log('✅ Update successful with result data');
      }

      // Read the player again to verify the update
      console.log('🔍 Final verification...');
      const { data: finalVerifyPlayer, error: finalVerifyError } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, birth_date')
        .eq('player_id', playerId)
        .single();

      if (finalVerifyError) {
        console.error('❌ Cannot verify final update:', finalVerifyError);
      } else {
        console.log('📊 Final verified player data:', finalVerifyPlayer);
        console.log('🔍 Final data comparison:', {
          expected: { firstName: firstName.trim(), lastName: lastName.trim(), birthDate },
          actual: { 
            firstName: finalVerifyPlayer.first_name, 
            lastName: finalVerifyPlayer.last_name, 
            birthDate: finalVerifyPlayer.birth_date 
          }
        });
      }

      // Refresh the player list
      console.log('🔄 Refreshing player list...');
      await refreshPlayers();
      console.log('✅ Refresh completed');

      toast({
        title: "Speler bijgewerkt",
        description: `${firstName} ${lastName} is succesvol bijgewerkt`,
      });

      return true;
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van de speler.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updatePlayer, isUpdating };
};
