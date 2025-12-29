import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useTeamsEnhanced } from "./hooks/useTeamsEnhanced";
import TeamsList from "./components/TeamsList";
import { TeamModal, ConfirmDeleteModal } from "@/components/modals";
import { PageHeader } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";

const AdminTeamPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
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
      <div className="space-y-6 animate-slide-up">
        <PageHeader 
          title="Teams"
          subtitle="Beheer alle teams in de competitie"
        />
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Teams laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <PageHeader 
        title="Teams"
        subtitle={`Beheer alle teams in de competitie (${teams.length} teams)`}
        rightAction={
          isAdmin ? (
            <Button
              onClick={handleAddNew}
              className="btn btn--outline btn--block"
            >
              <Plus size={16} />
              <span>Nieuw Team</span>
            </Button>
          ) : undefined
        }
      />

      {/* Teams List */}
      <TeamsList
        teams={teams}
        onEdit={handleEditTeam}
        onDelete={confirmDelete}
        loading={false}
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
      <ConfirmDeleteModal
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
