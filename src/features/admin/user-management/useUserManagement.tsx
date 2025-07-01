
import { useState, useEffect } from "react";
import { DbUser, Team } from "./types";
import { useUserDataService } from "./userDataService";
import { useUserOperations } from "./userOperations";
import { useUserFilters } from "./useUserFilters";

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
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  // Fetch data service
  const { fetchData } = useUserDataService();

  // Refresh data function
  async function refreshData() {
    console.log('Refreshing user management data');
    setLoading(true);
    try {
      const data = await fetchData();
      console.log('Setting users data:', data.users.length, 'users');
      console.log('Setting teams data:', data.teams.length, 'teams');
      setUsers(data.users);
      setTeams(data.teams);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }

  // User filtering
  const {
    filteredUsers,
    searchTerm,
    roleFilter,
    teamFilter,
    handleSearchChange,
    handleRoleFilterChange,
    handleTeamFilterChange
  } = useUserFilters(users);

  // User operations (add, update, delete) - fixed to pass only refreshData
  const { addUser, updateUser, deleteUser } = useUserOperations(refreshData);

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
    console.log('handleUpdateUser called with userId:', userId, 'formData:', formData);
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
    console.log('Opening delete confirmation for user:', userId);
    setUserToDelete(userId);
    setConfirmDialogOpen(true);
  };

  // Handle deleting a user
  const handleDeleteUser = async () => {
    if (userToDelete) {
      console.log('Starting deletion process for user:', userToDelete);
      setDeletingUser(true);
      const success = await deleteUser(userToDelete);
      setDeletingUser(false);
      if (success) {
        console.log('User deletion successful, closing dialogs');
        setConfirmDialogOpen(false);
        setUserToDelete(null);
      } else {
        console.log('User deletion failed');
      }
    }
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
