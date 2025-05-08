
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import TeamForm from "./TeamForm";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, AlertTriangle } from "lucide-react";

// Updated Team interface to use email instead of permissions object
interface Team {
  id: number;
  name: string;
  email: string;
}

// Initial teams data with email instead of permissions
const initialTeams = [
  { id: 1, name: "FC De Kampioenen", email: "kampioenen@example.com" },
  { id: 2, name: "Bavo United", email: "bavo@example.com" },
  { id: 3, name: "Zandberg Boys", email: "zandberg@example.com" },
  { id: 4, name: "Sportclub Veldhoven", email: "veldhoven@example.com" },
];

// Initial users data
const initialUsers = [
  { id: 1, username: "admin", password: "admin123", role: "admin" },
  { id: 2, username: "team1", password: "team123", role: "team", teamId: 1 },
  { id: 3, username: "team2", password: "team123", role: "team", teamId: 2 },
];

// Mock competition status - set to true when competition is active
const isCompetitionActive = true;

const AdminPanel: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [users, setUsers] = useState(initialUsers);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<number | null>(null);
  const [editingTeam, setEditingTeam] = useState<{ id: number, name: string, email: string } | null>(null);
  const { toast } = useToast();

  const handleAddUser = () => {
    if (!newUsername || !newPassword || !selectedTeamId) {
      toast({
        title: "Fout",
        description: "Vul alle velden in",
        variant: "destructive",
      });
      return;
    }

    const newUser = {
      id: users.length + 1,
      username: newUsername,
      password: newPassword,
      role: "team",
      teamId: selectedTeamId,
    };

    setUsers([...users, newUser]);
    setNewUsername("");
    setNewPassword("");
    setSelectedTeamId(null);

    toast({
      title: "Succes",
      description: `Gebruiker ${newUsername} is toegevoegd`,
    });
  };

  const handleUpdateTeamEmail = (teamId: number, email: string) => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Ongeldige email",
        description: "Voer een geldig e-mailadres in",
        variant: "destructive",
      });
      return;
    }

    setTeams(
      teams.map((team) => {
        if (team.id === teamId) {
          return {
            ...team,
            email,
          };
        }
        return team;
      })
    );

    toast({
      title: "Email bijgewerkt",
      description: `Team beheer email is bijgewerkt`,
    });
  };

  const handleAddTeam = (name: string) => {
    if (editingTeam) {
      // Update existing team
      setTeams(teams.map(team => 
        team.id === editingTeam.id 
          ? { ...team, name } 
          : team
      ));
      
      toast({
        title: "Team bijgewerkt",
        description: `${name} is bijgewerkt`,
      });
      
      setEditingTeam(null);
    } else {
      // Add new team with empty email
      const newTeam = {
        id: teams.length + 1,
        name,
        email: "",
      };
      
      setTeams([...teams, newTeam]);
      
      toast({
        title: "Team toegevoegd",
        description: `${name} is toegevoegd aan de teamlijst`,
      });
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
  };

  const handleDeleteTeamRequest = (teamId: number) => {
    // First check if competition is active
    if (isCompetitionActive) {
      toast({
        title: "Niet toegestaan",
        description: "Verwijderen van teams is niet toegestaan tijdens actieve competitie",
        variant: "destructive",
      });
      return;
    }

    // Check if there are users associated with this team
    const hasUsers = users.some(user => user.teamId === teamId);
    
    if (hasUsers) {
      toast({
        title: "Waarschuwing",
        description: "Er zijn gebruikers gekoppeld aan dit team. Verwijder eerst de gebruikers.",
        variant: "destructive",
      });
      return;
    }

    // If no issues, open the delete confirmation dialog
    setTeamToDelete(teamId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTeam = () => {
    if (teamToDelete) {
      setTeams(teams.filter(team => team.id !== teamToDelete));
      
      toast({
        title: "Team verwijderd",
        description: "Het team is succesvol verwijderd",
      });
      
      setDeleteDialogOpen(false);
      setTeamToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Beheerdersdashboard</h1>
      
      <Tabs defaultValue="teams">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="teams">Teams beheren</TabsTrigger>
          <TabsTrigger value="users">Gebruikers beheren</TabsTrigger>
        </TabsList>
        
        <TabsContent value="teams" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
              <CardDescription>
                Beheer teams en hun contact email voor spelerslijst
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TeamForm 
                  onAddTeam={handleAddTeam} 
                  initialName={editingTeam?.name || ""} 
                  isEditing={!!editingTeam}
                  onCancel={() => setEditingTeam(null)}
                />
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Team naam</TableHead>
                        <TableHead>Beheer email</TableHead>
                        <TableHead className="text-center w-[150px]">Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teams.map((team) => (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">{team.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input 
                                value={team.email} 
                                onChange={(e) => handleUpdateTeamEmail(team.id, e.target.value)}
                                placeholder="team@example.com"
                                className="max-w-xs"
                              />
                              <Button
                                onClick={() => handleUpdateTeamEmail(team.id, team.email)}
                                size="sm"
                                variant="secondary"
                              >
                                Opslaan
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditTeam(team)}
                                className="text-purple-500 hover:text-purple-700 hover:bg-purple-100"
                              >
                                <Edit size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteTeamRequest(team.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-100"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Gebruikers</CardTitle>
              <CardDescription>
                Voeg nieuwe teamgebruikers toe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username">Gebruikersnaam</Label>
                    <Input 
                      id="username" 
                      value={newUsername} 
                      onChange={(e) => setNewUsername(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Wachtwoord</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="team">Selecteer team</Label>
                  <select 
                    id="team" 
                    className="w-full p-2 border rounded-md"
                    value={selectedTeamId || ""}
                    onChange={(e) => setSelectedTeamId(Number(e.target.value))}
                  >
                    <option value="">Selecteer een team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <Button onClick={handleAddUser}>Gebruiker toevoegen</Button>
                
                <div className="rounded-md border mt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Gebruikersnaam</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Team</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.role === "admin" ? "Administrator" : "Team"}</TableCell>
                          <TableCell>
                            {user.teamId
                              ? teams.find((t) => t.id === user.teamId)?.name || "Onbekend team"
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Team verwijderen
            </AlertDialogTitle>
            <AlertDialogDescription>
              Weet u zeker dat u dit team wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTeam}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPanel;
