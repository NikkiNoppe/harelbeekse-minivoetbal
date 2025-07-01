import { supabase } from "@shared/integrations/supabase/client";
import { useToast } from "@shared/hooks/use-toast";
import { Team } from "../types";

export function useUpdateTeam(onSuccess?: (team: Team) => void) {
  const { toast } = useToast();

  const updateTeam = async (teamId: number, name: string, balance: number) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update({ team_name: name.trim(), balance })
        .eq('team_id', teamId);

      if (error) throw error;

      toast({
        title: "Team bijgewerkt",
        description: `${name} is bijgewerkt`,
      });
      onSuccess?.({ team_id: teamId, team_name: name, balance });
    } catch (error) {
      toast({
        title: "Fout bij bijwerken",
        description: "Er is een fout opgetreden bij het bijwerken van het team.",
        variant: "destructive",
      });
    }
  };

  return { updateTeam };
} 