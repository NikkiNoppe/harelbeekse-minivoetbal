import { supabase } from "@shared/integrations/supabase/client";
import { useToast } from "@shared/hooks/use-toast";

export function useDeleteTeam(onSuccess?: (teamId: number) => void) {
  const { toast } = useToast();

  const deleteTeam = async (teamId: number) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('team_id', teamId);

      if (error) throw error;

      toast({
        title: "Team verwijderd",
        description: "Het team en alle gerelateerde data zijn verwijderd uit de competitie",
      });
      onSuccess?.(teamId);
    } catch (error) {
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van het team.",
        variant: "destructive",
      });
    }
  };

  return { deleteTeam };
} 