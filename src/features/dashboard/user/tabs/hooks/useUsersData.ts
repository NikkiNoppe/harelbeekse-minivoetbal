
import { useState, useEffect } from "react";
import { supabase } from "@shared/integrations/supabase/client";
import { useToast } from "@shared/hooks/use-toast";
import { User } from "@shared/types/auth";

interface Team {
  team_id: number;
  team_name: string;
}

export const useUsersData = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('username');

      if (usersError) throw usersError;

      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .order('team_name');
      
      if (teamsError) throw teamsError;
      
      setTeams(teamsData || []);

      // Transform users data
      const transformedUsers: User[] = (usersData || []).map(user => ({
        id: user.user_id,
        username: user.username,
        email: user.email || '',
        password: '',
        role: user.role,
        teamId: undefined // Will be set by team relationships
      }));

      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Fout bij laden",
        description: "Er is een fout opgetreden bij het laden van de gegevens.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveUser = async (formData: any, editingUser: User | null): Promise<boolean> => {
    try {
      if (editingUser) {
        // Update existing user
        const { error: userError } = await supabase
          .from('users')
          .update({
            username: formData.username,
            role: formData.role,
            email: formData.email || null
          })
          .eq('user_id', editingUser.id);

        if (userError) throw userError;
        
        toast({
          title: "Gebruiker bijgewerkt",
          description: `${formData.username} is bijgewerkt`,
        });
      } else {
        // Add new user
        const { error: createError } = await supabase
          .from('users')
          .insert({
            username: formData.username,
            email: formData.email || null,
            password: formData.password,
            role: formData.role
          });

        if (createError) throw createError;
        
        toast({
          title: "Gebruiker toegevoegd",
          description: `${formData.username} is toegevoegd`,
        });
      }
      
      await fetchData();
      return true;
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan van de gebruiker",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDeleteUser = async (userId: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Gebruiker verwijderd",
        description: "De gebruiker is succesvol verwijderd",
      });

      await fetchData();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de gebruiker",
        variant: "destructive",
      });
      return false;
    }
  };

  const getTeamName = (teamId: number | undefined) => {
    if (!teamId) return "-";
    const team = teams.find(t => t.team_id === teamId);
    return team ? team.team_name : `Team ${teamId}`;
  };

  return {
    users,
    teams,
    loading,
    handleSaveUser,
    handleDeleteUser,
    getTeamName
  };
};
