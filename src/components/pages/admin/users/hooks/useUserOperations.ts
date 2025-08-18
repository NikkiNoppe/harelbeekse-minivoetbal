
import { supabase } from "@/integrations/supabase/client";
import { Team } from "../userTypes";
import { useToast } from "@/hooks/use-toast";


export const useUserOperations = (teams: Team[], refreshData: () => Promise<void>) => {
  const { toast } = useToast();

  const addUser = async (newUser: {
    username: string;
    email: string | undefined;
    password: string; // Add password parameter
    role: "admin" | "referee" | "player_manager";
    teamId: number | null;
    teamIds?: number[];
  }) => {
    // Validate form
    if (!newUser.username) {
      toast({
        title: "Fout",
        description: "Gebruikersnaam is verplicht",
        variant: "destructive"
      });
      return false;
    }
    
    if (newUser.role === "player_manager" && !newUser.teamIds?.length && !newUser.teamId) {
      toast({
        title: "Fout",
        description: "Selecteer ten minste één team voor deze gebruiker",
        variant: "destructive"
      });
      return false;
    }
    
    // Email is now optional, but if provided, it should be valid
    if (newUser.email && !newUser.email.includes('@')) {
      toast({
        title: "Fout",
        description: "Vul een geldig e-mailadres in of laat het veld leeg",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      // Create user via RPC which hashes password server-side (bcrypt)
      const { data, error } = await supabase.rpc('create_user_with_hashed_password', {
        username_param: newUser.username,
        email_param: newUser.email || null,
        password_param: newUser.password,
        role_param: newUser.role
      });
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error('No user data returned from creation');
      }
      
      // Send welcome email if email provided
      if (newUser.email && newUser.email.includes('@')) {
        try {
          // Use Supabase Edge Functions invoke for portability (local/dev/prod)
          const origin = window.location.origin;
          await supabase.functions.invoke('send-welcome-email', {
            body: {
              email: newUser.email,
              username: newUser.username,
              loginUrl: origin,
            }
          });
        } catch (e) {
          console.warn('Kon welkomstmail niet verzenden:', e);
        }
      }

      // Add team assignments for player_manager role
      if (data && newUser.role === "player_manager") {
        const teamIds = newUser.teamIds || (newUser.teamId ? [newUser.teamId] : []);
        
        if (teamIds.length > 0) {
          const teamUserEntries = teamIds.map(teamId => ({
            user_id: data.user_id,
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
            title: "Gebruiker toegevoegd",
            description: `${newUser.username} is toegevoegd als teamverantwoordelijke voor ${teamNames}.`,
            duration: 15000
          });
        } else {
          toast({
            title: "Gebruiker toegevoegd",
            description: `${newUser.username} is toegevoegd zonder teamkoppeling.`,
            duration: 15000
          });
        }
      } else {
        toast({
          title: "Gebruiker toegevoegd",
          description: `${newUser.username} is toegevoegd als ${newUser.role}.`,
          duration: 15000
        });
      }
      
      // Add delay to ensure database transaction is committed
      await new Promise(resolve => setTimeout(resolve, 300));
      await refreshData();
      return true;
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: "Fout",
        description: `Er is een fout opgetreden bij het toevoegen van de gebruiker: ${error.message || 'Onbekende fout'}`,
        variant: "destructive"
      });
      return false;
    }
  };

  const updateUser = async (userId: number, formData: {
    username: string;
    email: string | undefined;
    password?: string;
    role: "admin" | "referee" | "player_manager";
    teamId?: number;
    teamIds?: number[];
  }) => {
    try {
      // Update user in users table (including password if provided)
      const updateData: any = {
        username: formData.username,
        email: formData.email,
        role: formData.role
      };
      
      if (formData.password?.trim()) {
        const { error: pwdError } = await supabase.rpc('update_user_password', {
          user_id_param: userId,
          new_password: formData.password
        });
        if (pwdError) {
          throw pwdError;
        }
      }
      
      const { error: userError } = await supabase
        .from('users')
        .update(updateData)
        .eq('user_id', userId);

      if (userError) {
        throw userError;
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
            description: `${formData.username || 'Gebruiker'} is bijgewerkt als teamverantwoordelijke voor ${teamNames}`,
          });
        } else {
          toast({
            title: "Gebruiker bijgewerkt",
            description: `${formData.username || 'Gebruiker'} is bijgewerkt zonder teamkoppeling`,
          });
        }
      } else {
        // For non-player_manager roles, ensure no team assignments
        toast({
          title: "Gebruiker bijgewerkt",
          description: `${formData.username || 'Gebruiker'} is bijgewerkt als ${formData.role}`,
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

  const deleteUser = async (userId: number) => {
    try {
      // Try Edge Function first
      try {
        const { data: delResp, error: delErr } = await supabase.functions.invoke('delete-user', {
          body: { userId }
        });
        if (delErr || (delResp && delResp.error)) {
          throw new Error(delErr?.message || delResp?.error || 'Deletion failed');
        }
      } catch (edgeErr) {
        console.warn('Edge function delete-user unavailable, falling back to direct deletes:', edgeErr);
        // Fallback: perform direct deletes (order matters)
        const { error: teamUserError } = await supabase
          .from('team_users')
          .delete()
          .eq('user_id', userId);
        if (teamUserError) throw teamUserError;

        // Best-effort cleanup of reset tokens (may not exist)
        await supabase.from('password_reset_tokens').delete().eq('user_id', userId);

        const { error: userError } = await supabase
          .from('users')
          .delete()
          .eq('user_id', userId);
        if (userError) throw userError;
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

  return { addUser, updateUser, deleteUser };
};
