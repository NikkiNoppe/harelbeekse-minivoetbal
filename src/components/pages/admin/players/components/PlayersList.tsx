import React, { useState } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Player {
  player_id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
}

interface PlayersListProps {
  players: Player[];
  loading: boolean;
  editMode: boolean;
  onRemovePlayer: (playerId: number) => void;
  onEditPlayer: (playerId: number) => void;
  formatDate: (dateString: string) => string;
  getFullName: (player: Player) => string;
}

const PlayersList: React.FC<PlayersListProps> = ({
  players,
  loading,
  editMode,
  onRemovePlayer,
  onEditPlayer,
  formatDate
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);

  const handleDeleteClick = (player: Player) => {
    setPlayerToDelete(player);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (playerToDelete) {
      onRemovePlayer(playerToDelete.player_id);
      setDeleteDialogOpen(false);
      setPlayerToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setPlayerToDelete(null);
  };

  if (loading) {
    return <div className="py-4 text-center text-muted-foreground">Spelers laden...</div>;
  }

  return (
    <>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[600px]">
          <Table className="table w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="num min-w-[60px]">#</TableHead>
            <TableHead className="min-w-[120px]">Voornaam</TableHead>
            <TableHead className="min-w-[120px]">Achternaam</TableHead>
            <TableHead className="center min-w-[120px]">Geboortedatum</TableHead>
            {editMode && <TableHead className="center min-w-[120px]">Acties</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.length === 0 ? (
            <TableRow>
              <TableCell colSpan={editMode ? 5 : 4} className="text-center text-muted-foreground py-4">
                Geen spelers gevonden
              </TableCell>
            </TableRow>
          ) :
            players.map((player, index) => (
              <TableRow key={player.player_id}>
                <TableCell className="num font-medium">{index + 1}</TableCell>
                <TableCell>{player.first_name}</TableCell>
                <TableCell>{player.last_name}</TableCell>
                <TableCell className="center">{formatDate(player.birth_date)}</TableCell>
                {editMode && (
                  <TableCell className="center">
                    <div className="flex items-center gap-1 justify-center">
                      <Button
                        onClick={() => onEditPlayer(player.player_id)}
                        className="btn btn--icon"
                      >
                        <Edit2 size={15} />
                      </Button>
                      <Button
                        onClick={() => handleDeleteClick(player)}
                        className="btn btn--icon btn--danger"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          }
        </TableBody>
      </Table>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="modal">
          <AlertDialogHeader>
            <AlertDialogTitle className="modal__title">
              Speler verwijderen
            </AlertDialogTitle>
            <div className="text-center">
              Weet je zeker dat je <strong>{playerToDelete?.first_name} {playerToDelete?.last_name}</strong> wilt verwijderen?
              <br />
              Deze actie kan niet ongedaan worden gemaakt.
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="modal__actions">
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="btn btn--danger flex-1"
            >
              Verwijderen
            </AlertDialogAction>
            <AlertDialogCancel 
              onClick={handleCancelDelete}
              className="btn btn--secondary flex-1"
            >
              Annuleren
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PlayersList; 