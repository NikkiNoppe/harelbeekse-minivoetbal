
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

interface PlayersListProps {
  teamId: number;
  teamName: string;
}

interface Player {
  id: number;
  name: string;
  position: string;
  number: string;
  age: string;
}

// Mock initial players
const initialPlayersByTeam: Record<number, Player[]> = {
  1: [
    { id: 1, name: "Jan Janssen", position: "Aanvaller", number: "10", age: "25" },
    { id: 2, name: "Piet Pieters", position: "Keeper", number: "1", age: "28" },
    { id: 3, name: "Karel Karelse", position: "Verdediger", number: "4", age: "23" },
  ],
  2: [
    { id: 1, name: "Tim Timmers", position: "Middenvelder", number: "8", age: "24" },
    { id: 2, name: "Bas Bastiaanse", position: "Aanvaller", number: "11", age: "22" },
  ],
};

const PlayersList: React.FC<PlayersListProps> = ({ teamId, teamName }) => {
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>(initialPlayersByTeam[teamId] || []);
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    position: "",
    number: "",
    age: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPlayer((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPlayer = () => {
    // Validate inputs
    if (!newPlayer.name || !newPlayer.position || !newPlayer.number || !newPlayer.age) {
      toast({
        title: "Ontbrekende gegevens",
        description: "Vul alle spelersgegevens in",
        variant: "destructive",
      });
      return;
    }

    const player = {
      id: players.length + 1,
      ...newPlayer,
    };

    setPlayers([...players, player]);

    // Reset form
    setNewPlayer({
      name: "",
      position: "",
      number: "",
      age: "",
    });

    toast({
      title: "Speler toegevoegd",
      description: `${newPlayer.name} is toegevoegd aan het team`,
    });
  };

  const handleRemovePlayer = (id: number) => {
    setPlayers(players.filter((player) => player.id !== id));
    
    toast({
      title: "Speler verwijderd",
      description: "De speler is verwijderd uit het team",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spelerslijst - {teamName}</CardTitle>
        <CardDescription>
          Beheer de spelers van uw team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label htmlFor="player-name" className="text-sm font-medium">Naam</label>
              <Input
                id="player-name"
                name="name"
                placeholder="Volledige naam"
                value={newPlayer.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="player-position" className="text-sm font-medium">Positie</label>
              <Input
                id="player-position"
                name="position"
                placeholder="Positie"
                value={newPlayer.position}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="player-number" className="text-sm font-medium">Rugnummer</label>
              <Input
                id="player-number"
                name="number"
                type="number"
                placeholder="Nummer"
                value={newPlayer.number}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="player-age" className="text-sm font-medium">Leeftijd</label>
              <Input
                id="player-age"
                name="age"
                type="number"
                placeholder="Leeftijd"
                value={newPlayer.age}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <Button onClick={handleAddPlayer}>Speler Toevoegen</Button>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Positie</TableHead>
                  <TableHead>Nummer</TableHead>
                  <TableHead>Leeftijd</TableHead>
                  <TableHead className="text-right">Actie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell>{player.position}</TableCell>
                    <TableCell>{player.number}</TableCell>
                    <TableCell>{player.age}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleRemovePlayer(player.id)}
                      >
                        Verwijderen
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayersList;
