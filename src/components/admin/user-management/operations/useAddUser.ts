
import { supabase } from "@/integrations/supabase/client";
import { Team } from "../types";
import { useToast } from "@/hooks/use-toast";

export const useAddUser = (teams: Team[], refreshData: () => Promise<void>) => {
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

  return { addUser };
};
