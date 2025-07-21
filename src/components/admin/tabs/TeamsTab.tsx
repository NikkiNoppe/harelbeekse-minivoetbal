import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTeamsEnhanced } from "@/components/user/teams/hooks/useTeamsEnhanced";
import TeamsList from "@/components/user/teams/TeamsList";
import TeamDialog from "@/components/user/teams/TeamDialog";
import ConfirmDeleteDialog from "@/components/user/teams/ConfirmDeleteDialog";

const TeamsTab: React.FC = () => {
  const {
    teams,
    loading,
    saving,
    deleting,
    dialogOpen,
    setDialogOpen,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    teamToDelete,
    editingTeam,
    formData,
    handleAddNew,
    handleEditTeam,
    handleFormChange,
    handleSaveTeam,
    handleDeleteTeam,
    confirmDelete
  } = useTeamsEnhanced();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Team Beheer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Beheer alle teams in de competitie
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleAddNew}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Nieuw Team
          </Button>
        </div>
      </div>

      {/* Teams List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <TeamsList
            teams={teams}
            onEdit={handleEditTeam}
            onDelete={confirmDelete}
          />
        </div>
      </div>

      {/* Team Dialog */}
      <TeamDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingTeam={editingTeam}
        formData={formData}
        onFormChange={handleFormChange}
        onSave={handleSaveTeam}
        loading={saving}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        team={teamToDelete}
        onConfirm={() => teamToDelete && handleDeleteTeam(teamToDelete.team_id)}
        loading={deleting}
      />
    </div>
  );
};

export default TeamsTab;
