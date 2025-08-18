
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUserManagement } from "./hooks/useUserManagement";
import UserModal from "@/components/user/UserModal";
import UserListTable from "./components/UserListTable";


import { Plus } from "lucide-react";

const AdminUserPage: React.FC = () => {
  const {
    users,
    teams,
    loading,
    addingUser,
    updatingUser,
    deletingUser,
    editDialogOpen,
    setEditDialogOpen,
    editingUser,
    searchTerm,
    roleFilter,
    teamFilter,
    handleSearchChange,
    handleRoleFilterChange,
    handleTeamFilterChange,
    handleAddUser,
    handleOpenEditDialog,
    handleUpdateUser,
    handleDeleteUser,
    handleDeleteUserById,
  } = useUserManagement();
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [passwordEmailNote, setPasswordEmailNote] = useState("");

  // Memoize team options to avoid re-creating arrays each render (prevents modal resets)
  const teamOptions = useMemo(
    () => teams.map(team => ({ id: team.team_id, name: team.team_name })),
    [teams]
  );

  // Handle opening add dialog
  const handleOpenAddDialog = () => {
    setAddDialogOpen(true);
  };

  // Handle save for new user - return success status
  const handleSaveNewUser = async (formData: any) => {
    console.log('Saving new user with data:', formData);
    const success = await handleAddUser({
      username: formData.username,
      email: formData.email,
      password: formData.password, // Pass the password
      role: formData.role,
      teamId: formData.teamId || null,
      teamIds: formData.teamIds || [],
      passwordNote: passwordEmailNote || undefined
    });
    
    if (success) {
      setAddDialogOpen(false);
    }
    
    return success;
  };

  // Handle save for editing user - return success status
  const handleSaveEditUser = async (formData: any) => {
    if (editingUser) {
      console.log('Saving edited user with data:', formData, 'for user ID:', editingUser.user_id);
      const success = await handleUpdateUser(editingUser.user_id, formData);
      return success;
    }
    return false;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Gebruikers Beheer</h1>
        <p className="text-gray-600 dark:text-gray-400">Beheer alle gebruikers in het systeem</p>
      </div>

      {/* Users List */}
      <UserListTable 
        users={users}
        loading={loading}
        isUpdating={updatingUser}
        isDeleting={deletingUser}
        onEditUser={handleOpenEditDialog}
        onDeleteUser={handleDeleteUserById}
        editMode={true}
        searchTerm={searchTerm}
        onSearchTermChange={handleSearchChange}
        roleFilter={roleFilter}
        onRoleFilterChange={handleRoleFilterChange}
        teamFilter={teamFilter}
        onTeamFilterChange={handleTeamFilterChange}
        teams={teams}
        addUserButton={
          <Button
            onClick={handleOpenAddDialog}
            disabled={addingUser}
            className="btn btn--outline flex items-center gap-2"
          >
            <Plus size={16} />
            Gebruiker toevoegen
          </Button>
        }
      />
      

      {/* Edit User Dialog */}
      {editingUser && (
        <UserModal
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          editingUser={{
            id: editingUser.user_id,
            username: editingUser.username,
            email: editingUser.email,
            password: "",
            role: editingUser.role as "admin" | "referee" | "player_manager",
            teamId: editingUser.team_id || undefined,
            teams: editingUser.teams
          }}
          onSave={handleSaveEditUser}
          teams={teamOptions}
          isLoading={updatingUser}
        />
      )}

      {/* Add User Dialog */}
      <UserModal
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSave={handleSaveNewUser}
        teams={teamOptions}
        isLoading={addingUser}
        passwordEmailNote={passwordEmailNote}
        onPasswordEmailNoteChange={setPasswordEmailNote}
      />
    </div>
  );
};

export default AdminUserPage;
