
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserManagement } from "../user-management/useUserManagement";
import UserDialog from "@/components/user/UserDialog";
import UserList from "../user-management/UserList";
import ConfirmDeleteDialog from "../user-management/ConfirmDeleteDialog";
import UserSearchFilter from "../user-management/UserSearchFilter";
import { Plus, Edit, Save, Users } from "lucide-react";

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
  const [editMode, setEditMode] = useState(false);

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
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Gebruikers Beheer
        </h2>
      </div>

      <section>
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">
                  Beheer alle gebruikers in het systeem
                </CardTitle>
                <CardDescription>
                  Voeg nieuwe gebruikers toe en beheer hun toegang tot verschillende functies.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <UserSearchFilter 
                searchTerm={searchTerm}
                onSearchTermChange={handleSearchChange}
                roleFilter={roleFilter}
                onRoleFilterChange={handleRoleFilterChange}
                teamFilter={teamFilter}
                onTeamFilterChange={handleTeamFilterChange}
                teams={teams}
              />
            </div>
            <UserList 
              users={users}
              loading={loading}
              isUpdating={updatingUser}
              isDeleting={deletingUser}
              onEditUser={handleOpenEditDialog}
              onDeleteUser={handleOpenDeleteConfirmation}
              editMode={true}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              onClick={handleOpenAddDialog}
              disabled={addingUser}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Gebruiker toevoegen
            </Button>
          </CardFooter>
        </Card>
      </section>
      
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
