
import { supabase } from "@/integrations/supabase/client";
import { Team } from "../types";
import { useToast } from "@/hooks/use-toast";

export const useUpdateUser = (teams: Team[], refreshData: () => Promise<void>) => {
  const { toast } = useToast();

  const updateUser = async (userId: number, formData: {
    username: string;
    email: string;
    password?: string;
    role: "admin" | "referee" | "player_manager";
    teamId?: number;
    teamIds?: number[];
  }) => {
    try {
      console.log('Updating user:', userId, 'with data:', formData);

      // Prepare update data
      const updateData: any = {
        username: formData.username,
        email: formData.email,
        role: formData.role
      };

      // Update user in users table
      const { error: userError } = await supabase
        .from('users')
        .update(updateData)
        .eq('user_id', userId);

      if (userError) {
        console.error('Error updating user:', userError);
        throw userError;
      }

      // Update password if provided
      if (formData.password && formData.password.trim() !== '') {
        console.log('Updating password for user:', userId);
        const { data: passwordResult, error: passwordError } = await supabase
          .rpc('update_user_password', {
            user_id_param: userId,
            new_password: formData.password
          });

        if (passwordError) {
          console.error('Error updating password:', passwordError);
          throw passwordError;
        }

        console.log('Password update result:', passwordResult);
      }

      // Handle team assignments for player_manager role
      if (formData.role === "player_manager") {
        // First, remove existing team assignments
        const { error: deleteError } = await supabase
          .from('team_users')
          .delete()
          .eq('user_id', userId);

        if (deleteError) {
          console.error('Error removing existing team assignments:', deleteError);
          throw deleteError;
        }

        // Get team IDs to assign
        const teamIds = formData.teamIds || (formData.teamId ? [formData.teamId] : []);
        
        if (teamIds.length > 0) {
          console.log('Adding team relationships for user_id:', userId, 'teams:', teamIds);
          
          // Create entries in team_users table for each team
          const teamUserEntries = teamIds.map(teamId => ({
            user_id: userId,
            team_id: teamId
          }));

          const { error: teamUserError } = await supabase
            .from('team_users')
            .insert(teamUserEntries);

          if (teamUserError) {
            console.error('Error creating team relationships:', teamUserError);
            throw teamUserError;
          }

          // Get team names for toast message
          const teamNames = teams
            .filter(team => teamIds.includes(team.team_id))
            .map(team => team.team_name)
            .join(", ");

          toast({
            title: "Gebruiker bijgewerkt",
            description: `${formData.username} is bijgewerkt als teamverantwoordelijke voor ${teamNames}`,
          });
        } else {
          toast({
            title: "Gebruiker bijgewerkt",
            description: `${formData.username} is bijgewerkt zonder teamkoppeling`,
          });
        }
      } else {
        // For non-player_manager roles, remove any existing team assignments
        const { error: deleteError } = await supabase
          .from('team_users')
          .delete()
          .eq('user_id', userId);

        if (deleteError) {
          console.error('Error removing team assignments:', deleteError);
          // Don't throw here, just log the error
        }

        toast({
          title: "Gebruiker bijgewerkt",
          description: `${formData.username} is bijgewerkt als ${formData.role}`,
        });
      }

      console.log('User successfully updated:', userId);

      // Refresh user list
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
