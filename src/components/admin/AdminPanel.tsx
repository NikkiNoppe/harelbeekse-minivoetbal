
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
import { Checkbox } from "@/components/ui/checkbox";
import TeamForm from "./TeamForm";

// Initial teams data
const initialTeams = [
  { id: 1, name: "FC De Kampioenen", permissions: { scores: true, players: true } },
  { id: 2, name: "Bavo United", permissions: { scores: true, players: true } },
  { id: 3, name: "Zandberg Boys", permissions: { scores: true, players: false } },
  { id: 4, name: "Sportclub Veldhoven", permissions: { scores: false, players: true } },
];

// Initial users data
const initialUsers = [
  { id: 1, username: "admin", password: "admin123", role: "admin" },
  { id: 2, username: "team1", password: "team123", role: "team", teamId: 1 },
  { id: 3, username: "team2", password: "team123", role: "team", teamId: 2 },
];

const AdminPanel: React.FC = () => {
  const [teams, setTeams] = useState(initialTeams);
  const [users, setUsers] = useState(initialUsers);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
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

  const togglePermission = (teamId: number, permissionType: "scores" | "players") => {
    setTeams(
      teams.map((team) => {
        if (team.id === teamId) {
          return {
            ...team,
            permissions: {
              ...team.permissions,
              [permissionType]: !team.permissions[permissionType],
            },
          };
        }
        return team;
      })
    );

    toast({
      title: "Rechten bijgewerkt",
      description: `${permissionType === "scores" ? "Wedstrijdscores" : "Spelerslijst"} rechten bijgewerkt`,
    });
  };

  const handleAddTeam = (name: string) => {
    const newTeam = {
      id: teams.length + 1,
      name,
      permissions: { scores: false, players: false },
    };
    
    setTeams([...teams, newTeam]);
    
    toast({
      title: "Team toegevoegd",
      description: `${name} is toegevoegd aan de teamlijst`,
    });
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
                Beheer teams en hun machtigingen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TeamForm onAddTeam={handleAddTeam} />
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Team naam</TableHead>
                        <TableHead className="text-center">Wedstrijdscores invoeren</TableHead>
                        <TableHead className="text-center">Spelerslijst beheren</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teams.map((team) => (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">{team.name}</TableCell>
                          <TableCell className="text-center">
                            <Checkbox 
                              checked={team.permissions.scores}
                              onCheckedChange={() => togglePermission(team.id, "scores")}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox 
                              checked={team.permissions.players}
                              onCheckedChange={() => togglePermission(team.id, "players")}
                            />
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
    </div>
  );
};

export default AdminPanel;
