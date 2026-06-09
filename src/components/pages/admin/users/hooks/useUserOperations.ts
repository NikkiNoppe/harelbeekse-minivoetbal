
import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionHeaders, getRpcSessionArgs } from "@/lib/authSession";
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
      const { data, error } = await supabase.rpc('create_user_for_session', {
        ...getRpcSessionArgs(),
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
      
      // Send welcome email with password setup link (no plaintext password)
      if (newUser.email && newUser.email.includes('@') && data?.user_id) {
        try {
          await supabase.functions.invoke('send-welcome-email', {
            body: {
              email: newUser.email,
              username: newUser.username,
              userId: data.user_id
            },
            headers: getEdgeFunctionHeaders(),
          });
        } catch (e) {
          console.warn('Kon welkomstmail niet verzenden:', e);
        }
      }

      // Add team assignments for player_manager role
      if (data && newUser.role === "player_manager") {
        const teamIds = newUser.teamIds || (newUser.teamId ? [newUser.teamId] : []);
        
        if (teamIds.length > 0) {
          const { data: teamLinkResult, error: teamUserError } = await supabase.rpc(
            'manage_team_user_for_session',
            {
              ...getRpcSessionArgs(),
              p_operation: 'assign_many',
              p_user_id: data.user_id,
              p_team_ids: teamIds,
            } as any,
          );

          if (teamUserError) {
            throw teamUserError;
          }
          if (!(teamLinkResult as { success?: boolean })?.success) {
            throw new Error('Teamkoppeling mislukt');
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
        const { error: pwdError } = await supabase.rpc('update_user_password_for_session', {
          ...getRpcSessionArgs(),
          user_id_param: userId,
          new_password: formData.password
        });
        if (pwdError) {
          throw pwdError;
        }
      }
      
      const { data: updateResult, error: userError } = await supabase.rpc(
        'update_user_for_session',
        {
          ...getRpcSessionArgs(),
          p_user_id: userId,
          p_username: updateData.username,
          p_email: updateData.email,
          p_role: updateData.role,
        },
      );

      if (userError) {
        throw userError;
      }
      if (!(updateResult as { success?: boolean })?.success) {
        throw new Error('Gebruiker niet bijgewerkt');
      }

      if (formData.role === "player_manager") {
        const teamIds = formData.teamIds || (formData.teamId ? [formData.teamId] : []);

        if (teamIds.length > 0) {
          const { error: teamUserError } = await supabase.rpc('manage_team_user_for_session', {
            ...getRpcSessionArgs(),
            p_operation: 'assign_many',
            p_user_id: userId,
            p_team_ids: teamIds,
          } as any);

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
          await supabase.rpc('manage_team_user_for_session', {
            ...getRpcSessionArgs(),
            p_operation: 'remove',
            p_user_id: userId,
          } as any);
          toast({
            title: "Gebruiker bijgewerkt",
            description: `${formData.username || 'Gebruiker'} is bijgewerkt zonder teamkoppeling`,
          });
        }
      } else {
        await supabase.rpc('manage_team_user_for_session', {
          ...getRpcSessionArgs(),
          p_operation: 'remove',
          p_user_id: userId,
        } as any);
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
          body: { userId },
          headers: getEdgeFunctionHeaders(),
        });
        if (delErr || (delResp && delResp.error)) {
          throw new Error(delErr?.message || delResp?.error || 'Deletion failed');
        }
      } catch (edgeErr) {
        const { data: delResult, error: rpcDelErr } = await supabase.rpc('delete_user_for_session', {
          ...getRpcSessionArgs(),
          p_user_id: userId,
        });
        if (rpcDelErr || !(delResult as { success?: boolean })?.success) {
          throw edgeErr;
        }
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
