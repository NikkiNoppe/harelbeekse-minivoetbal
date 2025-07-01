import React, { useState, useEffect } from "react";
import { Plus, Users, Edit, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@shared/hooks/use-toast";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/components/ui/card";
import { Alert, AlertDescription } from "@shared/components/ui/alert";
import TeamsList from "../teams/TeamsList";
import TeamDialog from "../teams/TeamDialog";
import { useAddTeam } from "@features/teams/operations/useAddTeam";
import { useUpdateTeam } from "@features/teams/operations/useUpdateTeam";
import { useDeleteTeam } from "@features/teams/operations/useDeleteTeam";
import { useTeams } from "../teams/useTeams";

const TeamsTab: React.FC = () => {
  const { teams, loading, refreshTeams } = useTeams();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTeamId, setEditTeamId] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const { addTeam, isAdding } = useAddTeam(refreshTeams);
  const { updateTeam, isUpdating } = useUpdateTeam(refreshTeams);
  const { deleteTeam, isDeleting } = useDeleteTeam(refreshTeams);

  const [newTeamName, setNewTeamName] = useState("");
  const [editedTeamName, setEditedTeamName] = useState("");

  const handleAddTeam = async () => {
    if (newTeamName.trim() === "") {
      toast({
        title: "Ongeldige naam",
        description: "Team naam mag niet leeg zijn.",
        variant: "destructive",
      });
      return;
    }

    const success = await addTeam(newTeamName);
    if (success) {
      setAddDialogOpen(false);
      setNewTeamName("");
    }
  };

  const handleEditTeam = (teamId: number, teamName: string) => {
    setEditTeamId(teamId);
    setEditedTeamName(teamName);
    setEditDialogOpen(true);
  };

  const handleSaveEditedTeam = async () => {
    if (!editTeamId || editedTeamName.trim() === "") {
      toast({
        title: "Ongeldige naam",
        description: "Team naam mag niet leeg zijn.",
        variant: "destructive",
      });
      return;
    }

    const success = await updateTeam(editTeamId, editedTeamName);
    if (success) {
      setEditDialogOpen(false);
      setEditTeamId(null);
      setEditedTeamName("");
    }
  };

  const handleDeleteTeam = (teamId: number) => {
    setTeamToDelete(teamId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDeleteTeam = async () => {
    if (!teamToDelete) return;

    const success = await deleteTeam(teamToDelete);
    if (success) {
      setDeleteDialogOpen(false);
      setTeamToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Teams</CardTitle>
              <CardDescription>Beheer de teams in de competitie</CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)} className="bg-green-500 text-white hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Team toevoegen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>Teams laden...</AlertDescription>
            </Alert>
          ) : teams.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Er zijn nog geen teams.</AlertDescription>
            </Alert>
          ) : (
            <TeamsList
              teams={teams}
              onEdit={handleEditTeam}
              onDelete={handleDeleteTeam}
            />
          )}
        </CardContent>
      </Card>

      <TeamDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        title="Nieuw team toevoegen"
        description="Voer de naam van het nieuwe team in"
        value={newTeamName}
        onValueChange={setNewTeamName}
        onSave={handleAddTeam}
        isSaving={isAdding}
      />

      <TeamDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="Team bewerken"
        description="Bewerk de naam van het team"
        value={editedTeamName}
        onValueChange={setEditedTeamName}
        onSave={handleSaveEditedTeam}
        isSaving={isUpdating}
      />

      {/* Delete Confirmation Dialog */}
      {teamToDelete !== null && (
        <TeamDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Team verwijderen?"
          description="Weet je zeker dat je dit team wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt."
          value=""
          onValueChange={() => {}} // Dummy function
          onSave={handleConfirmDeleteTeam}
          isSaving={isDeleting}
          showCancelButton={true}
          cancelButtonText="Annuleren"
          confirmButtonText="Verwijderen"
        />
      )}
    </div>
  );
};

export default TeamsTab;
