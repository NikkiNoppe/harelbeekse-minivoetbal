
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DbUser {
  user_id: number;
  username: string;
  role: string;
  team_id?: number | null;
  team_name?: string | null;
  teams?: { team_id: number; team_name: string }[];
}

interface Team {
  team_id: number;
  team_name: string;
}

// Update UserWithTeam to correctly define the teams property as an array
interface UserWithTeam {
  user_id: number;
  username: string;
  role: string;
  teams: Team[] | null;
}

export const useUserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<DbUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<DbUser | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");

  // Adding operation-specific loading states
  const [addingUser, setAddingUser] = useState(false);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  // Function to fetch both users and teams data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .order('team_name');
      
      if (teamsError) throw teamsError;
      
      // Fetch users with their teams
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          user_id,
          username,
          role
        `);
      
      if (usersError) throw usersError;
      
      // Fetch team managers relationships
      const { data: teamManagersData, error: teamManagersError } = await supabase
        .from('team_managers')
        .select(`
          user_id,
          team_id,
          teams (
            team_id,
            team_name
          )
        `);
      
      if (teamManagersError) throw teamManagersError;
      
      // Map team manager data to organize by user_id
      const userTeamsMap: Record<number, { team_id: number; team_name: string }[]> = {};
      
      teamManagersData.forEach((manager) => {
        if (!userTeamsMap[manager.user_id]) {
          userTeamsMap[manager.user_id] = [];
        }
        
        if (manager.teams) {
          userTeamsMap[manager.user_id].push({
            team_id: manager.teams.team_id,
            team_name: manager.teams.team_name
          });
        }
      });
      
      // Combine user data with team data
      const formattedUsers: DbUser[] = usersData.map(user => {
        const userTeams = userTeamsMap[user.user_id] || [];
        
        // For backwards compatibility, set the first team as the main team
        const mainTeam = userTeams.length > 0 ? userTeams[0] : null;
        
        return {
          user_id: user.user_id,
          username: user.username,
          role: user.role,
          team_id: mainTeam ? mainTeam.team_id : null,
          team_name: mainTeam ? mainTeam.team_name : null,
          teams: userTeams.length > 0 ? userTeams : []
        };
      });
      
      setTeams(teamsData || []);
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Fout bij laden",
        description: "Er is een fout opgetreden bij het laden van gebruikersgegevens.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch users and teams from Supabase
  useEffect(() => {
    fetchData();
  }, [toast]);

  // Apply filters to users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Text search filter (case insensitive)
      const matchesSearch = searchTerm === "" || 
        user.username.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Role filter
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      
      // Team filter
      const matchesTeam = teamFilter === "all" || 
        (teamFilter === "none" ? 
          (!user.teams || user.teams.length === 0) : 
          (user.teams && user.teams.some(team => team.team_id === parseInt(teamFilter)))
        );
      
      return matchesSearch && matchesRole && matchesTeam;
    });
  }, [users, searchTerm, roleFilter, teamFilter]);
  
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role);
  };

  const handleTeamFilterChange = (teamId: string) => {
    setTeamFilter(teamId);
  };

  const handleAddUser = async (newUser: {
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
      return;
    }
    
    if (newUser.role === "player_manager" && !newUser.teamIds?.length && !newUser.teamId) {
      toast({
        title: "Fout",
        description: "Selecteer ten minste één team voor deze gebruiker",
        variant: "destructive"
      });
      return;
    }
    
    if (!newUser.email.includes('@')) {
      toast({
        title: "Fout",
        description: "Vul een geldig e-mailadres in",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setAddingUser(true);
      
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
      await fetchData();
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: "Fout",
        description: `Er is een fout opgetreden bij het toevoegen van de gebruiker: ${error.message || 'Onbekende fout'}`,
        variant: "destructive"
      });
    } finally {
      setAddingUser(false);
    }
  };

  const handleOpenEditDialog = (user: DbUser) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };
  
  const handleUpdateUser = async (formData: any) => {
    if (!editingUser) return;
    
    try {
      setUpdatingUser(true);
      
      // Update user in Supabase
      const { error } = await supabase
        .from('users')
        .update({
          username: formData.username,
          ...(formData.password ? { password: formData.password } : {}),
          role: formData.role,
        })
        .eq('user_id', editingUser.user_id);
      
      if (error) throw error;
      
      // Handle team associations if user is a player_manager
      if (formData.role === "player_manager") {
        // First, remove any existing team associations for this user
        const { error: resetError } = await supabase
          .from('team_managers')
          .delete()
          .eq('user_id', editingUser.user_id);
        
        if (resetError) throw resetError;
        
        // Then, add new team associations
        const teamIds = Array.isArray(formData.teamIds) ? formData.teamIds : 
                      (formData.teamId ? [formData.teamId] : []);
        
        if (teamIds.length > 0) {
          const teamManagerEntries = teamIds.map(teamId => ({
            user_id: editingUser.user_id,
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
      } else if (editingUser.teams && editingUser.teams.length > 0) {
        // If user is no longer a player_manager, remove any team associations
        const { error: resetError } = await supabase
          .from('team_managers')
          .delete()
          .eq('user_id', editingUser.user_id);
        
        if (resetError) throw resetError;
        
        toast({
          title: "Gebruiker bijgewerkt",
          description: `${formData.username} is bijgewerkt. Teamkoppelingen zijn verwijderd omdat de gebruiker geen teamverantwoordelijke meer is.`
        });
      } else {
        toast({
          title: "Gebruiker bijgewerkt",
          description: `${formData.username} is bijgewerkt.`
        });
      }
      
      // Refresh user list to show updated data
      await fetchData();
      
      setEditDialogOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Fout",
        description: `Er is een fout opgetreden bij het bijwerken van de gebruiker: ${error.message || 'Onbekende fout'}`,
        variant: "destructive"
      });
    } finally {
      setUpdatingUser(false);
    }
  };
  
  const handleOpenDeleteConfirmation = (userId: number) => {
    setSelectedUserId(userId);
    setConfirmDialogOpen(true);
  };
  
  const handleDeleteUser = async () => {
    if (selectedUserId === null) return;
    
    try {
      setDeletingUser(true);
      
      // First, remove any team manager relationships
      const { error: teamManagerError } = await supabase
        .from('team_managers')
        .delete()
        .eq('user_id', selectedUserId);
      
      if (teamManagerError) throw teamManagerError;
      
      // Now delete the user
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('user_id', selectedUserId);
      
      if (error) throw error;
      
      // Update the state to reflect the deletion
      setUsers(prev => prev.filter(user => user.user_id !== selectedUserId));
      
      toast({
        title: "Gebruiker verwijderd",
        description: "De gebruiker is succesvol verwijderd"
      });
      
      // Refresh the user list to ensure we have the latest data
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Fout",
        description: `Er is een fout opgetreden bij het verwijderen van de gebruiker: ${error.message || 'Onbekende fout'}`,
        variant: "destructive"
      });
    } finally {
      setDeletingUser(false);
      setConfirmDialogOpen(false);
      setSelectedUserId(null);
    }
  };

  return {
    users: filteredUsers,
    allUsers: users,
    teams,
    loading,
    addingUser,
    updatingUser,
    deletingUser,
    editDialogOpen,
    setEditDialogOpen,
    editingUser,
    confirmDialogOpen,
    setConfirmDialogOpen,
    searchTerm,
    roleFilter,
    teamFilter,
    handleSearchChange,
    handleRoleFilterChange,
    handleTeamFilterChange,
    handleAddUser,
    handleOpenEditDialog,
    handleUpdateUser,
    handleOpenDeleteConfirmation,
    handleDeleteUser,
  };
};
