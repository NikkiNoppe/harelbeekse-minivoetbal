
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DbUser {
  user_id: number;
  username: string;
  role: string;
  team_id?: number | null;
  team_name?: string | null;
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

  // Fetch users and teams from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('team_id, team_name')
          .order('team_name');
        
        if (teamsError) throw teamsError;
        
        // Fetch users with team names
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select(`
            user_id,
            username,
            role,
            teams (
              team_id,
              team_name
            )
          `);
        
        if (usersError) throw usersError;
        
        // Transform the data - use a more specific casting approach
        const formattedUsers: DbUser[] = (usersData as unknown as UserWithTeam[]).map(user => {
          // Extract team info from the first team if teams is an array with data
          const teamData = user.teams && user.teams.length > 0 ? user.teams[0] : null;
          return {
            user_id: user.user_id,
            username: user.username,
            role: user.role,
            team_id: teamData ? teamData.team_id : null,
            team_name: teamData ? teamData.team_name : null
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
    }
    
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
        (teamFilter === "none" ? user.team_id === null : 
        user.team_id === parseInt(teamFilter));
      
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
    
    if (newUser.role === "player_manager" && !newUser.teamId) {
      toast({
        title: "Fout",
        description: "Selecteer een team voor deze gebruiker",
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
          // Note: team_id would be managed through a separate relationship
        })
        .select();
      
      if (error) throw error;
      
      if (data && data[0] && newUser.role === "player_manager" && newUser.teamId) {
        // Update team with manager reference if user is a team manager
        const { error: teamError } = await supabase
          .from('teams')
          .update({ player_manager_id: data[0].user_id })
          .eq('team_id', newUser.teamId);
        
        if (teamError) throw teamError;
      }
      
      toast({
        title: "Gebruiker toegevoegd",
        description: `${newUser.name} is toegevoegd als gebruiker.`
      });
      
      // Refresh user list
      refreshUsers();
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
      
      // Handle team association if user is a player_manager
      if (formData.role === "player_manager") {
        // First, remove any existing team association for this user
        if (editingUser.team_id) {
          const { error: resetError } = await supabase
            .from('teams')
            .update({ player_manager_id: null })
            .eq('player_manager_id', editingUser.user_id);
          
          if (resetError) throw resetError;
        }
        
        // Then, set the new team association
        if (formData.teamId) {
          const { error: teamError } = await supabase
            .from('teams')
            .update({ player_manager_id: editingUser.user_id })
            .eq('team_id', formData.teamId);
          
          if (teamError) throw teamError;
        }
      } else if (editingUser.team_id) {
        // If user is no longer a player_manager, remove any team association
        const { error: resetError } = await supabase
          .from('teams')
          .update({ player_manager_id: null })
          .eq('player_manager_id', editingUser.user_id);
        
        if (resetError) throw resetError;
      }
      
      toast({
        title: "Gebruiker bijgewerkt",
        description: `${formData.username} is bijgewerkt.`
      });
      
      // Refresh user list
      refreshUsers();
      
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
      
      // First, check if this user is a player_manager for any team
      const { data: teamData } = await supabase
        .from('teams')
        .select('team_id')
        .eq('player_manager_id', selectedUserId);
      
      // If they are a player_manager, remove the reference from the team
      if (teamData && teamData.length > 0) {
        const { error: teamError } = await supabase
          .from('teams')
          .update({ player_manager_id: null })
          .eq('player_manager_id', selectedUserId);
        
        if (teamError) throw teamError;
      }
      
      // Now delete the user
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('user_id', selectedUserId);
      
      if (error) throw error;
      
      setUsers(prev => prev.filter(user => user.user_id !== selectedUserId));
      
      toast({
        title: "Gebruiker verwijderd",
        description: "De gebruiker is succesvol verwijderd"
      });
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

  const refreshUsers = async () => {
    try {
      // Refresh user list
      const { data: refreshedUsers, error: refreshError } = await supabase
        .from('users')
        .select(`
          user_id,
          username,
          role,
          teams (
            team_id,
            team_name
          )
        `);
      
      if (refreshError) throw refreshError;

      if (refreshedUsers) {
        // Use the same approach for type casting and data transformation as above
        const formattedUsers: DbUser[] = (refreshedUsers as unknown as UserWithTeam[]).map(user => {
          // Extract team info from the first team if teams is an array with data
          const teamData = user.teams && user.teams.length > 0 ? user.teams[0] : null;
          return {
            user_id: user.user_id,
            username: user.username,
            role: user.role,
            team_id: teamData ? teamData.team_id : null,
            team_name: teamData ? teamData.team_name : null
          };
        });
        
        setUsers(formattedUsers);
      }
    } catch (error: any) {
      console.error('Error refreshing users:', error);
      toast({
        title: "Fout bij vernieuwen",
        description: `Er is een fout opgetreden bij het vernieuwen van gebruikersgegevens: ${error.message || 'Onbekende fout'}`,
        variant: "destructive",
      });
    }
  };

  return {
    users: filteredUsers, // Return filtered users instead of all users
    allUsers: users, // Also provide access to unfiltered users if needed
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
