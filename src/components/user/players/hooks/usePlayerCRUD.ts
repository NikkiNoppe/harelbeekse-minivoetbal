
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePlayerValidation } from "./usePlayerValidation";

export const usePlayerCRUD = (refreshPlayers: () => Promise<void>) => {
  const { toast } = useToast();
  const { checkPlayerExists, checkNameExists, validatePlayerData } = usePlayerValidation();

  // Helper function to wait with delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper function to verify player update by fetching fresh data
  const verifyPlayerUpdate = async (playerId: number, expectedFirstName: string, expectedLastName: string, expectedBirthDate: string) => {
    console.log('🔍 Verifying player update for ID:', playerId);
    try {
      const { data, error } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, birth_date')
        .eq('player_id', playerId)
        .single();

      if (error || !data) {
        console.error('❌ Error verifying player update:', error);
        return false;
      }

      const isUpdated = 
        data.first_name === expectedFirstName.trim() &&
        data.last_name === expectedLastName.trim() &&
        data.birth_date === expectedBirthDate;

      console.log('📊 Verification result:', {
        expected: { firstName: expectedFirstName, lastName: expectedLastName, birthDate: expectedBirthDate },
        actual: { firstName: data.first_name, lastName: data.last_name, birthDate: data.birth_date },
        isUpdated
      });

      return isUpdated;
    } catch (error) {
      console.error('💥 Error in verifyPlayerUpdate:', error);
      return false;
    }
  };

  // Enhanced refresh with retry logic
  const refreshWithRetry = async (maxRetries = 3, delayMs = 500) => {
    console.log('🔄 Starting enhanced refresh with retry logic');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🔄 Refresh attempt ${attempt}/${maxRetries}`);
      
      // Add delay before refresh to allow database transaction to commit
      if (attempt > 1) {
        console.log(`⏱️ Waiting ${delayMs}ms before retry...`);
        await delay(delayMs);
      }

      try {
        await refreshPlayers();
        console.log(`✅ Refresh attempt ${attempt} completed`);
        
        // If this isn't the last attempt, add a small delay to let the UI update
        if (attempt < maxRetries) {
          await delay(200);
        }
      } catch (error) {
        console.error(`❌ Refresh attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }
  };

  const addPlayer = async (firstName: string, lastName: string, birthDate: string, teamId: number) => {
    if (!validatePlayerData(firstName, lastName, birthDate)) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul alle velden in",
        variant: "destructive",
      });
      return false;
    }

    // Check if exact player already exists
    const existingPlayer = await checkPlayerExists(firstName, lastName, birthDate);
    
    if (existingPlayer) {
      const teamName = existingPlayer.teams?.team_name || 'onbekend team';
      toast({
        title: "Speler bestaat al",
        description: `${firstName} ${lastName} met deze geboortedatum is al ingeschreven bij ${teamName}`,
        variant: "destructive",
      });
      return false;
    }

    // Check if name already exists with different birth date
    const existingName = await checkNameExists(firstName, lastName);
    if (existingName) {
      const teamName = existingName.teams?.team_name || 'onbekend team';
      toast({
        title: "Naam bestaat al",
        description: `${firstName} ${lastName} bestaat al bij ${teamName} met geboortedatum ${new Date(existingName.birth_date).toLocaleDateString('nl-NL')}`,
        variant: "destructive",
      });
      return false;
    }
    
    try {
      console.log('📝 Adding player with timestamp:', new Date().toISOString(), {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: birthDate,
        team_id: teamId
      });

      const { data, error } = await supabase
        .from('players')
        .insert({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          birth_date: birthDate,
          team_id: teamId,
          is_active: true
        })
        .select();
      
      if (error) {
        console.error('❌ Supabase error adding player:', error);
        throw error;
      }

      console.log('✅ Player added successfully at:', new Date().toISOString(), data);
      
      // Enhanced refresh with retry logic
      await refreshWithRetry();
      
      toast({
        title: "Speler toegevoegd",
        description: `${firstName} ${lastName} is toegevoegd aan het team`,
      });
      
      return true;
    } catch (error) {
      console.error('💥 Error adding player:', error);
      toast({
        title: "Fout bij toevoegen",
        description: "Er is een fout opgetreden bij het toevoegen van de speler.",
        variant: "destructive",
      });
      return false;
    }
  };

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
      await refreshWithRetry();
      
      // Verify the update was persisted
      console.log('🔍 Verifying update persistence...');
      const isVerified = await verifyPlayerUpdate(playerId, trimmedFirstName, trimmedLastName, normalizedBirthDate);
      
      if (!isVerified) {
        console.warn('⚠️ Update verification failed, attempting additional refresh...');
        await delay(1000);
        await refreshWithRetry();
        
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
      await refreshWithRetry();
      
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

  return {
    addPlayer,
    updatePlayer,
    removePlayer
  };
};
