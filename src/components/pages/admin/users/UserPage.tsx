
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUserManagement } from "./hooks/useUserManagement";
import { UserModal } from "@/components/modals";
import UserListTable from "./components/UserListTable";
import { Plus, AlertCircle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout";

const AdminUserPage: React.FC = () => {
  const {
    users,
    teams,
    loading,
    error,
    refreshData,
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
    <div className="space-y-4 sm:space-y-6 animate-slide-up">
      <PageHeader
        title="Gebruikersbeheer"
        subtitle={`Beheer accounts, rollen en teamkoppelingen binnen deze organisatie (${users.length} gebruiker${users.length === 1 ? "" : "s"})`}
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Opnieuw proberen
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
            className="min-h-[44px] w-full sm:w-auto"
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
      />
    </div>
  );
};

export default AdminUserPage;
