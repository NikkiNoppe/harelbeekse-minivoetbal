
import React, { useState } from "react";
import { MOCK_TEAMS } from "@/components/Layout";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Team {
  id: number;
  name: string;
  email: string;
  played?: number;
  won?: number;
  draw?: number;
  lost?: number;
  goalDiff?: number;
  points?: number;
}

const TeamsTab: React.FC = () => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState<{name: string, email: string}>({
    name: "", 
    email: ""
  });
  
  // Handle opening edit dialog
  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setNewTeam({name: team.name, email: team.email});
    setDialogOpen(true);
  };
  
  // Handle opening add dialog
  const handleAddNew = () => {
    setEditingTeam(null);
    setNewTeam({name: "", email: ""});
    setDialogOpen(true);
  };
  
  // Handle save team
  const handleSaveTeam = () => {
    if (!newTeam.name) {
      toast({
        title: "Naam ontbreekt",
        description: "Vul een teamnaam in",
        variant: "destructive",
      });
      return;
    }
    
    if (editingTeam) {
      // Update existing team
      setTeams(teams.map(team => 
        team.id === editingTeam.id ? { ...team, name: newTeam.name, email: newTeam.email } : team
      ));
      
      toast({
        title: "Team bijgewerkt",
        description: `${newTeam.name} is bijgewerkt`,
      });
    } else {
      // Add new team
      const newId = Math.max(...teams.map(t => t.id), 0) + 1;
      
      const teamToAdd = {
        id: newId,
        name: newTeam.name,
        email: newTeam.email,
        played: 0,
        won: 0,
        draw: 0,
        lost: 0,
        goalDiff: 0,
        points: 0,
      };
      
      setTeams([...teams, teamToAdd]);
      
      toast({
        title: "Team toegevoegd",
        description: `${newTeam.name} is toegevoegd`,
      });
    }
    
    setDialogOpen(false);
  };
  
  // Handle delete team
  const handleDeleteTeam = (teamId: number) => {
    setTeams(teams.filter(team => team.id !== teamId));
    
    toast({
      title: "Team verwijderd",
      description: "Het team is verwijderd uit de competitie",
    });
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Contact email</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map(team => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>{team.email}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTeam(team)}
                        className="text-purple-500 hover:text-purple-700 hover:bg-purple-100/10"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTeam(team.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? "Team bewerken" : "Nieuw team toevoegen"}
            </DialogTitle>
            <DialogDescription>
              {editingTeam 
                ? "Bewerk de gegevens van dit team" 
                : "Voeg een nieuw team toe aan de competitie"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label>Teamnaam</label>
              <Input
                value={newTeam.name}
                onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                placeholder="Naam van het team"
              />
            </div>
            
            <div className="space-y-2">
              <label>Contact email</label>
              <Input
                type="email"
                value={newTeam.email}
                onChange={(e) => setNewTeam({...newTeam, email: e.target.value})}
                placeholder="team@example.com"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleSaveTeam}>
              {editingTeam ? "Bijwerken" : "Toevoegen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamsTab;
