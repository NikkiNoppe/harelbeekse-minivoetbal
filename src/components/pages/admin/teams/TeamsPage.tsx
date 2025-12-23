import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTeamsEnhanced } from "@/components/user/teams/hooks/useTeamsEnhanced";
import TeamsList from "@/components/user/teams/TeamsList";
import TeamModal from "@/components/user/teams/TeamModal";
import ConfirmDeleteDialog from "@/components/user/teams/ConfirmDeleteDialog";

const AdminTeamPage: React.FC = () => {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Team Beheer
            </h1>
            <p className="text-muted-foreground">
              Beheer alle teams in de competitie
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" aria-hidden="true"></div>
          <p className="mt-2 text-muted-foreground">Teams laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Team Beheer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Beheer alle teams in de competitie ({teams.length} teams)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleAddNew}
            className="btn btn--outline flex items-center gap-2"
          >
            <Plus size={16} />
            Nieuw Team
          </Button>
        </div>
      </div>

      {/* Teams List */}
      <TeamsList
        teams={teams}
        onEdit={handleEditTeam}
        onDelete={confirmDelete}
      />

      {/* Team Dialog */}
      <TeamModal
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

export default AdminTeamPage;
