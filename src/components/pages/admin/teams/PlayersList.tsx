import React, { useState, useEffect } from "react";
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
import { playerService, Player } from "@/services/core";
import { supabase } from "@/integrations/supabase/client";
import { formatDateShort } from "@/lib/dateUtils";

interface PlayersListProps {
  teamId: number;
  teamName: string;
  teamEmail: string;
}

const PlayersList: React.FC<PlayersListProps> = ({ teamId, teamName, teamEmail }) => {
  const { toast } = useToast();
  const { isLocked, lockDate, canEdit } = usePlayerListLock();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlayerFirstName, setNewPlayerFirstName] = useState("");
  const [newPlayerLastName, setNewPlayerLastName] = useState("");
  const [newPlayerBirthDate, setNewPlayerBirthDate] = useState("");

  // Load players from database
  useEffect(() => {
    loadPlayers();
  }, [teamId]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const playersData = await playerService.getPlayersByTeam(teamId);
      setPlayers(playersData);
    } catch (error) {
      toast({
        title: "Fout bij laden spelers",
        description: "Er is een fout opgetreden bij het laden van de spelers.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const showLockWarning = () => {
    if (isLocked && lockDate) {
      toast({
        title: "Spelerslijst vergrendeld",
        description: `Wijzigingen zijn niet toegestaan vanaf ${formatDateShort(lockDate)}`,
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

  const handleAddPlayer = async () => {
    if (!canEdit) {
      showLockWarning();
      return;
    }

    if (!newPlayerFirstName || !newPlayerLastName || !newPlayerBirthDate) {
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

    try {
      const { error } = await supabase
        .from('players')
        .insert({
          first_name: newPlayerFirstName,
          last_name: newPlayerLastName,
          birth_date: newPlayerBirthDate,
          team_id: teamId
        });

      if (error) throw error;

      setNewPlayerFirstName("");
      setNewPlayerLastName("");
      setNewPlayerBirthDate("");

      toast({
        title: "Speler toegevoegd",
        description: `${newPlayerFirstName} ${newPlayerLastName} is toegevoegd aan het team`,
      });

      // Reload players
      await loadPlayers();
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de speler.",
        variant: "destructive",
      });
    }
  };

  const handleRemovePlayer = async (playerId: number) => {
    if (!canEdit) {
      showLockWarning();
      return;
    }

    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('player_id', playerId);

      if (error) throw error;

      toast({
        title: "Speler verwijderd",
        description: "De speler is permanent verwijderd uit het team",
      });

      // Reload players
      await loadPlayers();
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van de speler.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center py-8">Spelers laden...</div>;
  }

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
              Spelerslijst vergrendeld vanaf {formatDateShort(lockDate)}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="player-first-name" className="block text-sm font-medium">
                Voornaam
              </label>
              <Input
                id="player-first-name"
                value={newPlayerFirstName}
                onChange={(e) => setNewPlayerFirstName(e.target.value)}
                placeholder="Voer voornaam in"
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="player-last-name" className="block text-sm font-medium">
                Achternaam
              </label>
              <Input
                id="player-last-name"
                value={newPlayerLastName}
                onChange={(e) => setNewPlayerLastName(e.target.value)}
                placeholder="Voer achternaam in"
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="player-birth-date" className="block text-sm font-medium">
                Geboortedatum
              </label>
              <Input
                id="player-birth-date"
                type="date"
                value={newPlayerBirthDate}
                onChange={(e) => setNewPlayerBirthDate(e.target.value)}
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
            <div
              className="max-h-[50vh] sm:max-h-[60vh] md:max-h-[65vh] overflow-y-auto"
              role="region"
              aria-label={`Spelerslijst voor ${teamName}`}
            >
            <Table className="table w-full text-sm md:text-base">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky top-0 bg-inherit z-10">Voornaam</TableHead>
                  <TableHead className="sticky top-0 bg-inherit z-10">Achternaam</TableHead>
                  <TableHead className="sticky top-0 bg-inherit z-10">Geboortedatum</TableHead>
                  <TableHead className="text-right sticky top-0 bg-inherit z-10">Actie</TableHead>
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
                    <TableRow key={player.player_id}>
                      <TableCell className="font-medium">{player.first_name}</TableCell>
                      <TableCell>{player.last_name}</TableCell>
                      <TableCell>{formatDateShort(player.birth_date)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePlayer(player.player_id)}
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
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayersList;
