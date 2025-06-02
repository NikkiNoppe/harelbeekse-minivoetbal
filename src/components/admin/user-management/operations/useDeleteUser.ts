
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDeleteUser = (refreshData: () => Promise<void>) => {
  const { toast } = useToast();

  const deleteUser = async (userId: number) => {
    try {
      console.log('Starting deletion process for user ID:', userId);
      
      // First, remove any team user relationships
      const { error: teamUserError } = await supabase
        .from('team_users')
        .delete()
        .eq('user_id', userId);
      
      if (teamUserError) {
        console.error('Error deleting team user relationships:', teamUserError);
        throw teamUserError;
      }
      
      console.log('Successfully removed team relationships for user:', userId);
      
      // Now delete the user from the users table
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error deleting user:', error);
        throw error;
      }
      
      console.log('Successfully deleted user:', userId);
      
      toast({
        title: "Gebruiker verwijderd",
        description: "De gebruiker is succesvol verwijderd"
      });
      
      // Refresh the user list to ensure we have the latest data from the database
      console.log('Refreshing user data after deletion');
      await refreshData();
      return true;
    } catch (error: any) {
      console.error('Error in deleteUser function:', error);
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
