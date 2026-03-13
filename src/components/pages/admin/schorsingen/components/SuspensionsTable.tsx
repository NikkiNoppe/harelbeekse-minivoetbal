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
  <div className="flex items-center justify-between gap-2 py-2 px-1 border-b border-border last:border-b-0">
    <div className="flex-1 min-w-0">
      <p className="text-sm text-foreground leading-tight">
        <span className="font-medium">{suspension.playerName}</span>
        {showTeam && <span className="text-muted-foreground"> · {suspension.teamName}</span>}
        <span className="text-muted-foreground"> · {suspension.reason}</span>
      </p>
      {suspension.suspendedForMatch && (
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDateForDisplay(suspension.suspendedForMatch.date)} – tegen {suspension.suspendedForMatch.opponent} · {suspension.matches} wedstrijd{suspension.matches !== 1 ? 'en' : ''}
        </p>
      )}
    </div>
    {showActions && onEdit && (
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => onEdit(suspension)}
        aria-label={`Bewerk schorsing voor ${suspension.playerName}`}
      >
        <Edit size={14} />
      </Button>
    )}
  </div>
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
