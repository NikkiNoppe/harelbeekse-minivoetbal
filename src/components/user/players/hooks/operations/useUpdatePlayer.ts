import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePlayerValidation } from "../usePlayerValidation";

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
      const { data: currentPlayer, error: fetchError } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, birth_date, is_active, team_id')
        .eq('player_id', playerId)
        .single();

      if (fetchError) {
        toast({
          title: "Fout bij ophalen speler",
          description: `Kon spelergegevens niet ophalen: ${fetchError.message}`,
          variant: "destructive",
        });
        return false;
      }

      if (!currentPlayer) {
        toast({
          title: "Speler niet gevonden",
          description: "De speler bestaat niet meer",
          variant: "destructive",
        });
        return false;
      }

      if (!currentPlayer.is_active) {
        toast({
          title: "Inactieve speler",
          description: "Deze speler is gedeactiveerd en kan niet worden bijgewerkt",
          variant: "destructive",
        });
        return false;
      }

      // Prepare values
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const normalizedBirthDate = birthDate;

      // Check "is there a change?"
      const firstNameChanged = currentPlayer.first_name !== trimmedFirstName;
      const lastNameChanged = currentPlayer.last_name !== trimmedLastName;
      const birthDateChanged = currentPlayer.birth_date !== normalizedBirthDate;
      const hasChanges = firstNameChanged || lastNameChanged || birthDateChanged;

      if (!hasChanges) {
        toast({
          title: "Geen wijzigingen",
          description: "Er zijn geen wijzigingen om op te slaan",
        });
        return true;
      }

      // Check for duplicate name
      const nameChanged = firstNameChanged || lastNameChanged;
      if (nameChanged) {
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

      // Check for exact player match
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
      const { data: updateResult, error: updateError } = await supabase
        .from('players')
        .update({
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
          birth_date: normalizedBirthDate
        })
        .eq('player_id', playerId)
        .select('*');

      if (updateError) {
        toast({
          title: "Database fout",
          description: `Kon speler niet bijwerken: ${updateError.message}`,
          variant: "destructive",
        });
        return false;
      }

      // Final fetch for confirmation
      const { data: finalCheck, error: finalError } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, birth_date')
        .eq('player_id', playerId)
        .single();

      if (finalError) {
        toast({
          title: "Database fout",
          description: `Kan gegevens niet controleren: ${finalError.message}`,
          variant: "destructive",
        });
        return false;
      }

      // Only check actual new values
      if (
        finalCheck.first_name !== trimmedFirstName ||
        finalCheck.last_name !== trimmedLastName ||
        finalCheck.birth_date !== normalizedBirthDate
      ) {
        toast({
          title: "Verificatie mislukt",
          description: "De wijzigingen zijn mogelijk niet correct opgeslagen.",
          variant: "destructive",
        });
        return false;
      }

      // Only one refresh
      await refreshPlayers();

      toast({
        title: "Speler bijgewerkt",
        description: `${firstName} ${lastName} is succesvol bijgewerkt`,
      });

      return true;
    } catch (error) {
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
