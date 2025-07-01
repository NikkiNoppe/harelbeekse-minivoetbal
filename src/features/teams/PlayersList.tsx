
import React, { useState, useEffect } from "react";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Badge } from "@shared/components/ui/badge";
import { Trash2, UserPlus, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@shared/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table";
import { toast } from "@shared/hooks/use-toast";
import { supabase } from "@shared/integrations/supabase/client";

interface Player {
  player_id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  team_id: number;
  isLocked?: boolean;
}

interface PlayersListProps {
  teamId: number;
  onPlayersChange: (players: Player[]) => void;
}

export const PlayersList: React.FC<PlayersListProps> = ({ teamId, onPlayersChange }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerFirstName, setNewPlayerFirstName] = useState("");
  const [newPlayerLastName, setNewPlayerLastName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, [teamId]);

  const fetchPlayers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('first_name', { ascending: true });

      if (error) {
        toast({
          description: "Failed to load players: " + error.message,
          variant: "destructive",
        });
      } else {
        setPlayers(data || []);
        onPlayersChange(data || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addPlayer = async () => {
    if (!newPlayerFirstName || !newPlayerLastName) {
      toast({
        description: "Vul voornaam en achternaam in.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('players')
        .insert([{ first_name: newPlayerFirstName, last_name: newPlayerLastName, birth_date: new Date().toISOString(), team_id: teamId }])
        .select('*');

      if (error) {
        toast({
          description: "Failed to add player: " + error.message,
          variant: "destructive",
        });
      } else {
        setNewPlayerFirstName("");
        setNewPlayerLastName("");
        fetchPlayers();
        toast({
          description: "Speler succesvol toegevoegd.",
        });
      }
    } catch (error: any) {
      toast({
        description: "Unexpected error adding player: " + error.message,
        variant: "destructive",
      });
    }
  };

  const deletePlayer = async (playerId: number) => {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('player_id', playerId);

      if (error) {
        toast({
          description: "Failed to delete player: " + error.message,
          variant: "destructive",
        });
      } else {
        fetchPlayers();
        toast({
          description: "Speler succesvol verwijderd.",
        });
      }
    } catch (error: any) {
      toast({
        description: "Unexpected error deleting player: " + error.message,
        variant: "destructive",
      });
    }
  };

  const filteredPlayers = players.filter(player => {
    const fullName = `${player.first_name} ${player.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="relative w-1/2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Zoek speler..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              <UserPlus className="h-4 w-4" />
              <span>Nieuwe speler</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nieuwe speler toevoegen</DialogTitle>
              <DialogDescription>
                Voeg hier een nieuwe speler toe aan het team.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="text-right">
                  Voornaam
                </Label>
                <Input
                  type="text"
                  id="firstName"
                  value={newPlayerFirstName}
                  onChange={(e) => setNewPlayerFirstName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName" className="text-right">
                  Achternaam
                </Label>
                <Input
                  type="text"
                  id="lastName"
                  value={newPlayerLastName}
                  onChange={(e) => setNewPlayerLastName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={addPlayer}>
                Speler toevoegen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-3">Naam</TableHead>
              <TableHead className="px-6 py-3">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-4">
                  Loading players...
                </TableCell>
              </TableRow>
            ) : filteredPlayers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-4">
                  Geen spelers gevonden.
                </TableCell>
              </TableRow>
            ) : (
              filteredPlayers.map((player) => (
                <TableRow key={player.player_id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                  <TableCell className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {player.first_name} {player.last_name}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletePlayer(player.player_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
