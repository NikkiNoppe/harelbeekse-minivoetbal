
import { supabase } from "@/integrations/supabase/client";
import { Team } from "../types";
import { useToast } from "@/hooks/use-toast";

export const useUpdateUser = (teams: Team[], refreshData: () => Promise<void>) => {
  const { toast } = useToast();

  const updateUser = async (userId: number, formData: any) => {
    try {
      // Update user in Supabase
      const { error } = await supabase
        .from('users')
        .update({
          username: formData.username,
          ...(formData.password ? { password: formData.password } : {}),
          role: formData.role,
        })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Handle team associations if user is a player_manager
      if (formData.role === "player_manager") {
        // First, remove any existing team associations for this user
        const { error: resetError } = await supabase
          .from('team_users')
          .delete()
          .eq('user_id', userId);
        
        if (resetError) throw resetError;
        
        // Then, add new team associations
        const teamIds = Array.isArray(formData.teamIds) ? formData.teamIds : 
                      (formData.teamId ? [formData.teamId] : []);
        
        if (teamIds.length > 0) {
          const teamUserEntries = teamIds.map(teamId => ({
            user_id: userId,
            team_id: parseInt(teamId)
          }));
          
          const { error: teamUserError } = await supabase
            .from('team_users')
            .insert(teamUserEntries);
          
          if (teamUserError) throw teamUserError;
          
          // Get team names for toast message
          const teamNames = teams
            .filter(team => teamIds.includes(team.team_id.toString()))
            .map(team => team.team_name)
            .join(", ");
          
          toast({
            title: "Gebruiker bijgewerkt",
            description: `${formData.username} is bijgewerkt en gekoppeld aan ${teamNames}.`
          });
        } else {
          toast({
            title: "Gebruiker bijgewerkt",
            description: `${formData.username} is bijgewerkt zonder teamkoppeling.`
          });
        }
      } else {
        // If user is no longer a player_manager, remove any team associations
        const { error: resetError } = await supabase
          .from('team_users')
          .delete()
          .eq('user_id', userId);
        
        if (resetError) throw resetError;
        
        toast({
          title: "Gebruiker bijgewerkt",
          description: `${formData.username} is bijgewerkt. Teamkoppelingen zijn verwijderd omdat de gebruiker geen teamverantwoordelijke meer is.`
        });
      }
      
      // Refresh user list to show updated data
      await refreshData();
      return true;
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Fout",
        description: `Er is een fout opgetreden bij het bijwerken van de gebruiker: ${error.message || 'Onbekende fout'}`,
        variant: "destructive"
      });
      return false;
    }
  };

  return { updateUser };
};
