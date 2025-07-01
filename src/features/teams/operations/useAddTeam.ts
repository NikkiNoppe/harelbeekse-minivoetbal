import { supabase } from "@shared/integrations/supabase/client";
import { useToast } from "@shared/hooks/use-toast";
import { Team } from "../types";

export function useAddTeam(onSuccess?: (team: Team) => void) {
  const { toast } = useToast();

  const addTeam = async (name: string, balance: number = 0) => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({ team_name: name.trim(), balance })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        toast({
          title: "Team toegevoegd",
          description: `${name} is toegevoegd`,
        });
        onSuccess?.(data[0]);
      }
    } catch (error) {
      toast({
        title: "Fout bij toevoegen",
        description: "Er is een fout opgetreden bij het toevoegen van het team.",
        variant: "destructive",
      });
    }
  };

  return { addTeam };
} 