
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

const TeamsTab: React.FC = () => {
  const {
    teams,
    loading,
    dialogOpen,
    setDialogOpen,
    editingTeam,
    formData,
    handleAddNew,
    handleEditTeam,
    handleFormChange,
    handleSaveTeam,
    handleDeleteTeam
  } = useTeams();
  
  const handleDeleteClick = (team: any) => {
    handleDeleteTeam(team.team_id);
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
            onDelete={handleDeleteClick}
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
        loading={loading}
      />
    </div>
  );
};

export default TeamsTab;
