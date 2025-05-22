
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
  const [deletingUser, setDeleteingUser] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<DbUser | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  // Fetch data service
  const { fetchData } = useUserDataService();

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

  // User operations (add, update, delete)
  const { addUser, updateUser, deleteUser } = useUserOperations(teams, refreshData);

  // Fetch users and teams on component mount
  useEffect(() => {
    refreshData();
  }, []);

  // Refresh data function
  async function refreshData() {
    setLoading(true);
    const data = await fetchData();
    setUsers(data.users);
    setTeams(data.teams);
    setLoading(false);
  }

  // Handle opening the edit dialog
  const handleOpenEditDialog = (user: DbUser) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  // Handle adding a new user
  const handleAddUser = async (formData: any) => {
    setAddingUser(true);
    const success = await addUser(formData);
    setAddingUser(false);
    return success;
  };

  // Handle updating a user
  const handleUpdateUser = async (formData: any) => {
    if (editingUser) {
      setUpdatingUser(true);
      const success = await updateUser(editingUser.user_id, formData);
      setUpdatingUser(false);
      if (success) {
        setEditDialogOpen(false);
      }
    }
  };

  // Handle opening the delete confirmation dialog
  const handleOpenDeleteConfirmation = (userId: number) => {
    setUserToDelete(userId);
    setConfirmDialogOpen(true);
  };

  // Handle deleting a user
  const handleDeleteUser = async () => {
    if (userToDelete) {
      setDeleteingUser(true);
      const success = await deleteUser(userToDelete);
      setDeleteingUser(false);
      if (success) {
        setConfirmDialogOpen(false);
        setUserToDelete(null);
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
