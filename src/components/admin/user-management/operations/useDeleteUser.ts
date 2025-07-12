
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDeleteUser = (refreshData: () => Promise<void>) => {
  const { toast } = useToast();

  const deleteUser = async (userId: number) => {
    try {
      // Remove team user relationships
      const { error: teamUserError } = await supabase
        .from('team_users')
        .delete()
        .eq('user_id', userId);
      
      if (teamUserError) {
        throw teamUserError;
      }
      
      // Delete user from users table
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('user_id', userId);
      
      if (userError) {
        throw userError;
      }
      
      toast({
        title: "Gebruiker verwijderd",
        description: "De gebruiker is succesvol verwijderd"
      });
      
      // Add delay to ensure database transaction is committed
      await new Promise(resolve => setTimeout(resolve, 300));
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
