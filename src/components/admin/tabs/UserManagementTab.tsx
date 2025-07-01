
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserManagement } from "../user-management/useUserManagement";
import UserDialog from "@/components/user/UserDialog";
import UserList from "../user-management/UserList";
import ConfirmDeleteDialog from "../user-management/ConfirmDeleteDialog";
import UserSearchFilter from "../user-management/UserSearchFilter";
import { Plus } from "lucide-react";

const UserManagementTab: React.FC = () => {
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
  } = useUserManagement();
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Handle opening add dialog
  const handleOpenAddDialog = () => {
    setAddDialogOpen(true);
  };

  // Handle save for new user - return success status
  const handleSaveNewUser = async (formData: any) => {
    console.log('Saving new user with data:', formData);
    const success = await handleAddUser({
      name: formData.username,
      email: formData.email,
      role: formData.role,
      teamId: formData.teamId || null,
      teamIds: formData.teamIds || []
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Gebruikers Beheren</CardTitle>
            <CardDescription>Voeg nieuwe gebruikers toe en beheer hun toegang</CardDescription>
          </div>
          <Button 
            onClick={handleOpenAddDialog} 
            disabled={addingUser}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Nieuwe gebruiker
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="border-t pt-4">
              <UserSearchFilter 
                searchTerm={searchTerm}
                onSearchTermChange={handleSearchChange}
                roleFilter={roleFilter}
                onRoleFilterChange={handleRoleFilterChange}
                teamFilter={teamFilter}
                onTeamFilterChange={handleTeamFilterChange}
                teams={teams}
              />
              
              <UserList 
                users={users}
                loading={loading}
                isUpdating={updatingUser}
                isDeleting={deletingUser}
                onEditUser={handleOpenEditDialog}
                onDeleteUser={handleOpenDeleteConfirmation}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog 
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirmDelete={handleDeleteUser}
        isDeleting={deletingUser}
      />

      {/* Edit User Dialog */}
      {editingUser && (
        <UserDialog
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
          teams={teams.map(team => ({ id: team.team_id, name: team.team_name }))}
          isLoading={updatingUser}
        />
      )}

      {/* Add User Dialog */}
      <UserDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSave={handleSaveNewUser}
        teams={teams.map(team => ({ id: team.team_id, name: team.team_name }))}
        isLoading={addingUser}
      />
    </div>
  );
};

export default UserManagementTab;
