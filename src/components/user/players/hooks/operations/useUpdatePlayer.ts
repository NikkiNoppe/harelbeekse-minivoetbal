
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePlayerValidation } from "../usePlayerValidation";
import { delay, verifyPlayerUpdate, refreshWithRetry } from "../utils/playerCRUDUtils";

export const useUpdatePlayer = (refreshPlayers: () => Promise<void>) => {
  const { toast } = useToast();
  const { checkPlayerExists, checkNameExists, validatePlayerData } = usePlayerValidation();

  const updatePlayer = async (playerId: number, firstName: string, lastName: string, birthDate: string) => {
    if (!validatePlayerData(firstName, lastName, birthDate)) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul alle velden in",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log('🔄 Starting player update with timestamp:', new Date().toISOString(), {
        player_id: playerId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: birthDate
      });

      // Get current player data to check for actual changes
      const { data: currentPlayer, error: fetchError } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, birth_date, is_active')
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

      // Check if player is inactive and warn user
      if (!currentPlayer.is_active) {
        console.warn('⚠️ Attempting to update inactive player:', playerId);
        toast({
          title: "Inactieve speler",
          description: "Deze speler is gedeactiveerd en kan niet worden bijgewerkt",
          variant: "destructive",
        });
        return false;
      }

      // Prepare comparison values - trim and normalize
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const normalizedBirthDate = birthDate;

      // Check if any changes were actually made
      const firstNameChanged = currentPlayer.first_name !== trimmedFirstName;
      const lastNameChanged = currentPlayer.last_name !== trimmedLastName;
      const birthDateChanged = currentPlayer.birth_date !== normalizedBirthDate;
      
      console.log('📊 Changes detected:', {
        firstName: firstNameChanged,
        lastName: lastNameChanged,
        birthDate: birthDateChanged,
        timestamp: new Date().toISOString()
      });

      const hasChanges = firstNameChanged || lastNameChanged || birthDateChanged;

      if (!hasChanges) {
        console.log('ℹ️ No changes detected, skipping update');
        toast({
          title: "Geen wijzigingen",
          description: "Er zijn geen wijzigingen om op te slaan",
        });
        return true; // Return true since this is not an error
      }

      console.log('✅ Changes detected, proceeding with update');

      // Check if name changed - only validate duplicates if name actually changed
      const nameChanged = firstNameChanged || lastNameChanged;
      
      if (nameChanged) {
        // Check if name already exists with any birth date
        const existingName = await checkNameExists(firstName, lastName, playerId);
        if (existingName) {
          const teamName = existingName.teams?.team_name || 'onbekend team';
          toast({
            title: "Naam bestaat al",
            description: `${firstName} ${lastName} bestaat al bij ${teamName} met geboortedatum ${new Date(existingName.birth_date).toLocaleDateString('nl-NL')}`,
            variant: "destructive",
          });
          return false;
        }
      }

      // Check if exact combination exists (name + birth date)
      const existingPlayer = await checkPlayerExists(firstName, lastName, birthDate, playerId);
      
      if (existingPlayer) {
        const teamName = existingPlayer.teams?.team_name || 'onbekend team';
        toast({
          title: "Speler bestaat al",
          description: `${firstName} ${lastName} met deze geboortedatum is al ingeschreven bij ${teamName}`,
          variant: "destructive",
        });
        return false;
      }

      // Perform the update
      console.log('📝 Executing update query at:', new Date().toISOString());
      const { error: updateError } = await supabase
        .from('players')
        .update({
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
          birth_date: normalizedBirthDate
        })
        .eq('player_id', playerId);
      
      if (updateError) {
        console.error('❌ Supabase error updating player:', updateError);
        toast({
          title: "Database fout",
          description: `Kon speler niet bijwerken: ${updateError.message}`,
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Player update query successful at:', new Date().toISOString());
      
      // Add delay before refresh to allow database transaction to commit
      console.log('⏱️ Waiting 500ms for database transaction to commit...');
      await delay(500);
      
      // Enhanced refresh with retry logic
      await refreshWithRetry(refreshPlayers);
      
      // Verify the update was persisted
      console.log('🔍 Verifying update persistence...');
      const isVerified = await verifyPlayerUpdate(playerId, trimmedFirstName, trimmedLastName, normalizedBirthDate);
      
      if (!isVerified) {
        console.warn('⚠️ Update verification failed, attempting additional refresh...');
        await delay(1000);
        await refreshWithRetry(refreshPlayers);
        
        // Check again
        const secondVerification = await verifyPlayerUpdate(playerId, trimmedFirstName, trimmedLastName, normalizedBirthDate);
        if (!secondVerification) {
          console.error('❌ Update verification failed after retry');
          toast({
            title: "Verificatie mislukt",
            description: "De wijzigingen zijn mogelijk niet correct opgeslagen. Ververs de pagina om de actuele gegevens te zien.",
            variant: "destructive",
          });
        }
      } else {
        console.log('✅ Update verification successful');
      }
      
      toast({
        title: "Speler bijgewerkt",
        description: `${firstName} ${lastName} is succesvol bijgewerkt`,
      });
      
      return true;
    } catch (error) {
      console.error('💥 Error updating player:', error);
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
