
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePlayerValidation } from "../usePlayerValidation";
import { delay, verifyPlayerUpdate, refreshWithRetry } from "../utils/playerCRUDUtils";

export const useUpdatePlayer = (refreshPlayers: () => Promise<void>) => {
  const { toast } = useToast();
  const { checkPlayerExists, checkNameExists, validatePlayerData } = usePlayerValidation();

  const updatePlayer = async (playerId: number, firstName: string, lastName: string, birthDate: string) => {
    console.log('🔄 UPDATE PLAYER OPERATION START - DETAILED DEBUG');
    console.log('📊 Update parameters:', {
      playerId,
      firstName,
      lastName,
      birthDate,
      timestamp: new Date().toISOString()
    });

    if (!validatePlayerData(firstName, lastName, birthDate)) {
      console.log('❌ Validation failed for update');
      toast({
        title: "Onvolledige gegevens",
        description: "Vul alle velden in",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Get current player data first for debugging
      console.log('🔍 Fetching current player data for comparison...');
      const { data: currentPlayer, error: fetchError } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, birth_date, is_active, team_id')
        .eq('player_id', playerId)
        .single();

      console.log('📊 Current player fetch result:', {
        currentPlayer,
        fetchError,
        timestamp: new Date().toISOString()
      });

      if (fetchError) {
        console.error('❌ Error fetching current player for update:', fetchError);
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

      if (!currentPlayer.is_active) {
        console.warn('⚠️ Attempting to update inactive player:', playerId);
        toast({
          title: "Inactieve speler",
          description: "Deze speler is gedeactiveerd en kan niet worden bijgewerkt",
          variant: "destructive",
        });
        return false;
      }

      // Prepare comparison values
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const normalizedBirthDate = birthDate;

      // Check if any changes were actually made
      const firstNameChanged = currentPlayer.first_name !== trimmedFirstName;
      const lastNameChanged = currentPlayer.last_name !== trimmedLastName;
      const birthDateChanged = currentPlayer.birth_date !== normalizedBirthDate;
      
      console.log('📊 Changes analysis:', {
        original: {
          firstName: currentPlayer.first_name,
          lastName: currentPlayer.last_name,
          birthDate: currentPlayer.birth_date
        },
        new: {
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          birthDate: normalizedBirthDate
        },
        changes: {
          firstName: firstNameChanged,
          lastName: lastNameChanged,
          birthDate: birthDateChanged
        }
      });

      const hasChanges = firstNameChanged || lastNameChanged || birthDateChanged;

      if (!hasChanges) {
        console.log('ℹ️ No changes detected, skipping update');
        toast({
          title: "Geen wijzigingen",
          description: "Er zijn geen wijzigingen om op te slaan",
        });
        return true;
      }

      // Check for duplicates if name changed
      const nameChanged = firstNameChanged || lastNameChanged;
      
      if (nameChanged) {
        console.log('🔍 Checking for name duplicates...');
        const existingName = await checkNameExists(firstName, lastName, playerId);
        if (existingName) {
          console.warn('⚠️ Name already exists:', existingName);
          const teamName = existingName.teams?.team_name || 'onbekend team';
          toast({
            title: "Naam bestaat al",
            description: `${firstName} ${lastName} bestaat al bij ${teamName} met geboortedatum ${new Date(existingName.birth_date).toLocaleDateString('nl-NL')}`,
            variant: "destructive",
          });
          return false;
        }
      }

      // Check if exact combination exists
      console.log('🔍 Checking for exact player match...');
      const existingPlayer = await checkPlayerExists(firstName, lastName, birthDate, playerId);
      
      if (existingPlayer) {
        console.warn('⚠️ Exact player already exists:', existingPlayer);
        const teamName = existingPlayer.teams?.team_name || 'onbekend team';
        toast({
          title: "Speler bestaat al",
          description: `${firstName} ${lastName} met deze geboortedatum is al ingeschreven bij ${teamName}`,
          variant: "destructive",
        });
        return false;
      }

      // Perform the update with detailed logging
      console.log('📝 EXECUTING UPDATE QUERY - START');
      console.log('📊 Update data being sent:', {
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        birth_date: normalizedBirthDate,
        where_condition: `player_id = ${playerId}`
      });

      const { data: updateResult, error: updateError } = await supabase
        .from('players')
        .update({
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
          birth_date: normalizedBirthDate
        })
        .eq('player_id', playerId)
        .select('*');
      
      console.log('📊 UPDATE QUERY RESPONSE:', {
        updateResult,
        updateError,
        timestamp: new Date().toISOString()
      });

      if (updateError) {
        console.error('❌ Supabase update error:', updateError);
        toast({
          title: "Database fout",
          description: `Kon speler niet bijwerken: ${updateError.message}`,
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Update query completed successfully');
      console.log('📊 Updated player data:', updateResult);

      // Test immediate verification without delay
      console.log('🔍 IMMEDIATE VERIFICATION TEST');
      const { data: immediateCheck, error: immediateError } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, birth_date')
        .eq('player_id', playerId)
        .single();

      console.log('📊 Immediate verification result:', {
        immediateCheck,
        immediateError,
        expected: { firstName: trimmedFirstName, lastName: trimmedLastName, birthDate: normalizedBirthDate }
      });

      // Add delay and verify again
      console.log('⏱️ Waiting 500ms for database transaction to commit...');
      await delay(500);
      
      // Enhanced refresh with retry logic
      console.log('🔄 Starting refresh process...');
      await refreshWithRetry(refreshPlayers);
      
      // Final verification
      console.log('🔍 FINAL VERIFICATION');
      const isVerified = await verifyPlayerUpdate(playerId, trimmedFirstName, trimmedLastName, normalizedBirthDate);
      console.log('📊 Final verification result:', isVerified);
      
      if (!isVerified) {
        console.warn('⚠️ Update verification failed, attempting additional refresh...');
        await delay(1000);
        await refreshWithRetry(refreshPlayers);
        
        const secondVerification = await verifyPlayerUpdate(playerId, trimmedFirstName, trimmedLastName, normalizedBirthDate);
        console.log('📊 Second verification result:', secondVerification);
        
        if (!secondVerification) {
          console.error('❌ Update verification failed after retry');
          toast({
            title: "Verificatie mislukt",
            description: "De wijzigingen zijn mogelijk niet correct opgeslagen. Ververs de pagina om de actuele gegevens te zien.",
            variant: "destructive",
          });
        }
      }
      
      toast({
        title: "Speler bijgewerkt",
        description: `${firstName} ${lastName} is succesvol bijgewerkt`,
      });
      
      console.log('🔄 UPDATE PLAYER OPERATION END');
      return true;
    } catch (error) {
      console.error('💥 CRITICAL ERROR in updatePlayer:', error);
      console.error('💥 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Fout bij bijwerken",
        description: error instanceof Error ? error.message : "Er is een fout opgetreden bij het bijwerken van de speler.",
        variant: "destructive",
      });
      return false;
    }
  };

  return { updatePlayer };
};
