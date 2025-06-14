
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePlayerValidation } from "../usePlayerValidation";
import { refreshWithRetry } from "../utils/playerCRUDUtils";

export const useAddPlayer = (refreshPlayers: () => Promise<void>) => {
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
      await refreshWithRetry(refreshPlayers);
      
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

  return { addPlayer };
};
