
import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useUserManagement } from "../user-management/useUserManagement";
import UserDialog from "@/components/user/UserDialog";
import AddUserForm from "../user-management/AddUserForm";
import UserList from "../user-management/UserList";
import ConfirmDeleteDialog from "../user-management/ConfirmDeleteDialog";

const UserManagementTab: React.FC = () => {
  const {
    users,
    teams,
    loading,
    editDialogOpen,
    setEditDialogOpen,
    editingUser,
    confirmDialogOpen,
    setConfirmDialogOpen,
    handleAddUser,
    handleOpenEditDialog,
    handleUpdateUser,
    handleOpenDeleteConfirmation,
    handleDeleteUser,
  } = useUserManagement();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gebruikers Beheren</CardTitle>
          <CardDescription>Voeg nieuwe gebruikers toe en beheer hun toegang</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <AddUserForm 
              teams={teams} 
              onAddUser={handleAddUser} 
            />
            
            <div className="border-t pt-4">
              <h3 className="mb-4 text-lg font-medium">Gebruikers</h3>
              
              <UserList 
                users={users}
                loading={loading}
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
      />

      {/* Edit User Dialog */}
      {editingUser && (
        <UserDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          editingUser={{
            id: editingUser.user_id,
            username: editingUser.username,
            password: "",
            role: editingUser.role as "admin" | "referee" | "player_manager",
            teamId: editingUser.team_id || undefined
          }}
          onSave={handleUpdateUser}
          teams={teams.map(team => ({ id: team.team_id, name: team.team_name }))}
        />
      )}
    </div>
  );
};

export default UserManagementTab;
