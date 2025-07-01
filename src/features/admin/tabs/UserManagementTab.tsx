
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";
import UserList from "../user-management/UserList";
import UserSearchFilter from "../user-management/UserSearchFilter";
import AddUserForm from "../user-management/AddUserForm";
import ConfirmDeleteDialog from "../user-management/ConfirmDeleteDialog";
import { useUserManagement } from "../user-management/useUserManagement";
import { useUserFilters } from "../user-management/useUserFilters";

const UserManagementTab: React.FC = () => {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const {
    users,
    teams,
    loading: isLoading,
    addingUser: isAddingUser,
    updatingUser: isUpdatingUser,
    deletingUser: isDeletingUser,
    handleAddUser: addUser,
    handleUpdateUser: updateUser,
    handleDeleteUser: deleteUser,
    handleOpenDeleteConfirmation: setUserToDelete
  } = useUserManagement();

  const {
    filteredUsers,
    searchTerm,
    roleFilter,
    teamFilter,
    handleSearchChange: setSearchTerm,
    handleRoleFilterChange: setRoleFilter,
    handleTeamFilterChange: setTeamFilter
  } = useUserFilters(users);

  const [userToDelete, setUserToDeleteState] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete);
      setUserToDeleteState(null);
    }
  };

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading users: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gebruikersbeheer</CardTitle>
              <CardDescription>
                Beheer alle gebruikers in het systeem
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddUserOpen(true)}>
              Nieuwe Gebruiker
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <UserSearchFilter
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
              teamFilter={teamFilter}
              onTeamFilterChange={setTeamFilter}
              teams={teams}
            />
            
            <UserList
              users={filteredUsers}
              isLoading={isLoading}
              onUpdateUser={updateUser}
              onDeleteUser={(userId) => setUserToDeleteState(userId)}
              isUpdatingUser={isUpdatingUser}
            />
          </div>
        </CardContent>
      </Card>

      <AddUserForm
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onAddUser={addUser}
        isAdding={isAddingUser}
      />

      <ConfirmDeleteDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDeleteState(null)}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={isDeletingUser}
      />
    </div>
  );
};

export default UserManagementTab;

