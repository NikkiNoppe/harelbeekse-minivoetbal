
import { supabase } from "@/integrations/supabase/client";
import { Team } from "./types";
import { useToast } from "@/hooks/use-toast";
import { hashPassword, generateRandomPassword } from "@/lib/passwordUtils";

export const useUserOperations = (teams: Team[], refreshData: () => Promise<void>) => {
  const { toast } = useToast();

  const addUser = async (newUser: {
    name: string;
    email: string | undefined;
    password: string; // Add password parameter
    role: "admin" | "referee" | "player_manager";
    teamId: number | null;
    teamIds?: number[];
  }) => {
    // Validate form
    if (!newUser.name) {
      toast({
        title: "Fout",
        description: "Naam is verplicht",
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
      // Hash the provided password
      const hashedPassword = await hashPassword(newUser.password);
      
      // Create user directly in users table with hashed password
      const { data, error } = await supabase
        .from('users')
        .insert({
          username: newUser.name,
          email: newUser.email || null,
          password: hashedPassword, // Store hashed password
          role: newUser.role
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error('No user data returned from creation');
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
            description: `${newUser.name} is toegevoegd als teamverantwoordelijke voor ${teamNames}.`,
            duration: 15000
          });
        } else {
          toast({
            title: "Gebruiker toegevoegd",
            description: `${newUser.name} is toegevoegd zonder teamkoppeling.`,
            duration: 15000
          });
        }
      } else {
        toast({
          title: "Gebruiker toegevoegd",
          description: `${newUser.name} is toegevoegd als ${newUser.role}.`,
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
        // Hash the password before storing
        const hashedPassword = await hashPassword(formData.password);
        updateData.password = hashedPassword;
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
