
import { supabase } from "@/integrations/supabase/client";
import { Team } from "../types";
import { useToast } from "@/hooks/use-toast";

export const useUpdateUser = (teams: Team[], refreshData: () => Promise<void>) => {
  const { toast } = useToast();

  const updateUser = async (userId: number, formData: any) => {
    try {
      console.log('Updating user:', userId, 'with data:', formData);
      
      // Prepare user update data
      const userUpdateData: any = {
        username: formData.username,
        role: formData.role,
      };

      // Include email if provided
      if (formData.email && formData.email.trim() !== '') {
        userUpdateData.email = formData.email;
      }
      
      // Only include password if it's provided
      if (formData.password && formData.password.trim() !== '') {
        userUpdateData.password = formData.password;
      }
      
      console.log('User update data:', userUpdateData);
      
      // Update user in Supabase
      const { error: userError } = await supabase
        .from('users')
        .update(userUpdateData)
        .eq('user_id', userId);
      
      if (userError) {
        console.error('Error updating user:', userError);
        throw userError;
      }
      
      console.log('User updated successfully');
      
      // Handle team associations if user is a player_manager
      if (formData.role === "player_manager") {
        // First, remove any existing team associations for this user
        const { error: resetError } = await supabase
          .from('team_users')
          .delete()
          .eq('user_id', userId);
        
        if (resetError) {
          console.error('Error removing existing team associations:', resetError);
          throw resetError;
        }
        
        console.log('Existing team associations removed');
        
        // Then, add new team associations
        const teamIds = Array.isArray(formData.teamIds) ? formData.teamIds : 
                      (formData.teamId ? [formData.teamId] : []);
        
        console.log('Team IDs to associate:', teamIds);
        
        if (teamIds.length > 0) {
          const teamUserEntries = teamIds.map(teamId => ({
            user_id: userId,
            team_id: parseInt(teamId.toString())
          }));
          
          console.log('Team user entries to insert:', teamUserEntries);
          
          const { error: teamUserError } = await supabase
            .from('team_users')
            .insert(teamUserEntries);
          
          if (teamUserError) {
            console.error('Error inserting team associations:', teamUserError);
            throw teamUserError;
          }
          
          console.log('Team associations created successfully');
          
          // Get team names for toast message
          const teamNames = teams
            .filter(team => teamIds.includes(team.team_id))
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
        
        if (resetError) {
          console.error('Error removing team associations:', resetError);
          throw resetError;
        }
        
        console.log('Team associations removed for non-player_manager role');
        
        toast({
          title: "Gebruiker bijgewerkt",
          description: `${formData.username} is bijgewerkt. Teamkoppelingen zijn verwijderd omdat de gebruiker geen teamverantwoordelijke meer is.`
        });
      }
      
      // Refresh user list to show updated data
      console.log('Refreshing user data...');
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
