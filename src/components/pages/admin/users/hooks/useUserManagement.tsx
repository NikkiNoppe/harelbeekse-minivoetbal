
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DbUser, Team } from "../userTypes";
import { useUserOperations } from "./useUserOperations";

// Function to generate a secure random password
const generateRandomPassword = (length: number = 12): string => {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

export const useUserManagement = () => {
  // State for user data and operations
  const [users, setUsers] = useState<DbUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingUser, setAddingUser] = useState(false);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<DbUser | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<DbUser | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");

  // Fetch data service
  const fetchData = async () => {
    try {
      // Fetch users with their team relationships
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          user_id,
          username,
          email,
          role,
          team_users!left (
            team_id,
            teams!team_users_team_id_fkey (
              team_id,
              team_name
            )
          )
        `)
        .order('username');

      if (usersError) {
        throw usersError;
      }

      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .order('team_name');

      if (teamsError) {
        throw teamsError;
      }

      // Transform users data to include team information
      const transformedUsers: DbUser[] = (usersData || []).map(user => {
        const teamUsers = user.team_users || [];
        const teams = teamUsers.map(tu => ({
          team_id: tu.teams?.team_id || 0,
          team_name: tu.teams?.team_name || ''
        })).filter(t => t.team_id > 0);
        
        return {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
          team_id: teams.length > 0 ? teams[0].team_id : null,
          team_name: teams.length > 0 ? teams[0].team_name : null,
          teams: teams
        };
      });

      return {
        users: transformedUsers,
        teams: teamsData as Team[] || []
      };
    } catch (error) {
      console.error('Error in fetchData:', error);
      return {
        users: [],
        teams: []
      };
    }
  };

  // Refresh data function
  async function refreshData() {
    setLoading(true);
    try {
      const data = await fetchData();
      setUsers(data.users);
      setTeams(data.teams);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter users based on search term and filters
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

  // User operations (add, update, delete)
  const { addUser, updateUser, deleteUser } = useUserOperations(teams, refreshData);

  // Fetch users and teams on component mount
  useEffect(() => {
    refreshData();
  }, []);

  // Handle opening the edit dialog
  const handleOpenEditDialog = (user: DbUser) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  // Handle adding a new user - return success status
  const handleAddUser = async (formData: any) => {
    setAddingUser(true);
    const success = await addUser(formData);
    setAddingUser(false);
    return success;
  };

  // Handle updating a user - return success status
  const handleUpdateUser = async (userId: number, formData: any) => {
    setUpdatingUser(true);
    const success = await updateUser(userId, formData);
    setUpdatingUser(false);
    if (success) {
      setEditDialogOpen(false);
      setEditingUser(null);
    }
    return success;
  };

  // Handle opening the delete confirmation dialog
  const handleOpenDeleteConfirmation = (userId: number) => {
    const user = users.find(u => u.user_id === userId);
    setUserToDelete(user || null);
    setConfirmDialogOpen(true);
  };

  // Handle deleting a user from confirm dialog (uses stored userToDelete)
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    const success = await deleteUser(userToDelete.user_id);
    setDeletingUser(false);
    if (success) {
      setConfirmDialogOpen(false);
      setUserToDelete(null);
    }
  };

  // Direct delete by id (for components that handle their own confirm UI)
  const handleDeleteUserById = async (userId: number) => {
    setDeletingUser(true);
    const success = await deleteUser(userId);
    setDeletingUser(false);
    return success;
  };

  return {
    users: filteredUsers,
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
    userToDelete,
    searchTerm,
    roleFilter,
    teamFilter,
    handleSearchChange: setSearchTerm,
    handleRoleFilterChange: setRoleFilter,
    handleTeamFilterChange: setTeamFilter,
    handleAddUser,
    handleOpenEditDialog,
    handleUpdateUser,
    handleOpenDeleteConfirmation,
    handleDeleteUser,
    handleDeleteUserById,
  };
};
