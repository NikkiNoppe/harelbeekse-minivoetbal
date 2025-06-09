
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

      // Get current player data
      const { data: currentPlayer, error: fetchError } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, birth_date, is_active')
        .eq('player_id', playerId)
        .single();

      if (fetchError || !currentPlayer || !currentPlayer.is_active) {
        console.error('❌ Error fetching current player:', fetchError);
        toast({
          title: "Speler niet gevonden",
          description: "De speler bestaat niet meer of is niet actief",
          variant: "destructive",
        });
        return false;
      }

      // Check if name changed - only validate duplicates if name actually changed
      const nameChanged = currentPlayer.first_name !== firstName.trim() || currentPlayer.last_name !== lastName.trim();
      
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

      // Now perform the update
      const { data, error } = await supabase
        .from('players')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          birth_date: birthDate
        })
        .eq('player_id', playerId)
        .eq('is_active', true)
        .select();
      
      if (error) {
        console.error('❌ Supabase error updating player:', error);
        throw error;
      }

      console.log('✅ Player update successful, returned data:', data);
      
      if (!data || data.length === 0) {
        console.warn('⚠️ No rows were updated');
        toast({
          title: "Geen wijzigingen",
          description: "Er zijn geen wijzigingen doorgevoerd",
          variant: "destructive",
        });
        return false;
      }
      
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
      console.log('Removing player:', playerId);

      const { data, error } = await supabase
        .from('players')
        .update({ is_active: false })
        .eq('player_id', playerId)
        .select();
      
      if (error) {
        console.error('Supabase error removing player:', error);
        throw error;
      }

      console.log('Player removed successfully:', data);
      
      await refreshPlayers();
      
      toast({
        title: "Speler verwijderd",
        description: "De speler is verwijderd uit het team",
      });
      
      return true;
    } catch (error) {
      console.error('Error removing player:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de speler.",
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
