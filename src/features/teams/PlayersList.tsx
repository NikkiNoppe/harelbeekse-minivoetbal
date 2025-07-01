
import React, { useState, useEffect } from "react";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table";
import { toast } from "@shared/hooks/use-toast";
import { usePlayerListLock } from "@features/dashboard/user/players/hooks/usePlayerListLock";
import { supabase } from "@shared/integrations/supabase/client";
import { playerService } from "@shared/services/playerService";

interface Player {
  player_id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
}

interface PlayersListProps {
  teamId: number;
  onPlayersChange: (players: any[]) => void;
}

export const PlayersList: React.FC<PlayersListProps> = ({ teamId, onPlayersChange }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerFirstName, setNewPlayerFirstName] = useState("");
  const [newPlayerLastName, setNewPlayerLastName] = useState("");
  const [newPlayerBirthDate, setNewPlayerBirthDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const { isLocked } = usePlayerListLock();

  useEffect(() => {
    fetchPlayers();
  }, [teamId]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('first_name');

      if (error) {
        console.error("Error fetching players:", error);
        toast({
          description: "Failed to fetch players. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setPlayers(data || []);
      onPlayersChange(data || []);
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = async () => {
    if (!newPlayerFirstName.trim() || !newPlayerLastName.trim() || !newPlayerBirthDate) {
      toast({
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (isLocked) {
      toast({
        description: "Player list is locked and cannot be modified",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('players')
        .insert([{
          first_name: newPlayerFirstName.trim(),
          last_name: newPlayerLastName.trim(),
          birth_date: newPlayerBirthDate,
          team_id: teamId
        }])
        .select()
        .single();

      if (error) {
        console.error("Error adding player:", error);
        toast({
          description: "Failed to add player. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setPlayers([...players, data]);
      onPlayersChange([...players, data]);
      setNewPlayerFirstName("");
      setNewPlayerLastName("");
      setNewPlayerBirthDate("");
      
      toast({
        description: "Player added successfully",
      });
    } catch (error) {
      console.error("Error adding player:", error);
      toast({
        description: "Failed to add player. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removePlayer = async (playerId: number) => {
    if (isLocked) {
      toast({
        description: "Player list is locked and cannot be modified",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('player_id', playerId);

      if (error) {
        console.error("Error removing player:", error);
        toast({
          description: "Failed to remove player. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const updatedPlayers = players.filter(p => p.player_id !== playerId);
      setPlayers(updatedPlayers);
      onPlayersChange(updatedPlayers);
      
      toast({
        description: "Player removed successfully",
      });
    } catch (error) {
      console.error("Error removing player:", error);
      toast({
        description: "Failed to remove player. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="text-center py-8">Loading players...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Spelers
          <Button
            variant="outline"
            onClick={() => setEditMode(!editMode)}
            disabled={isLocked}
          >
            {editMode ? "Stoppen met bewerken" : "Bewerken"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {editMode && !isLocked && (
          <div className="mb-6 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Nieuwe speler toevoegen</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Voornaam"
                value={newPlayerFirstName}
                onChange={(e) => setNewPlayerFirstName(e.target.value)}
              />
              <Input
                placeholder="Achternaam"
                value={newPlayerLastName}
                onChange={(e) => setNewPlayerLastName(e.target.value)}
              />
              <Input
                type="date"
                placeholder="Geboortedatum"
                value={newPlayerBirthDate}
                onChange={(e) => setNewPlayerBirthDate(e.target.value)}
              />
              <Button onClick={addPlayer}>
                Toevoegen
              </Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Naam</TableHead>
              <TableHead className="w-32">Geboortedatum</TableHead>
              {editMode && <TableHead className="w-24">Acties</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.length === 0 ? (
              <TableRow>
                <TableCell colSpan={editMode ? 4 : 3} className="text-center text-muted-foreground py-4">
                  Geen spelers gevonden
                </TableCell>
              </TableRow>
            ) : (
              players.map((player, index) => (
                <TableRow key={player.player_id}>
                  <TableCell className="font-medium text-center">{index + 1}</TableCell>
                  <TableCell>{`${player.first_name} ${player.last_name}`}</TableCell>
                  <TableCell>{formatDate(player.birth_date)}</TableCell>
                  {editMode && (
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removePlayer(player.player_id)}
                        disabled={isLocked}
                      >
                        Verwijderen
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
