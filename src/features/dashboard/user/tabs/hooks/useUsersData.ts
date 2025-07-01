
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types/auth";
import { fetchUsersWithTeams, fetchTeams, fetchTeamUsers, saveUser, deleteUser } from "../services/userService";

interface Team {
  team_id: number;
  team_name: string;
}

interface TeamUser {
  user_id: number;
  team_id: number;
  team_name: string;
}

export const useUsersData = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [usersData, teamsData, teamUsersData] = await Promise.all([
        fetchUsersWithTeams(),
        fetchTeams(),
        fetchTeamUsers()
      ]);

      setUsers(usersData);
      setTeams(teamsData);
      setTeamUsers(teamUsersData);
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

  const handleSaveUser = async (formData: any, editingUser: User | null): Promise<boolean> => {
    try {
      await saveUser(formData, editingUser);
      
      toast({
        title: editingUser ? "Gebruiker bijgewerkt" : "Gebruiker toegevoegd",
        description: `${formData.username} is ${editingUser ? "bijgewerkt" : "toegevoegd"}`,
      });
      
      await fetchData();
      return true;
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan van de gebruiker",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await deleteUser(userId);
      
      toast({
        title: "Gebruiker verwijderd",
        description: "De gebruiker is verwijderd",
      });
      
      await fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van de gebruiker",
        variant: "destructive",
      });
    }
  };

  const getTeamName = (userId: number) => {
    const teamUser = teamUsers.find(tu => tu.user_id === userId);
    return teamUser ? teamUser.team_name : "-";
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    users,
    teams,
    loading,
    handleSaveUser,
    handleDeleteUser,
    getTeamName,
    refreshData: fetchData
  };
};
