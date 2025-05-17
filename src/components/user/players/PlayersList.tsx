
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
import { Trash2 } from "lucide-react";

interface Player {
  player_id: number;
  player_name: string;
  birth_date: string;
}

interface PlayersListProps {
  players: Player[];
  loading: boolean;
  editMode: boolean;
  onRemovePlayer: (playerId: number) => void;
  formatDate: (dateString: string) => string;
}

const PlayersList: React.FC<PlayersListProps> = ({
  players,
  loading,
  editMode,
  onRemovePlayer,
  formatDate
}) => {
  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Spelers laden...</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Naam</TableHead>
          <TableHead>Geboortedatum</TableHead>
          {editMode && <TableHead className="w-20">Acties</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.length === 0 ? (
          <TableRow>
            <TableCell colSpan={editMode ? 3 : 2} className="text-center text-muted-foreground py-6">
              Geen spelers gevonden
            </TableCell>
          </TableRow>
        ) : (
          players.map(player => (
            <TableRow key={player.player_id}>
              <TableCell>{player.player_name}</TableCell>
              <TableCell>{formatDate(player.birth_date)}</TableCell>
              {editMode && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemovePlayer(player.player_id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default PlayersList;
