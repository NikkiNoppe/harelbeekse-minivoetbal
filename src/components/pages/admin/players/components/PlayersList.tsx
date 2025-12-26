import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Calendar, User, Loader2 } from "lucide-react";
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

// Loading skeleton - matches actual card layout
const PlayerCardSkeleton = () => (
  <Card className="border border-[var(--color-200)]">
    <CardContent className="p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Skeleton className="h-4 w-32 mb-2" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
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
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 py-4 mb-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Spelers worden geladen...</span>
        </div>
        {[1, 2, 3, 4].map((i) => (
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
      <div className="space-y-2" role="region" aria-label="Spelerslijst">
        {players.map((player, index) => (
          <Card 
            key={player.player_id}
            className="hover:shadow-md transition-shadow duration-200 border border-[var(--color-200)]"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                {/* Player Name - Left */}
                <h3 className="font-semibold text-sm text-foreground truncate flex-1 min-w-0">
                  {getFullName(player)}
                </h3>

                {/* Birth Date and Action Buttons - Right */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span className="whitespace-nowrap">{formatDate(player.birth_date)}</span>
                  </div>

                  {/* Action Buttons */}
                  {editMode && (
                    <div className="flex items-center gap-1.5">
                    <Button
                      onClick={() => onEditPlayer(player.player_id)}
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-9 px-3 gap-1.5 border-[var(--color-300)]",
                        "hover:bg-[var(--color-100)] hover:border-[var(--color-400)]",
                        "text-[var(--color-700)] hover:text-[var(--color-900)]",
                        "transition-colors duration-150"
                      )}
                      style={{ 
                        color: 'var(--accent)',
                        backgroundColor: 'var(--color-300)',
                        height: '32px',
                        width: '32px',
                        minHeight: '32px',
                        maxHeight: '32px',
                        minWidth: '32px',
                        maxWidth: '32px'
                      }}
                      aria-label={`Bewerk ${getFullName(player)}`}
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      onClick={(e) => handleDeleteClick(player, e)}
                      variant="outline"
                      size="icon"
                      className={cn(
                        "!h-8 !w-8 !min-h-0 !max-h-8 !max-w-8 rounded-md border-red-300",
                        "hover:bg-red-50 hover:border-red-400",
                        "text-red-600 hover:text-red-700",
                        "transition-colors duration-150"
                      )}
                      style={{ 
                        height: '32px',
                        width: '32px',
                        minHeight: '32px',
                        maxHeight: '32px',
                        minWidth: '32px',
                        maxWidth: '32px'
                      }}
                      aria-label={`Verwijder ${getFullName(player)}`}
                    >
                      <Trash2 size={14} />
                    </Button>
                    </div>
                  )}
                </div>
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
