import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";
import { useToast } from "@/hooks/use-toast";
import { usePlayerValidation } from "../usePlayerValidation";

export const useUpdatePlayer = (refreshPlayers: () => Promise<void>) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { validatePlayerData } = usePlayerValidation();

  const updatePlayer = async (
    playerId: number,
    firstName: string,
    lastName: string,
    birthDate: string,
  ) => {
    if (isUpdating) return false;
    setIsUpdating(true);

    try {
      if (!validatePlayerData(firstName, lastName, birthDate)) {
        toast({
          title: "Onvolledige gegevens",
          description: "Vul alle velden in",
          variant: "destructive",
        });
        return false;
      }

      const { data, error } = await supabase.rpc("update_player_for_session", {
        ...getRpcSessionArgs(),
        p_player_id: playerId,
        p_first_name: firstName.trim(),
        p_last_name: lastName.trim(),
        p_birth_date: birthDate,
      });

      if (error) {
        toast({
          title: "Update mislukt",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      const result = Array.isArray(data) ? data[0] : data;
      if (!result?.success) {
        toast({
          title: "Update mislukt",
          description: result?.message || "Kon speler niet bijwerken",
          variant: "destructive",
        });
        return false;
      }

      await refreshPlayers();
      toast({
        title: "Speler bijgewerkt",
        description: `${firstName} ${lastName} is bijgewerkt`,
      });
      return true;
    } catch (error) {
      console.error("Error updating player:", error);
      toast({
        title: "Fout bij bijwerken",
        description: error instanceof Error ? error.message : "Onbekende fout",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updatePlayer, isUpdating };
};
