import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { MOCK_TEAMS } from "@/data/mockData";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent, 
  CardFooter 
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

// Mock player data
const MOCK_PLAYERS = {
  1: [
    { id: 1, name: "Jan Verbeke", number: 1 },
    { id: 2, name: "Pieter Jansens", number: 2 },
    { id: 3, name: "Karel Decoene", number: 3 },
    { id: 4, name: "Thomas Vanneste", number: 4 },
    { id: 5, name: "Dries Mortelmans", number: 5 },
    { id: 6, name: "Lucas Mertens", number: 6 },
    { id: 7, name: "Mathias Delvaux", number: 7 },
    { id: 8, name: "Simon Verstraete", number: 8 },
    { id: 9, name: "Jonas Van Damme", number: 9 },
    { id: 10, name: "Koen Vandecasteele", number: 10 },
  ],
  2: [
    { id: 11, name: "Dmitri Petrenko", number: 1 },
    { id: 12, name: "Alexei Volkov", number: 2 },
    { id: 13, name: "Ivan Truu", number: 3 },
    { id: 14, name: "Sergei Kozlov", number: 4 },
    { id: 15, name: "Vladislav Makarov", number: 5 },
    { id: 16, name: "Mikhail Popov", number: 6 },
    { id: 17, name: "Oleg Sokolov", number: 7 },
    { id: 18, name: "Viktor Baranov", number: 8 },
    { id: 19, name: "Nikolai Fedorov", number: 9 },
    { id: 20, name: "Boris Morozov", number: 10 },
  ],
  3: [
    { id: 21, name: "Bart Janssens", number: 1 },
    { id: 22, name: "Kevin Desmet", number: 2 },
    { id: 23, name: "Wouter Peeters", number: 3 },
  ],
  4: [
    { id: 31, name: "Tom Gilles", number: 1 },
    { id: 32, name: "Marc Claes", number: 2 },
    { id: 33, name: "David Vermeulen", number: 3 },
  ],
  5: [
    { id: 41, name: "Jeroen Florre", number: 1 },
    { id: 42, name: "Stijn Declercq", number: 2 },
    { id: 43, name: "Dieter Vandenabeele", number: 3 },
  ],
  6: [
    { id: 51, name: "Marco Bemarmi", number: 1 },
    { id: 52, name: "Federico Rossi", number: 2 },
    { id: 53, name: "Alessandro Conti", number: 3 },
  ],
};

interface Player {
  id: number;
  name: string;
  number: number;
}

// Mock current date - set to a date before August 31st for testing editing
const currentDate = new Date('2025-05-10'); // Before Aug 31 cutoff

const PlayersTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState<{name: string, number: string}>({name: "", number: ""});
  const [playerChangesCount, setPlayerChangesCount] = useState(0);
  
  // Track original player list to count changes
  const [originalPlayers, setOriginalPlayers] = useState<Player[]>([]);
  
  // Check if editing is allowed
  const isBeforeAugust31 = currentDate.getMonth() < 7 || (currentDate.getMonth() === 7 && currentDate.getDate() <= 31);
  const canFullyEdit = isBeforeAugust31;
  const hasRemainingChanges = playerChangesCount < 3;
  const canMakeChanges = canFullyEdit || hasRemainingChanges;
  
  useEffect(() => {
    if (user?.role === "admin") {
      // Admin can see all teams, default to first team
      setSelectedTeam(1);
      setPlayers(MOCK_PLAYERS[1] || []);
      setOriginalPlayers(MOCK_PLAYERS[1] || []);
    } else if (user?.role === "team" && user.teamId) {
      // Team manager can only see their team
      setSelectedTeam(user.teamId);
      setPlayers(MOCK_PLAYERS[user.teamId] || []);
      setOriginalPlayers(MOCK_PLAYERS[user.teamId] || []);
    }
  }, [user]);
  
  // Handle team selection (admins only)
  const handleTeamChange = (teamId: number) => {
    setSelectedTeam(teamId);
    setPlayers(MOCK_PLAYERS[teamId] || []);
    setOriginalPlayers(MOCK_PLAYERS[teamId] || []);
    setEditMode(false);
  };
  
  // Handle add new player
  const handleAddPlayer = () => {
    if (!canMakeChanges) {
      toast({
        title: "Wijzigingen beperkt",
        description: isBeforeAugust31 
          ? "Maximaal 3 wijzigingen na 31 augustus bereikt" 
          : "Volledige wijzigingen alleen mogelijk vóór 31 augustus",
        variant: "destructive",
      });
      return;
    }
    
    if (!newPlayer.name || !newPlayer.number) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul alle velden in",
        variant: "destructive",
      });
      return;
    }
    
    const newPlayerId = Math.max(...players.map(p => p.id), 0) + 1;
    
    const playerToAdd = {
      id: newPlayerId,
      name: newPlayer.name,
      number: parseInt(newPlayer.number),
    };
    
    setPlayers([...players, playerToAdd]);
    setNewPlayer({name: "", number: ""});
    setDialogOpen(false);
    
    if (!isBeforeAugust31) {
      setPlayerChangesCount(playerChangesCount + 1);
    }
    
    toast({
      title: "Speler toegevoegd",
      description: `${playerToAdd.name} is toegevoegd aan het team`,
    });
  };
  
  // Handle remove player
  const handleRemovePlayer = (playerId: number) => {
    if (!canMakeChanges) {
      toast({
        title: "Wijzigingen beperkt",
        description: isBeforeAugust31 
          ? "Maximaal 3 wijzigingen na 31 augustus bereikt" 
          : "Volledige wijzigingen alleen mogelijk vóór 31 augustus",
        variant: "destructive",
      });
      return;
    }
    
    setPlayers(players.filter(p => p.id !== playerId));
    
    if (!isBeforeAugust31) {
      setPlayerChangesCount(playerChangesCount + 1);
    }
    
    toast({
      title: "Speler verwijderd",
      description: "De speler is verwijderd uit het team",
    });
  };
  
  // Calculate remaining changes
  const remainingChanges = 3 - playerChangesCount;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Spelerslijst</CardTitle>
              <CardDescription>
                {canFullyEdit 
                  ? "Onbeperkt wijzigen mogelijk tot 31 augustus" 
                  : `Nog ${remainingChanges} wijzigingen mogelijk (max 3)`}
              </CardDescription>
            </div>
            
            {user?.role === "admin" && (
              <select 
                className="p-2 bg-slate-800 border border-slate-700 rounded-md"
                value={selectedTeam || ""}
                onChange={(e) => handleTeamChange(parseInt(e.target.value))}
              >
                <option value="" disabled>Selecteer team</option>
                {MOCK_TEAMS.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Nummer</TableHead>
                <TableHead>Naam</TableHead>
                {editMode && <TableHead className="w-20">Acties</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map(player => (
                <TableRow key={player.id}>
                  <TableCell>{player.number}</TableCell>
                  <TableCell>{player.name}</TableCell>
                  {editMode && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePlayer(player.id)}
                        disabled={!canMakeChanges}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              
              {players.length === 0 && (
                <TableRow>
                  <TableCell colSpan={editMode ? 3 : 2} className="text-center text-muted-foreground">
                    Geen spelers gevonden
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setEditMode(!editMode)}
            className="flex items-center gap-2"
          >
            {editMode ? (
              <>
                <Save size={16} />
                Klaar met bewerken
              </>
            ) : (
              <>
                <Edit size={16} />
                Lijst bewerken
              </>
            )}
          </Button>
          
          {editMode && (
            <Button
              onClick={() => setDialogOpen(true)}
              disabled={!canMakeChanges}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Speler toevoegen
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe speler toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een nieuwe speler toe aan het team
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label>Naam</label>
              <Input
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                placeholder="Naam van de speler"
              />
            </div>
            
            <div className="space-y-2">
              <label>Rugnummer</label>
              <Input
                type="number"
                min="1"
                value={newPlayer.number}
                onChange={(e) => setNewPlayer({...newPlayer, number: e.target.value})}
                placeholder="Rugnummer"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleAddPlayer}>
              Speler toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayersTab;
