
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
  const { teams, loading, fetchTeams } = useTeams();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTeamId, setEditTeamId] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const { addTeam } = useAddTeam(fetchTeams);
  const { updateTeam } = useUpdateTeam(fetchTeams);
  const { deleteTeam } = useDeleteTeam(fetchTeams);

  const [newTeamName, setNewTeamName] = useState("");
  const [editedTeamName, setEditedTeamName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddTeam = async () => {
    if (newTeamName.trim() === "") {
      toast({
        title: "Ongeldige naam",
        description: "Team naam mag niet leeg zijn.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await addTeam(newTeamName);
      setAddDialogOpen(false);
      setNewTeamName("");
    } catch (error) {
      console.error('Error adding team:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTeam = (team: { team_id: number; team_name: string }) => {
    setEditTeamId(team.team_id);
    setEditedTeamName(team.team_name);
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

    setIsLoading(true);
    try {
      await updateTeam(editTeamId, editedTeamName, 0);
      setEditDialogOpen(false);
      setEditTeamId(null);
      setEditedTeamName("");
    } catch (error) {
      console.error('Error updating team:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeam = (team: { team_id: number; team_name: string }) => {
    setTeamToDelete(team.team_id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDeleteTeam = async () => {
    if (!teamToDelete) return;

    setIsLoading(true);
    try {
      await deleteTeam(teamToDelete);
      setDeleteDialogOpen(false);
      setTeamToDelete(null);
    } catch (error) {
      console.error('Error deleting team:', error);
    } finally {
      setIsLoading(false);
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
        onSave={handleAddTeam}
        isSaving={isLoading}
        teamName={newTeamName}
        onTeamNameChange={setNewTeamName}
      />

      <TeamDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEditedTeam}
        isSaving={isLoading}
        teamName={editedTeamName}
        onTeamNameChange={setEditedTeamName}
      />

      <TeamDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSave={handleConfirmDeleteTeam}
        isSaving={isLoading}
        teamName=""
        onTeamNameChange={() => {}}
        isDeleteMode={true}
      />
    </div>
  );
};

export default TeamsTab;
