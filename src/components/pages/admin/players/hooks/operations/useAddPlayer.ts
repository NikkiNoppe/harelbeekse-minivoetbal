import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePlayerValidation } from "../usePlayerValidation";

export const useAddPlayer = (refreshPlayers: () => Promise<void>) => {
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const { validatePlayerData } = usePlayerValidation();

  const addPlayer = async (firstName: string, lastName: string, birthDate: string, teamId: number) => {
    console.log('🎯 ADD PLAYER OPERATION START - Using RPC');
    console.log('📊 Add parameters:', { firstName, lastName, birthDate, teamId });

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

      // Get user ID from localStorage
      const authDataString = localStorage.getItem('auth_data');
      const userId = authDataString ? JSON.parse(authDataString)?.user?.id : null;

      if (!userId) {
        toast({
          title: "Niet ingelogd",
          description: "Log opnieuw in om spelers toe te voegen",
          variant: "destructive",
        });
        return false;
      }

      console.log('📝 Executing RPC insert_player_with_context...');
      
      // Use SECURITY DEFINER function for atomic authorization + insert
      const { data, error } = await supabase.rpc('insert_player_with_context', {
        p_user_id: userId,
        p_first_name: firstName.trim(),
        p_last_name: lastName.trim(),
        p_birth_date: birthDate,
        p_team_id: teamId
      });
      
      if (error) {
        console.error('❌ RPC error:', error);
        toast({
          title: "Database fout",
          description: `Kon speler niet toevoegen: ${error.message}`,
          variant: "destructive",
        });
        return false;
      }

      // Check RPC response
      const result = Array.isArray(data) ? data[0] : data;
      
      if (!result?.success) {
        console.warn('⚠️ RPC returned failure:', result?.message);
        toast({
          title: "Kon speler niet toevoegen",
          description: result?.message || "Onbekende fout",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Player inserted successfully:', result);
      
      // Refresh player data
      console.log('🔄 Refreshing player data...');
      await refreshPlayers();
      console.log('✅ Refresh completed');
      
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
