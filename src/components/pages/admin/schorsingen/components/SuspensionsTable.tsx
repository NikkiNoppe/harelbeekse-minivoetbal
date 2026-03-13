import React, { memo, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit } from "lucide-react";
import { formatDateForDisplay } from "@/lib/dateUtils";
import type { Suspension } from "@/domains/cards-suspensions";

interface SuspensionsTableProps {
  suspensions: Suspension[];
  showTeam?: boolean;
  showActions?: boolean;
  isLoading?: boolean;
  onEdit?: (suspension: Suspension) => void;
}

const CardSkeleton = memo(() => (
  <div className="space-y-2">
    {[...Array(3)].map((_, i) => (
      <Card key={i} className="border border-border">
        <CardContent className="p-3 pt-3 bg-transparent space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    ))}
  </div>
));

CardSkeleton.displayName = 'SuspensionsCardSkeleton';

const SuspensionCard = memo(({ 
  suspension, 
  showTeam, 
  showActions, 
  onEdit
}: { 
  suspension: Suspension; 
  showTeam: boolean;
  showActions: boolean;
  onEdit?: (suspension: Suspension) => void;
}) => (
  <Card className="border border-border hover:shadow-sm transition-shadow duration-200">
    <CardContent className="p-3 pt-3 bg-transparent">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 space-y-1">
          {/* Player + Team */}
          <h3 className="font-semibold text-sm text-foreground truncate">
            {suspension.playerName}
            {showTeam && (
              <span className="font-normal text-muted-foreground"> ({suspension.teamName})</span>
            )}
          </h3>

          {/* Reden */}
          <p className="text-xs text-muted-foreground">
            {suspension.reason}
          </p>

          {/* Geschorst voor wedstrijd */}
          {suspension.suspendedForMatch && (
            <p className="text-sm text-foreground">
              <span className="text-muted-foreground">Geschorst voor wedstrijd: </span>
              {formatDateForDisplay(suspension.suspendedForMatch.date)} – tegen {suspension.suspendedForMatch.opponent}
            </p>
          )}

          {/* Wedstrijden */}
          <p className="text-xs text-muted-foreground">
            Wedstrijden: <span className="font-semibold text-foreground">{suspension.matches}</span>
          </p>
        </div>

        {showActions && onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(suspension)}
            aria-label={`Bewerk schorsing voor ${suspension.playerName}`}
          >
            <Edit size={16} />
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
));

SuspensionCard.displayName = 'SuspensionCard';

export const SuspensionsTable: React.FC<SuspensionsTableProps> = memo(({ 
  suspensions, 
  showTeam = true,
  showActions = false,
  isLoading = false,
  onEdit
}) => {
  // Sort chronologically by suspendedForMatch date or cardDate
  const sortedSuspensions = useMemo(() => {
    return [...suspensions].sort((a, b) => {
      const dateA = a.suspendedForMatch?.date || a.cardDate || '';
      const dateB = b.suspendedForMatch?.date || b.cardDate || '';
      return dateA.localeCompare(dateB);
    });
  }, [suspensions]);

  if (isLoading) return <CardSkeleton />;

  if (sortedSuspensions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Geen schorsingen gevonden.
      </div>
    );
  }

  return (
    <div className="space-y-2" role="region" aria-label="Schorsingen lijst">
      {sortedSuspensions.map((suspension) => (
        <SuspensionCard
          key={`${suspension.playerId}-${suspension.reason}`}
          suspension={suspension}
          showTeam={showTeam}
          showActions={showActions}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
});

SuspensionsTable.displayName = 'SuspensionsTable';
