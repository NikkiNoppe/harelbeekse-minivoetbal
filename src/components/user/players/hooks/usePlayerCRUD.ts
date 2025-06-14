
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePlayerValidation } from "./usePlayerValidation";

export const usePlayerCRUD = (refreshPlayers: () => Promise<void>) => {
  const { toast } = useToast();
  const { checkPlayerExists, checkNameExists, validatePlayerData } = usePlayerValidation();

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
      console.log('Adding player:', {
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
        console.error('Supabase error adding player:', error);
        throw error;
      }

      console.log('Player added successfully:', data);
      
      await refreshPlayers();
      
      toast({
        title: "Speler toegevoegd",
        description: `${firstName} ${lastName} is toegevoegd aan het team`,
      });
      
      return true;
    } catch (error) {
      console.error('Error adding player:', error);
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
      console.log('🔄 Starting player update with data:', {
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

      // Check if any changes were actually made
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      
      const hasChanges = 
        currentPlayer.first_name !== trimmedFirstName ||
        currentPlayer.last_name !== trimmedLastName ||
        currentPlayer.birth_date !== birthDate;

      if (!hasChanges) {
        console.log('ℹ️ No changes detected, skipping update');
        toast({
          title: "Geen wijzigingen",
          description: "Er zijn geen wijzigingen om op te slaan",
        });
        return true; // Return true since this is not an error
      }

      // Check if name changed - only validate duplicates if name actually changed
      const nameChanged = currentPlayer.first_name !== trimmedFirstName || currentPlayer.last_name !== trimmedLastName;
      
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
      const { error: updateError } = await supabase
        .from('players')
        .update({
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
          birth_date: birthDate
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

      console.log('✅ Player update successful');
      
      // Force refresh of players data
      console.log('🔄 Refreshing players list...');
      await refreshPlayers();
      
      toast({
        title: "Speler bijgewerkt",
        description: `${firstName} ${lastName} is succesvol bijgewerkt`,
      });
      
      console.log('✅ Player update process completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating player:', error);
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
      console.log('🗑️ Starting player removal for ID:', playerId);

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

      console.log('✅ Player removed successfully:', data);
      
      await refreshPlayers();
      
      toast({
        title: "Speler verwijderd",
        description: `${currentPlayer.first_name} ${currentPlayer.last_name} is verwijderd uit het team`,
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error removing player:', error);
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
