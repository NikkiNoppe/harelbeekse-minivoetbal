
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDeleteUser = (refreshData: () => Promise<void>) => {
  const { toast } = useToast();

  const deleteUser = async (userId: number) => {
    try {
      // First, remove any team user relationships
      const { error: teamUserError } = await supabase
        .from('team_users')
        .delete()
        .eq('user_id', userId);
      
      if (teamUserError) throw teamUserError;
      
      // Now delete the user
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
      
      toast({
        title: "Gebruiker verwijderd",
        description: "De gebruiker is succesvol verwijderd"
      });
      
      // Refresh the user list to ensure we have the latest data
      await refreshData();
      return true;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Fout",
        description: `Er is een fout opgetreden bij het verwijderen van de gebruiker: ${error.message || 'Onbekende fout'}`,
        variant: "destructive"
      });
      return false;
    }
  };

  return { deleteUser };
};
