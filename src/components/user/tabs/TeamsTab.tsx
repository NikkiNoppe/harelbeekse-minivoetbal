import React, { useState } from "react";
import { MOCK_TEAMS } from "@/data/mockData";
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
import { Edit, Save, Plus, Trash2, Users } from "lucide-react";
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

interface Player {
  id: number;
  name: string;
  number: number;
  teamId: number;
}

interface TeamWithPlayers extends Team {
  players: Player[];
}

// Mock players data
const initialMockPlayers = {
  1: [
    { id: 1, name: "Jan Verbeke", number: 1, teamId: 1 },
    { id: 2, name: "Pieter Jansens", number: 2, teamId: 1 },
    { id: 3, name: "Karel Decoene", number: 3, teamId: 1 },
    { id: 4, name: "Thomas Vanneste", number: 4, teamId: 1 },
    { id: 5, name: "Dries Mortelmans", number: 5, teamId: 1 },
  ],
  2: [
    { id: 6, name: "Dmitri Petrenko", number: 1, teamId: 2 },
    { id: 7, name: "Alexei Volkov", number: 2, teamId: 2 },
    { id: 8, name: "Ivan Truu", number: 3, teamId: 2 },
    { id: 9, name: "Sergei Kozlov", number: 4, teamId: 2 },
  ]
};

const TeamsTab: React.FC = () => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
  const [mockPlayers, setMockPlayers] = useState<{[key: number]: Player[]}>(initialMockPlayers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState<{name: string, email: string}>({
    name: "", 
    email: ""
  });
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [currentTeamForPlayers, setCurrentTeamForPlayers] = useState<Team | null>(null);
  const [newPlayer, setNewPlayer] = useState<{name: string, number: number}>({
    name: "", 
    number: 1
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
      
      // Initialize empty player array for the new team
      setMockPlayers({
        ...mockPlayers,
        [newId]: []
      });
      
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
    
    // Remove team's players
    const updatedPlayers = { ...mockPlayers };
    delete updatedPlayers[teamId];
    setMockPlayers(updatedPlayers);
    
    toast({
      title: "Team verwijderd",
      description: "Het team is verwijderd uit de competitie",
    });
  };
  
  // Handle opening player management dialog
  const handleManagePlayers = (team: Team) => {
    setCurrentTeamForPlayers(team);
    setPlayerDialogOpen(true);
    setNewPlayer({name: "", number: 1});
  };
  
  // Handle adding a new player
  const handleAddPlayer = () => {
    if (!currentTeamForPlayers) return;
    
    if (!newPlayer.name) {
      toast({
        title: "Naam ontbreekt",
        description: "Vul een spelernaam in",
        variant: "destructive",
      });
      return;
    }
    
    const teamId = currentTeamForPlayers.id;
    const teamPlayers = mockPlayers[teamId] || [];
    
    // Check if number is already in use
    const numberExists = teamPlayers.some(p => p.number === newPlayer.number);
    if (numberExists) {
      toast({
        title: "Rugnummer bezet",
        description: `Rugnummer ${newPlayer.number} is al in gebruik`,
        variant: "destructive",
      });
      return;
    }
    
    // Generate new player ID
    const allPlayerIds = Object.values(mockPlayers).flat().map(p => p.id);
    const newPlayerId = allPlayerIds.length > 0 ? Math.max(...allPlayerIds) + 1 : 1;
    
    // Create new player
    const playerToAdd: Player = {
      id: newPlayerId,
      name: newPlayer.name,
      number: newPlayer.number,
      teamId: teamId
    };
    
    // Update players state
    setMockPlayers({
      ...mockPlayers,
      [teamId]: [...teamPlayers, playerToAdd]
    });
    
    // Reset form
    setNewPlayer({name: "", number: teamPlayers.length + 1});
    
    toast({
      title: "Speler toegevoegd",
      description: `${newPlayer.name} is toegevoegd aan ${currentTeamForPlayers.name}`,
    });
  };
  
  // Handle removing a player
  const handleRemovePlayer = (playerId: number) => {
    if (!currentTeamForPlayers) return;
    
    const teamId = currentTeamForPlayers.id;
    const teamPlayers = mockPlayers[teamId] || [];
    
    setMockPlayers({
      ...mockPlayers,
      [teamId]: teamPlayers.filter(p => p.id !== playerId)
    });
    
    toast({
      title: "Speler verwijderd",
      description: "De speler is verwijderd uit het team",
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
                <TableHead>Spelers</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map(team => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>{team.email}</TableCell>
                  <TableCell>
                    {mockPlayers[team.id] ? mockPlayers[team.id].length : 0} spelers
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleManagePlayers(team)}
                        className="text-orange-500 hover:text-orange-600 hover:bg-orange-100/10"
                      >
                        <Users size={16} />
                      </Button>
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
      
      {/* Team Edit Dialog */}
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
      
      {/* Players Management Dialog */}
      <Dialog open={playerDialogOpen} onOpenChange={setPlayerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Spelersbeheer - {currentTeamForPlayers?.name}
            </DialogTitle>
            <DialogDescription>
              Voeg spelers toe of verwijder spelers van het team
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Add new player form */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="sm:flex-1">
                <label>Naam</label>
                <Input
                  className="mt-1"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                  placeholder="Speler naam"
                />
              </div>
              <div className="w-full sm:w-24">
                <label>Nr</label>
                <Input
                  className="mt-1"
                  type="number"
                  min="1"
                  max="99"
                  value={newPlayer.number}
                  onChange={(e) => setNewPlayer({
                    ...newPlayer, 
                    number: parseInt(e.target.value) || 1
                  })}
                />
              </div>
              <div className="self-end">
                <Button onClick={handleAddPlayer}>
                  <Plus size={16} className="mr-2" />
                  Toevoegen
                </Button>
              </div>
            </div>
            
            {/* Players list */}
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rugnummer</TableHead>
                    <TableHead>Naam</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTeamForPlayers && mockPlayers[currentTeamForPlayers.id] ? (
                    mockPlayers[currentTeamForPlayers.id].map(player => (
                      <TableRow key={player.id}>
                        <TableCell className="font-mono">{player.number}</TableCell>
                        <TableCell>{player.name}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePlayer(player.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        Nog geen spelers toegevoegd
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlayerDialogOpen(false)}>
              Sluiten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamsTab;
