
import React, { useState } from "react";
import { Card, Title, Text, Button, Group, Stack, Divider } from "@mantine/core";
import { useUserManagement } from "../user-management/useUserManagement";
import UserDialog from "@/components/user/UserDialog";
import UserList from "../user-management/UserList";
import ConfirmDeleteDialog from "../user-management/ConfirmDeleteDialog";
import { Plus, Users } from "lucide-react";

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

  const handleOpenAddDialog = () => setAddDialogOpen(true);

  const handleSaveNewUser = async (formData: any) => {
    const success = await handleAddUser({
      name: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      teamId: formData.teamId || null,
      teamIds: formData.teamIds || []
    });
    if (success) setAddDialogOpen(false);
    return success;
  };

  const handleSaveEditUser = async (formData: any) => {
    if (editingUser) {
      const success = await handleUpdateUser(editingUser.user_id, formData);
      return success;
    }
    return false;
  };

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <Title order={2} fw={600} c="grape.8">
          <Group gap={8}>
            <Users size={20} />
            Gebruikers Beheer
          </Group>
        </Title>
        <Button leftSection={<Plus size={16} />} color="grape" onClick={handleOpenAddDialog} loading={addingUser}>
          Gebruiker toevoegen
        </Button>
      </Group>
      <Card shadow="sm" radius="md" p="md" withBorder>
        <Title order={4} size="h4" mb="xs">Beheer alle gebruikers in het systeem</Title>
        <Text size="sm" c="dimmed" mb="md">Voeg nieuwe gebruikers toe en beheer hun toegang tot verschillende functies.</Text>
        <Divider mb="md" />
        <UserList 
          users={users}
          loading={loading}
          isUpdating={updatingUser}
          isDeleting={deletingUser}
          onEditUser={handleOpenEditDialog}
          onDeleteUser={handleOpenDeleteConfirmation}
          editMode={true}
          searchTerm={searchTerm}
          onSearchTermChange={handleSearchChange}
          roleFilter={roleFilter}
          onRoleFilterChange={handleRoleFilterChange}
          teamFilter={teamFilter}
          onTeamFilterChange={handleTeamFilterChange}
          teams={teams}
        />
      </Card>
      <ConfirmDeleteDialog 
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirmDelete={handleDeleteUser}
        isDeleting={deletingUser}
      />
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
      <UserDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSave={handleSaveNewUser}
        teams={teams.map(team => ({ id: team.team_id, name: team.team_name }))}
        isLoading={addingUser}
      />
    </Stack>
  );
};

export default UserManagementTab;
