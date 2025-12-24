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
import { AppAlertModal } from "@/components/modals";

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
        <div className="min-w-0 lg:min-w-[900px] table-no-inner-scroll-mobile" role="region" aria-label="Spelerslijst">
          <Table className="table w-full text-sm md:text-base">
            <TableHeader>
              <TableRow className="table-header-row">
                <TableHead className="num min-w-[40px] sticky top-0 bg-inherit z-10 hidden md:table-cell">#</TableHead>
                <TableHead className="min-w-[120px] sticky top-0 bg-inherit z-10">Voornaam</TableHead>
                <TableHead className="min-w-[140px] sticky top-0 bg-inherit z-10">Achternaam</TableHead>
                <TableHead className="center min-w-[140px] md:min-w-[160px] sticky top-0 bg-inherit z-10 hidden sm:table-cell">Geboortedatum</TableHead>
                {editMode && <TableHead className="center min-w-[100px] sticky top-0 bg-inherit z-10">Acties</TableHead>}
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
                  <TableRow key={player.player_id}>
                    <TableCell className="num font-medium hidden md:table-cell">{index + 1}</TableCell>
                    <TableCell className="font-medium truncate max-w-[120px] sm:max-w-[160px] text-xs sm:text-sm">{player.first_name}</TableCell>
                    <TableCell className="truncate max-w-[140px] sm:max-w-[180px] text-xs sm:text-sm">{player.last_name}</TableCell>
                    <TableCell className="center hidden sm:table-cell text-xs sm:text-sm">{formatDate(player.birth_date)}</TableCell>
                    {editMode && (
                      <TableCell className="center whitespace-nowrap">
                        <div className="flex items-center gap-1 justify-center">
                          <Button
                            onClick={() => onEditPlayer(player.player_id)}
                            className="btn btn--icon btn--edit"
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
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AppAlertModal
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Speler verwijderen"
        description={
          <div className="text-center">
            Weet je zeker dat je <strong>{playerToDelete?.first_name} {playerToDelete?.last_name}</strong> wilt verwijderen?
            <br />
            Deze actie kan niet ongedaan worden gemaakt.
          </div>
        }
        confirmAction={{
          label: "Verwijderen",
          onClick: handleConfirmDelete,
          variant: "destructive",
        }}
        cancelAction={{
          label: "Annuleren",
          onClick: handleCancelDelete,
          variant: "secondary",
        }}
      />
    </>
  );
};

export default PlayersList; 