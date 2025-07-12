
import { supabase } from "@/integrations/supabase/client";
import { Team } from "./types";
import { useToast } from "@/hooks/use-toast";

// Function to generate a secure random password
const generateRandomPassword = (length: number = 12): string => {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

export const useUserOperations = (teams: Team[], refreshData: () => Promise<void>) => {
  const { toast } = useToast();

  const addUser = async (newUser: {
    name: string;
    email: string;
    role: "admin" | "referee" | "player_manager";
    teamId: number | null;
    teamIds?: number[];
  }) => {
    // Validate form
    if (!newUser.name || !newUser.email) {
      toast({
        title: "Fout",
        description: "Naam en e-mail zijn verplicht",
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
    
    if (!newUser.email.includes('@')) {
      toast({
        title: "Fout",
        description: "Vul een geldig e-mailadres in",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      const randomPassword = generateRandomPassword();
      
      // Create user with hashed password
      const { data, error } = await supabase.rpc('create_user_with_hashed_password', {
        username_param: newUser.name,
        email_param: newUser.email,
        password_param: randomPassword,
        role_param: newUser.role
      });
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error('No user data returned from creation function');
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
            description: `${newUser.name} is toegevoegd als teamverantwoordelijke voor ${teamNames}. Wachtwoord: ${randomPassword}`,
            duration: 15000
          });
        } else {
          toast({
            title: "Gebruiker toegevoegd",
            description: `${newUser.name} is toegevoegd zonder teamkoppeling. Wachtwoord: ${randomPassword}`,
            duration: 15000
          });
        }
      } else {
        toast({
          title: "Gebruiker toegevoegd",
          description: `${newUser.name} is toegevoegd als ${newUser.role}. Wachtwoord: ${randomPassword}`,
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

  return { addUser, updateUser, deleteUser };
};
