
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";
import { UserList } from "../user-management/UserList";
import { UserSearchFilter } from "../user-management/UserSearchFilter";
import { AddUserForm } from "../user-management/AddUserForm";
import { ConfirmDeleteDialog } from "../user-management/ConfirmDeleteDialog";
import { useUserManagement } from "../user-management/useUserManagement";
import { useUserFilters } from "../user-management/useUserFilters";

const UserManagementTab: React.FC = () => {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const {
    users,
    isLoading,
    error,
    addUser,
    updateUser,
    deleteUser,
    isAddingUser,
    isUpdatingUser,
    isDeletingUser,
    userToDelete,
    setUserToDelete
  } = useUserManagement();

  const {
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    filteredUsers
  } = useUserFilters(users);

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
              setSearchTerm={setSearchTerm}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
            />
            
            <UserList
              users={filteredUsers}
              isLoading={isLoading}
              onUpdateUser={updateUser}
              onDeleteUser={setUserToDelete}
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
        user={userToDelete}
        onConfirm={deleteUser}
        onCancel={() => setUserToDelete(null)}
        isDeleting={isDeletingUser}
      />
    </div>
  );
};

export default UserManagementTab;
