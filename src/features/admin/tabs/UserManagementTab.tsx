
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
    loading,
    addingUser,
    updatingUser,
    deletingUser,
    handleAddUser,
    handleUpdateUser,
    handleOpenDeleteConfirmation,
    handleDeleteUser,
  } = useUserManagement();

  const {
    filteredUsers,
    searchTerm,
    roleFilter,
    teamFilter,
    handleSearchChange,
    handleRoleFilterChange,
    handleTeamFilterChange
  } = useUserFilters(users);

  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const handleConfirmDelete = () => {
    if (userToDelete) {
      handleDeleteUser();
      setUserToDelete(null);
    }
  };

  const handleDeleteUser = (userId: number) => {
    setUserToDelete(userId);
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
              onSearchTermChange={handleSearchChange}
              roleFilter={roleFilter}
              onRoleFilterChange={handleRoleFilterChange}
              teamFilter={teamFilter}
              onTeamFilterChange={handleTeamFilterChange}
              teams={teams}
            />
            
            <UserList
              users={filteredUsers}
              loading={loading}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              isUpdatingUser={updatingUser}
            />
          </div>
        </CardContent>
      </Card>

      <AddUserForm
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onAddUser={handleAddUser}
        isAdding={addingUser}
      />

      <ConfirmDeleteDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={deletingUser}
      />
    </div>
  );
};

export default UserManagementTab;
