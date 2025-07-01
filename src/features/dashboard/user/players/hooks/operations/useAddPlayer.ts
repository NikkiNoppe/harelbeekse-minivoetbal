
import { useState } from "react";
import { supabase } from "@shared/integrations/supabase/client";
import { useToast } from "@shared/hooks/use-toast";
import { usePlayerValidation } from "../usePlayerValidation";
import { refreshWithRetry } from "../utils/playerCRUDUtils";

export const useAddPlayer = (refreshPlayers: () => Promise<void>) => {
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const { checkPlayerExists, checkNameExists, validatePlayerData } = usePlayerValidation();

  const addPlayer = async (firstName: string, lastName: string, birthDate: string, teamId: number) => {
    console.log('🎯 addPlayer function called with:', {
      firstName,
      lastName,
      birthDate,
      teamId,
      timestamp: new Date().toISOString()
    });

    if (isAdding) return false;
    setIsAdding(true);

    try {
      if (!validatePlayerData(firstName, lastName, birthDate)) {
        console.warn('⚠️ Validation failed');
        toast({
          title: "Onvolledige gegevens",
          description: "Vul alle velden in",
          variant: "destructive",
        });
        return false;
      }

      // Check if exact player already exists
      console.log('🔍 Checking if player exists...');
      const existingPlayer = await checkPlayerExists(firstName, lastName, birthDate);
      
      if (existingPlayer) {
        console.warn('⚠️ Player already exists:', existingPlayer);
        const teamName = existingPlayer.teams?.team_name || 'onbekend team';
        toast({
          title: "Speler bestaat al",
          description: `${firstName} ${lastName} met deze geboortedatum is al ingeschreven bij ${teamName}`,
          variant: "destructive",
        });
        return false;
      }

      // Check if name already exists with different birth date
      console.log('🔍 Checking if name exists...');
      const existingName = await checkNameExists(firstName, lastName);
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
      
      console.log('📝 Executing database INSERT...');
      const insertData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: birthDate,
        team_id: teamId,
        is_active: true
      };
      console.log('📊 Insert data:', insertData);

      const { data, error } = await supabase
        .from('players')
        .insert(insertData)
        .select();
      
      if (error) {
        console.error('❌ Database INSERT error:', error);
        throw error;
      }

      console.log('✅ Database INSERT successful:', data);
      
      // Enhanced refresh with retry logic
      console.log('🔄 Starting refresh process...');
      await refreshWithRetry(refreshPlayers);
      console.log('✅ Refresh process completed');
      
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
    } finally {
      setIsAdding(false);
    }
  };

  return { addPlayer, isAdding };
};
