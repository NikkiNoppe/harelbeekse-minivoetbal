import React, { memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
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
  <div className="space-y-3 py-2">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="space-y-1 px-1">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-56" />
      </div>
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
  <div className="flex items-center justify-between gap-2 py-2 px-1 border-b border-border/50 last:border-b-0">
    <div className="flex-1 min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-foreground leading-tight">
          <span className="font-medium">{suspension.playerName}</span>
          {showTeam && <span className="text-muted-foreground"> · {suspension.teamName}</span>}
        </p>
        <Badge variant="outline" className={suspension.source === 'manual' ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground"}>
          {suspension.source === 'manual' ? 'Handmatig' : 'Automatisch'}
        </Badge>
        <Badge variant={suspension.status === 'active' ? 'destructive' : 'secondary'}>
          {suspension.status === 'active' ? 'Actief' : suspension.status === 'pending' ? 'Wachtend' : 'Afgelopen'}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
        {suspension.reason} · {suspension.matches} wedstrijd{suspension.matches !== 1 ? 'en' : ''}
      </p>
      {suspension.suspendedForMatches && suspension.suspendedForMatches.length > 0 && (
        <div className="mt-0.5 space-y-0.5 text-xs text-muted-foreground">
          {suspension.suspendedForMatches.map((match, index) => (
            <div key={`${match.date}-${match.opponent}-${index}`} className="flex items-center gap-1.5">
              <span aria-hidden="true">-</span>
              <span>{formatDateForDisplay(match.date)} – {match.opponent}</span>
            </div>
          ))}
        </div>
      )}
      {!suspension.suspendedForMatches?.length && suspension.suspendedForMatch && (
        <p className="text-xs text-muted-foreground mt-0.5">
          Geschorst voor {formatDateForDisplay(suspension.suspendedForMatch.date)} – tegen {suspension.suspendedForMatch.opponent}
        </p>
      )}
      {!suspension.suspendedForMatch && suspension.endDate && (
        <p className="text-xs text-muted-foreground mt-0.5">
          Eindigt rond {formatDateForDisplay(suspension.endDate)}
        </p>
      )}
      {suspension.notes && (
        <p className="text-xs text-muted-foreground mt-1 border-l-2 border-primary/25 pl-2 leading-snug">
          <span className="font-medium text-foreground/90">Bericht voor team: </span>
          {suspension.notes}
        </p>
      )}
    </div>
    {showActions && onEdit && (
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => onEdit(suspension)}
        aria-label={
          suspension.source === 'manual'
            ? `Bewerk schorsing voor ${suspension.playerName}`
            : `Pas automatische schorsing aan voor ${suspension.playerName}`
        }
        title={suspension.source === 'manual' ? undefined : 'Aanpassen of notitie voor team'}
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
  // Sort chronologically by the date the suspension affects.
  const sortedSuspensions = useMemo(() => {
    return [...suspensions].sort((a, b) => {
      const dateA = a.suspendedForMatch?.date || a.endDate || a.cardDate || '';
      const dateB = b.suspendedForMatch?.date || b.endDate || b.cardDate || '';
      if (!dateA && !dateB) return a.playerName.localeCompare(b.playerName, 'nl', { sensitivity: 'base' });
      if (!dateA) return 1;
      if (!dateB) return -1;
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
    <div role="region" aria-label="Schorsingen lijst">
      {sortedSuspensions.map((suspension) => (
        <SuspensionCard
          key={suspension.id}
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
