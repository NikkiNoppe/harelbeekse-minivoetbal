import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePlayerValidation } from "../usePlayerValidation";
import { refreshWithRetry } from "../utils/playerCRUDUtils";
import { formatDateShort } from "@/lib/dateUtils";

export const useAddPlayer = (refreshPlayers: () => Promise<void>) => {
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const { checkPlayerExists, checkNameExists, validatePlayerData } = usePlayerValidation();

  const addPlayer = async (firstName: string, lastName: string, birthDate: string, teamId: number) => {
    console.log('🎯 ADD PLAYER OPERATION START - DETAILED DEBUG');
    console.log('📊 Add parameters:', {
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
        console.warn('⚠️ Validation failed for add player');
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
          description: `${firstName} ${lastName} bestaat al bij ${teamName} met geboortedatum ${formatDateShort(existingName.birth_date)}`,
          variant: "destructive",
        });
        return false;
      }
      
      console.log('📝 Executing database INSERT...');
      const insertData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: birthDate,
        team_id: teamId
      };
      console.log('📊 Insert data:', insertData);

      const { data, error } = await supabase
        .from('players')
        .insert(insertData)
        .select();
      
      if (error) {
        console.error('❌ Database INSERT error:', error);
        toast({
          title: "Database fout",
          description: `Kon speler niet toevoegen: ${error.message}`,
          variant: "destructive",
        });
        return false;
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
        description: error instanceof Error ? error.message : "Er is een fout opgetreden bij het toevoegen van de speler.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  return { addPlayer, isAdding };
};
