import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Calendar, User } from "lucide-react";
import { AppAlertModal } from "@/components/modals";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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

// Loading skeleton
const PlayerCardSkeleton = () => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Empty state
const EmptyState = () => (
  <Card>
    <CardContent className="py-12 px-6 sm:px-8">
      <div className="text-center">
        <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2 text-foreground">Geen spelers</h3>
        <p className="text-muted-foreground">
          Er zijn nog geen spelers toegevoegd aan deze lijst.
        </p>
      </div>
    </CardContent>
  </Card>
);

const PlayersList: React.FC<PlayersListProps> = ({
  players,
  loading,
  editMode,
  onRemovePlayer,
  onEditPlayer,
  formatDate,
  getFullName
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const isMobile = useIsMobile();

  const handleDeleteClick = (player: Player, e: React.MouseEvent) => {
    e.stopPropagation();
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
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <PlayerCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (players.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="space-y-3" role="region" aria-label="Spelerslijst">
        {players.map((player, index) => (
          <Card 
            key={player.player_id}
            className="hover:shadow-md transition-shadow duration-200 border border-[var(--color-200)]"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <h3 className="font-semibold text-base text-foreground truncate">
                      {getFullName(player)}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{formatDate(player.birth_date)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                {editMode && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      onClick={() => onEditPlayer(player.player_id)}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-9 px-3 gap-1.5 border-[var(--color-300)]",
                        "hover:bg-[var(--color-100)] hover:border-[var(--color-400)]",
                        "text-[var(--color-700)] hover:text-[var(--color-900)]",
                        "transition-colors duration-150"
                      )}
                      aria-label={`Bewerk ${getFullName(player)}`}
                    >
                      <Edit2 size={14} />
                      <span className="text-xs font-medium">Bewerk</span>
                    </Button>
                    <Button
                      onClick={(e) => handleDeleteClick(player, e)}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-9 px-3 gap-1.5 border-red-300",
                        "hover:bg-red-50 hover:border-red-400",
                        "text-red-600 hover:text-red-700",
                        "transition-colors duration-150"
                      )}
                      aria-label={`Verwijder ${getFullName(player)}`}
                    >
                      <Trash2 size={14} />
                      <span className="text-xs font-medium">Verwijder</span>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AppAlertModal
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Speler verwijderen"
        description={
          <div className="text-center">
            Weet je zeker dat je <strong>{playerToDelete?.first_name} {playerToDelete?.last_name}</strong> wilt verwijderen?
            <br />
            <span className="text-sm text-muted-foreground">Deze actie kan niet ongedaan worden gemaakt.</span>
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
