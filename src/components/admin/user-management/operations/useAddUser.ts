
import { supabase } from "@/integrations/supabase/client";
import { Team } from "../types";
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
      // Generate a secure random password
      const randomPassword = generateRandomPassword();
      console.log('Creating user with password length:', randomPassword.length);
      
      // Use the create_user_with_hashed_password function for secure password hashing
      const { data, error } = await supabase.rpc('create_user_with_hashed_password', {
        username_param: newUser.name,
        email_param: newUser.email,
        password_param: randomPassword,
        role_param: newUser.role
      });
      
      console.log('User creation result:', data);
      console.log('User creation error:', error);
      
      if (error) {
        console.error('Error creating user:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('No user data returned from creation function');
      }
      
      // If user is a player_manager, add team manager relationships
      if (data && newUser.role === "player_manager") {
        // Get team IDs to assign
        const teamIds = newUser.teamIds || (newUser.teamId ? [newUser.teamId] : []);
        
        if (teamIds.length > 0) {
          console.log('Adding team relationships for user_id:', data.user_id, 'teams:', teamIds);
          
          // Create entries in team_users table for each team
          const teamUserEntries = teamIds.map(teamId => ({
            user_id: data.user_id,
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
            title: "Gebruiker toegevoegd",
            description: `${newUser.name} is toegevoegd als teamverantwoordelijke voor ${teamNames}. Wachtwoord: ${randomPassword}`,
            duration: 15000 // Show longer so password can be copied
          });
        } else {
          toast({
            title: "Gebruiker toegevoegd",
            description: `${newUser.name} is toegevoegd zonder teamkoppeling. Wachtwoord: ${randomPassword}`,
            duration: 15000 // Show longer so password can be copied
          });
        }
      } else {
        toast({
          title: "Gebruiker toegevoegd",
          description: `${newUser.name} is toegevoegd als ${newUser.role}. Wachtwoord: ${randomPassword}`,
          duration: 15000 // Show longer so password can be copied
        });
      }
      
      console.log('User successfully created with ID:', data.user_id);
      
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
