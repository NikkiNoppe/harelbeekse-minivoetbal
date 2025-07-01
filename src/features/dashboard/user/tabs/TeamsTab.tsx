
import React from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TeamsList from "../teams/TeamsList";
import TeamDialog from "../teams/TeamDialog";
import { useTeams } from "../teams/useTeams";
import { useAddTeam } from "@/components/team/operations/useAddTeam";
import { useUpdateTeam } from "@/components/team/operations/useUpdateTeam";
import { useDeleteTeam } from "@/components/team/operations/useDeleteTeam";

const TeamsTab: React.FC = () => {
  const {
    teams,
    setTeams,
    loading,
    dialogOpen,
    setDialogOpen,
    editingTeam,
    setEditingTeam,
    formData,
    setFormData,
    handleAddNew,
    handleEditTeam,
    handleFormChange,
    fetchTeams
  } = useTeams();

  // Add
  const { addTeam } = useAddTeam((newTeam) => {
    setTeams((prev) => [...prev, newTeam]);
    setDialogOpen(false);
    setFormData({ name: "", balance: "0" });
  });

  // Update
  const { updateTeam } = useUpdateTeam((updated) => {
    setTeams((prev) =>
      prev.map((team) =>
        team.team_id === updated.team_id ? updated : team
      )
    );
    setDialogOpen(false);
    setEditingTeam(null);
    setFormData({ name: "", balance: "0" });
  });

  // Delete
  const { deleteTeam } = useDeleteTeam((deletedId) => {
    setTeams((prev) => prev.filter((team) => team.team_id !== deletedId));
  });

  // Save handler
  const handleSaveTeam = async () => {
    if (!formData.name.trim()) return;
    if (editingTeam) {
      await updateTeam(editingTeam.team_id, formData.name, parseFloat(formData.balance) || 0);
    } else {
      await addTeam(formData.name, parseFloat(formData.balance) || 0);
    }
  };

  // Delete handler
  const handleDeleteTeam = async (teamId: number) => {
    await deleteTeam(teamId);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Teams</CardTitle>
              <CardDescription>
                Beheer de teams in de competitie
              </CardDescription>
            </div>
            
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus size={16} />
              Nieuw team
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TeamsList
            teams={teams}
            loading={loading}
            onEdit={handleEditTeam}
            onDelete={handleDeleteTeam}
          />
        </CardContent>
      </Card>
      
      {/* Team Edit Dialog */}
      <TeamDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingTeam={editingTeam}
        formData={formData}
        onFormChange={handleFormChange}
        onSave={handleSaveTeam}
      />
    </div>
  );
};

export default TeamsTab;
