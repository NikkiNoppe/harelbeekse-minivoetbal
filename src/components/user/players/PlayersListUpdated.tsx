
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2 } from "lucide-react";

interface Player {
  player_id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
}

interface PlayersListUpdatedProps {
  players: Player[];
  loading: boolean;
  editMode: boolean;
  onRemovePlayer: (playerId: number) => void;
  onEditPlayer: (playerId: number) => void;
  formatDate: (dateString: string) => string;
  getFullName: (player: Player) => string;
}

const PlayersListUpdated: React.FC<PlayersListUpdatedProps> = ({
  players,
  loading,
  editMode,
  onRemovePlayer,
  onEditPlayer,
  formatDate
}) => {
  if (loading) {
    return <div className="py-4 text-center text-muted-foreground">Spelers laden...</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Voornaam</TableHead>
          <TableHead>Achternaam</TableHead>
          <TableHead className="w-32">Geboortedatum</TableHead>
          {editMode && <TableHead className="w-24">Acties</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.length === 0 ? (
          <TableRow>
            <TableCell colSpan={editMode ? 5 : 4} className="text-center text-muted-foreground py-4">
              Geen spelers gevonden
            </TableCell>
          </TableRow>
        ) : (
          players.map((player, index) => (
            <TableRow key={player.player_id} className="h-10">
              <TableCell className="font-medium text-center">{index + 1}</TableCell>
              <TableCell className="py-1">{player.first_name}</TableCell>
              <TableCell className="py-1">{player.last_name}</TableCell>
              <TableCell className="py-1">{formatDate(player.birth_date)}</TableCell>
              {editMode && (
                <TableCell className="py-1">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditPlayer(player.player_id)}
                      className="h-7 w-7 p-0 bg-white text-purple-600 border-purple-400 hover:bg-purple-50"
                    >
                      <Edit2 size={15} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemovePlayer(player.player_id)}
                      className="h-7 w-7 p-0 bg-white text-red-500 border-red-400 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default PlayersListUpdated;
