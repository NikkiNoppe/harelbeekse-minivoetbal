
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
      // Update user in users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          username: formData.username,
          email: formData.email,
          role: formData.role
        })
        .eq('user_id', userId);

      if (userError) {
        throw userError;
      }

      // Update password if provided
      if (formData.password?.trim()) {
        const { error: passwordError } = await supabase
          .rpc('update_user_password', {
            user_id_param: userId,
            new_password: formData.password
          });

        if (passwordError) {
          throw passwordError;
        }
      }

      // Handle team assignments
      const { error: deleteError } = await supabase
        .from('team_users')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error removing team assignments:', deleteError);
      }

      // Add team assignments for player_manager role
      if (formData.role === "player_manager") {
        const teamIds = formData.teamIds || (formData.teamId ? [formData.teamId] : []);
        
        if (teamIds.length > 0) {
          const teamUserEntries = teamIds.map(teamId => ({
            user_id: userId,
            team_id: teamId
          }));

          const { error: teamUserError } = await supabase
            .from('team_users')
            .insert(teamUserEntries);

          if (teamUserError) {
            throw teamUserError;
          }

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
        toast({
          title: "Gebruiker bijgewerkt",
          description: `${formData.username} is bijgewerkt als ${formData.role}`,
        });
      }

      // Add delay to ensure database transaction is committed
      await new Promise(resolve => setTimeout(resolve, 300));
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
