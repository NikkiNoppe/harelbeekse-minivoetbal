
import React, { useState, useEffect } from "react";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@shared/components/ui/dialog";
import { Label } from "@shared/components/ui/label";
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
import { TeamPlayer } from "./match-form/components/useTeamPlayers";
import { playerService } from "@shared/services/playerService";

interface PlayersListProps {
  teamId: number;
  onPlayersChange: (players: TeamPlayer[]) => void;
}

export const PlayersList: React.FC<PlayersListProps> = ({ teamId, onPlayersChange }) => {
  const [players, setPlayers] = useState<TeamPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthDate: "",
  });

  const { isLocked } = usePlayerListLock();

  useEffect(() => {
    fetchPlayers();
  }, [teamId]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const teamPlayers = await playerService.getPlayersByTeam(teamId);
      setPlayers(teamPlayers);
      onPlayersChange(teamPlayers);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast({
        title: "Failed to load players",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!newPlayer.firstName || !newPlayer.lastName) {
      toast({
        title: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    if (isLocked) {
      toast({
        title: "Player list is locked",
        variant: "destructive",
      });
      return;
    }

    try {
      const playerData = {
        first_name: newPlayer.firstName,
        last_name: newPlayer.lastName,
        email: newPlayer.email || null,
        phone: newPlayer.phone || null,
        birth_date: newPlayer.birthDate || null,
        team_id: teamId,
      };

      await playerService.addPlayer(playerData);
      
      toast({
        title: "Player added successfully",
      });
      
      setNewPlayer({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        birthDate: "",
      });
      setIsAddDialogOpen(false);
      fetchPlayers();
    } catch (error) {
      console.error("Error adding player:", error);
      toast({
        title: "Failed to add player",
        variant: "destructive",
      });
    }
  };

  const handleRemovePlayer = async (playerId: number) => {
    if (isLocked) {
      toast({
        title: "Player list is locked",
        variant: "destructive",
      });
      return;
    }

    try {
      await playerService.removePlayer(playerId);
      toast({
        title: "Player removed successfully",
      });
      fetchPlayers();
    } catch (error) {
      console.error("Error removing player:", error);
      toast({
        title: "Failed to remove player",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading players...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Team Players
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isLocked}>
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Player</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newPlayer.firstName}
                    onChange={(e) => setNewPlayer({ ...newPlayer, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newPlayer.lastName}
                    onChange={(e) => setNewPlayer({ ...newPlayer, lastName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newPlayer.email}
                    onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newPlayer.phone}
                    onChange={(e) => setNewPlayer({ ...newPlayer, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={newPlayer.birthDate}
                    onChange={(e) => setNewPlayer({ ...newPlayer, birthDate: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddPlayer} className="w-full">
                  Add Player
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Birth Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => (
              <TableRow key={player.player_id}>
                <TableCell>
                  {player.first_name} {player.last_name}
                </TableCell>
                <TableCell>{player.email || "-"}</TableCell>
                <TableCell>{player.phone || "-"}</TableCell>
                <TableCell>{player.birth_date || "-"}</TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemovePlayer(player.player_id)}
                    disabled={isLocked}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
