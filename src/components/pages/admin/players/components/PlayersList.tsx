import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Calendar, User, Loader2, Trophy } from "lucide-react";
import { AppAlertModal } from "@/components/modals";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getRosterDisplayName } from "../utils/playerUtils";

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
  variant?: "default" | "profile";
  /** Wedstrijdtelling per speler (profiel-spelerslijst) */
  matchCountByPlayerId?: Map<number, number>;
}

// Loading skeleton - matches actual card layout
const PlayerCardSkeleton = ({ profile = false }: { profile?: boolean }) =>
  profile ? (
    <div className="px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  ) : (
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
const EmptyState = ({ profile = false }: { profile?: boolean }) =>
  profile ? (
    <p className="text-sm text-muted-foreground italic">
      Nog geen spelers toegevoegd. Gebruik &quot;Speler toevoegen&quot; om te
      starten.
    </p>
  ) : (
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
  getFullName,
  variant = "default",
  matchCountByPlayerId,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const isProfile = variant === "profile";

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
      <div className="space-y-2" aria-busy="true" aria-label="Spelers laden">
        {!isProfile && (
          <div className="flex items-center justify-center gap-2 py-4 mb-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Spelers worden geladen...</span>
          </div>
        )}
        {[1, 2, 3, 4].map((i) => (
          <PlayerCardSkeleton key={i} profile={isProfile} />
        ))}
      </div>
    );
  }

  if (players.length === 0) {
    return <EmptyState profile={isProfile} />;
  }

  const editButtonClass = cn(
    "min-h-[44px] min-w-[44px] transition-colors duration-150",
    isProfile
      ? "h-11 w-11 border-border bg-background hover:bg-muted/50"
      : "h-9 border-[var(--color-300)] bg-white hover:bg-brand-50 hover:border-[var(--color-400)] text-[var(--color-700)] hover:text-[var(--color-900)]",
  );

  const deleteButtonClass = cn(
    "min-h-[44px] min-w-[44px] rounded-md border-red-300 transition-colors duration-150",
    "hover:bg-red-50 hover:border-red-400 text-red-600 hover:text-red-700",
    isProfile ? "h-11 w-11" : "!h-8 !w-8 !min-h-0 !max-h-8 !max-w-8",
  );

  const playerRows = players.map((player) => {
    const matchCount = matchCountByPlayerId?.get(player.player_id);
    const displayName = isProfile
      ? getRosterDisplayName(player)
      : getFullName(player);

    const rowContent = (
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {displayName}
          </h3>
          {isProfile && matchCountByPlayerId && matchCount !== undefined && (
            <span
              className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums"
              title="Gespeelde wedstrijden"
            >
              <Trophy className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              <span>
                {matchCount}{" "}
                {matchCount === 1 ? "wedstrijd" : "wedstrijden"}
              </span>
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" aria-hidden />
            <span className="whitespace-nowrap">{formatDate(player.birth_date)}</span>
          </div>
          {editMode && (
            <div className="flex items-center gap-1.5">
              <Button
                onClick={() => onEditPlayer(player.player_id)}
                variant="outline"
                size="icon"
                className={editButtonClass}
                aria-label={`Bewerk ${displayName}`}
              >
                <Edit2 size={16} />
              </Button>
              <Button
                onClick={(e) => handleDeleteClick(player, e)}
                variant="outline"
                size="icon"
                className={deleteButtonClass}
                aria-label={`Verwijder ${displayName}`}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>
    );

    if (isProfile) {
      return (
        <div
          key={player.player_id}
          className="px-3 py-2.5 first:pt-2.5 last:pb-2.5"
        >
          {rowContent}
        </div>
      );
    }

    return (
      <Card
        key={player.player_id}
        className="border border-[var(--color-200)] transition-shadow duration-200 hover:shadow-md"
      >
        <CardContent className="!p-4 !sm:p-4">{rowContent}</CardContent>
      </Card>
    );
  });

  return (
    <>
      <div
        className={cn(
          isProfile
            ? "overflow-hidden rounded-md border border-border/50 bg-card divide-y divide-border/40"
            : "space-y-2",
        )}
        role="region"
        aria-label="Spelerslijst"
      >
        {playerRows}
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
