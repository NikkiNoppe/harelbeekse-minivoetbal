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
import { usePlayerListLock } from "@/components/user/players/hooks/usePlayerListLock";
import { Lock } from "lucide-react";

interface PlayersListProps {
  teamId: number;
  teamName: string;
  teamEmail: string;
}

interface Player {
  id: number;
  name: string;
  position: string;
  number: number;
}

// Mock initial players
const mockPlayers: Record<number, Player[]> = {
  1: [
    { id: 1, name: "Jan Janssens", position: "Keeper", number: 1 },
    { id: 2, name: "Piet Peters", position: "Verdediger", number: 4 },
    { id: 3, name: "Karel Karels", position: "Middenvelder", number: 8 },
  ],
  2: [
    { id: 1, name: "Tom Tomson", position: "Aanvaller", number: 9 },
    { id: 2, name: "Barry Bavo", position: "Middenvelder", number: 6 },
  ],
};

const PlayersList: React.FC<PlayersListProps> = ({ teamId, teamName, teamEmail }) => {
  const { toast } = useToast();
  const { isLocked, lockDate, canEdit } = usePlayerListLock();
  const [players, setPlayers] = useState<Player[]>(mockPlayers[teamId] || []);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerPosition, setNewPlayerPosition] = useState("");
  const [newPlayerNumber, setNewPlayerNumber] = useState("");

  const showLockWarning = () => {
    if (isLocked && lockDate) {
      toast({
        title: "Spelerslijst vergrendeld",
        description: `Wijzigingen zijn niet toegestaan vanaf ${new Date(lockDate).toLocaleDateString('nl-NL')}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Spelerslijst vergrendeld",
        description: "Wijzigingen zijn momenteel niet toegestaan",
        variant: "destructive",
      });
    }
  };

  const handleAddPlayer = () => {
    if (!canEdit) {
      showLockWarning();
      return;
    }

    if (!newPlayerName || !newPlayerPosition || !newPlayerNumber) {
      toast({
        title: "Fout",
        description: "Vul alle velden in",
        variant: "destructive",
      });
      return;
    }

    if (players.length >= 20) {
      toast({
        title: "Limiet bereikt",
        description: "U kunt maximaal 20 spelers toevoegen",
        variant: "destructive",
      });
      return;
    }

    const number = parseInt(newPlayerNumber);
    if (isNaN(number) || number < 1 || number > 99) {
      toast({
        title: "Ongeldig nummer",
        description: "Voer een nummer in tussen 1 en 99",
        variant: "destructive",
      });
      return;
    }

    // Check if number is already in use
    if (players.some(player => player.number === number)) {
      toast({
        title: "Nummer in gebruik",
        description: `Nummer ${number} is al toegewezen aan een andere speler`,
        variant: "destructive",
      });
      return;
    }

    const newPlayer: Player = {
      id: players.length + 1,
      name: newPlayerName,
      position: newPlayerPosition,
      number: number,
    };

    setPlayers([...players, newPlayer]);
    setNewPlayerName("");
    setNewPlayerPosition("");
    setNewPlayerNumber("");

    toast({
      title: "Speler toegevoegd",
      description: `${newPlayerName} is toegevoegd aan het team`,
    });
  };

  const handleRemovePlayer = (playerId: number) => {
    if (!canEdit) {
      showLockWarning();
      return;
    }

    setPlayers(players.filter(player => player.id !== playerId));
    
    toast({
      title: "Speler verwijderd",
      description: "De speler is verwijderd uit het team",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Spelerslijst voor {teamName}
          {isLocked && (
            <Lock className="h-4 w-4 text-red-500" />
          )}
        </CardTitle>
        <CardDescription>
          Beheer tot 20 spelers voor uw team • Contact: {teamEmail}
          {isLocked && lockDate && (
            <span className="block text-red-600 mt-1">
              Spelerslijst vergrendeld vanaf {new Date(lockDate).toLocaleDateString('nl-NL')}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="player-name" className="block text-sm font-medium">
                Naam
              </label>
              <Input
                id="player-name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Voer naam in"
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="player-position" className="block text-sm font-medium">
                Positie
              </label>
              <select
                id="player-position"
                className="w-full p-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={newPlayerPosition}
                onChange={(e) => setNewPlayerPosition(e.target.value)}
                disabled={!canEdit}
              >
                <option value="">Selecteer positie</option>
                <option value="Keeper">Keeper</option>
                <option value="Verdediger">Verdediger</option>
                <option value="Middenvelder">Middenvelder</option>
                <option value="Aanvaller">Aanvaller</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="player-number" className="block text-sm font-medium">
                Rugnummer
              </label>
              <Input
                id="player-number"
                type="number"
                min="1"
                max="99"
                value={newPlayerNumber}
                onChange={(e) => setNewPlayerNumber(e.target.value)}
                placeholder="1-99"
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button onClick={handleAddPlayer} disabled={!canEdit}>
              Speler toevoegen
            </Button>
            <span className="text-sm text-gray-500">
              {players.length}/20 spelers
            </span>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nr.</TableHead>
                  <TableHead>Naam</TableHead>
                  <TableHead>Positie</TableHead>
                  <TableHead className="text-right">Actie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                      Geen spelers toegevoegd
                    </TableCell>
                  </TableRow>
                ) : (
                  players.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">{player.number}</TableCell>
                      <TableCell>{player.name}</TableCell>
                      <TableCell>{player.position}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePlayer(player.id)}
                          disabled={!canEdit}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          Verwijderen
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayersList;
