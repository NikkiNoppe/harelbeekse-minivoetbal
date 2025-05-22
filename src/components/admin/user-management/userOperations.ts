
import { supabase } from "@/integrations/supabase/client";
import { DbUser, Team, NewUser } from "./types";
import { useToast } from "@/hooks/use-toast";

export const useUserOperations = (teams: Team[], refreshData: () => Promise<void>) => {
  const { toast } = useToast();

  // Add a new user
  const addUser = async (newUser: NewUser) => {
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
      // Insert new user into Supabase
      const { data, error } = await supabase
        .from('users')
        .insert({
          username: newUser.name,
          password: 'temporary_password', // In a real app, this would be handled more securely
          role: newUser.role,
        })
        .select();
      
      if (error) throw error;
      
      // If user is a player_manager, add team manager relationships
      if (data && data[0] && newUser.role === "player_manager") {
        // Get team IDs to assign
        const teamIds = newUser.teamIds || (newUser.teamId ? [newUser.teamId] : []);
        
        if (teamIds.length > 0) {
          // Create entries in team_managers table for each team
          const teamManagerEntries = teamIds.map(teamId => ({
            user_id: data[0].user_id,
            team_id: teamId
          }));
          
          const { error: teamManagerError } = await supabase
            .from('team_managers')
            .insert(teamManagerEntries);
          
          if (teamManagerError) throw teamManagerError;
          
          // Get team names for toast message
          const teamNames = teams
            .filter(team => teamIds.includes(team.team_id))
            .map(team => team.team_name)
            .join(", ");
          
          toast({
            title: "Gebruiker toegevoegd",
            description: `${newUser.name} is toegevoegd als teamverantwoordelijke voor ${teamNames}.`
          });
        } else {
          toast({
            title: "Gebruiker toegevoegd",
            description: `${newUser.name} is toegevoegd zonder teamkoppeling.`
          });
        }
      } else {
        toast({
          title: "Gebruiker toegevoegd",
          description: `${newUser.name} is toegevoegd als ${newUser.role}.`
        });
      }
      
      // Refresh user list
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

  // Update an existing user
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
          .from('team_managers')
          .delete()
          .eq('user_id', userId);
        
        if (resetError) throw resetError;
        
        // Then, add new team associations
        const teamIds = Array.isArray(formData.teamIds) ? formData.teamIds : 
                      (formData.teamId ? [formData.teamId] : []);
        
        if (teamIds.length > 0) {
          const teamManagerEntries = teamIds.map(teamId => ({
            user_id: userId,
            team_id: parseInt(teamId)
          }));
          
          const { error: teamManagerError } = await supabase
            .from('team_managers')
            .insert(teamManagerEntries);
          
          if (teamManagerError) throw teamManagerError;
          
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
          .from('team_managers')
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
  
  // Delete a user
  const deleteUser = async (userId: number) => {
    try {
      // First, remove any team manager relationships
      const { error: teamManagerError } = await supabase
        .from('team_managers')
        .delete()
        .eq('user_id', userId);
      
      if (teamManagerError) throw teamManagerError;
      
      // Now delete the user
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
      
      toast({
        title: "Gebruiker verwijderd",
        description: "De gebruiker is succesvol verwijderd"
      });
      
      // Refresh the user list to ensure we have the latest data
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
