import React, { memo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2 } from "lucide-react";
import { SuspensionBadge } from "./SuspensionBadge";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { formatDateForDisplay } from "@/lib/dateUtils";
import type { Suspension } from "@/domains/cards-suspensions";

interface SuspensionsTableProps {
  suspensions: Suspension[];
  showTeam?: boolean;
  showActions?: boolean;
  isLoading?: boolean;
  onEdit?: (suspension: Suspension) => void;
  onDelete?: (suspension: Suspension) => void;
}

const TableSkeleton = memo(() => (
  <Table>
    <TableHeader>
      <TableRow className="table-header-row">
        <TableHead>Speler</TableHead>
        <TableHead>Team</TableHead>
        <TableHead>Reden</TableHead>
        <TableHead className="text-center">Wedstrijden</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
));

TableSkeleton.displayName = 'SuspensionsTableSkeleton';

// Mobile Card Skeleton
const CardSkeleton = memo(() => (
  <div className="md:hidden space-y-2">
    {[...Array(3)].map((_, i) => (
      <Card key={i} className="border border-[var(--color-200)]">
        <CardContent className="p-[12px] pt-[12px] space-y-2 bg-transparent">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-6 w-16" />
        </CardContent>
      </Card>
    ))}
  </div>
));

CardSkeleton.displayName = 'CardSkeleton';

// Mobile Card View
const SuspensionCard = memo(({ 
  suspension, 
  showTeam, 
  showActions, 
  onEdit, 
  onDelete 
}: { 
  suspension: Suspension; 
  showTeam: boolean;
  showActions: boolean;
  onEdit?: (suspension: Suspension) => void;
  onDelete?: (suspension: Suspension) => void;
}) => (
  <Card className="border border-[var(--color-200)] hover:shadow-md transition-shadow duration-200">
    <CardContent className="p-[12px] pt-[12px] space-y-3 bg-transparent">
      {/* Primary info */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">
              {suspension.playerName}
            </h3>
            {showTeam && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {suspension.teamName}
              </p>
            )}
          </div>
          <SuspensionBadge type={suspension.status} />
        </div>
        
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
          <div className="flex-1 min-w-0">
            <span className="text-xs text-muted-foreground">Reden:</span>
            <p className="text-sm text-foreground mt-0.5">{suspension.reason}</p>
            {suspension.cardDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Kaart ontvangen op: {formatDateForDisplay(suspension.cardDate)}
              </p>
            )}
          </div>
        </div>
        
        {suspension.suspendedForMatch && (
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
            <div className="flex-1 min-w-0">
              <span className="text-xs text-muted-foreground">Geschorst voor wedstrijd:</span>
              <p className="text-sm text-foreground mt-0.5">
                {formatDateForDisplay(suspension.suspendedForMatch.date)} - tegen {suspension.suspendedForMatch.opponent}
              </p>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-xs text-muted-foreground">Wedstrijden:</span>
            <p className="text-sm font-semibold text-foreground mt-0.5">{suspension.matches}</p>
          </div>
          {showActions && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onEdit && (
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-8 w-8 border-[var(--color-300)]",
                    "bg-white hover:bg-purple-50 hover:border-[var(--color-400)]",
                    "text-[var(--color-700)] hover:text-[var(--color-900)]",
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
                  onClick={() => onEdit(suspension)}
                  aria-label={`Bewerk schorsing voor ${suspension.playerName}`}
                >
                  <Edit size={16} />
                </Button>
              )}
              {onDelete && (
                <Button
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
                  onClick={() => onDelete(suspension)}
                  aria-label={`Verwijder schorsing voor ${suspension.playerName}`}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          )}
        </div>
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
  onEdit,
  onDelete
}) => {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <>
        {isMobile ? <CardSkeleton /> : <TableSkeleton />}
      </>
    );
  }

  if (suspensions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Geen actieve schorsingen.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: Card View */}
      <div className="md:hidden space-y-2" role="region" aria-label="Schorsingen lijst">
        {suspensions.map((suspension) => (
          <SuspensionCard
            key={`${suspension.playerId}-${suspension.reason}`}
            suspension={suspension}
            showTeam={showTeam}
            showActions={showActions}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="table-header-row">
              <TableHead>Speler</TableHead>
              {showTeam && <TableHead>Team</TableHead>}
              <TableHead>Reden</TableHead>
              <TableHead>Kaart datum</TableHead>
              <TableHead>Geschorst voor</TableHead>
              <TableHead className="text-center">Wedstrijden</TableHead>
              <TableHead>Status</TableHead>
              {showActions && <TableHead className="text-right">Acties</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {suspensions.map((suspension) => (
              <TableRow key={`${suspension.playerId}-${suspension.reason}`}>
                <TableCell className="font-medium">{suspension.playerName}</TableCell>
                {showTeam && <TableCell className="text-muted-foreground">{suspension.teamName}</TableCell>}
                <TableCell>{suspension.reason}</TableCell>
                <TableCell className="text-muted-foreground">
                  {suspension.cardDate ? formatDateForDisplay(suspension.cardDate) : '-'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {suspension.suspendedForMatch 
                    ? `${formatDateForDisplay(suspension.suspendedForMatch.date)} - ${suspension.suspendedForMatch.opponent}`
                    : '-'
                  }
                </TableCell>
                <TableCell className="text-center font-semibold">{suspension.matches}</TableCell>
                <TableCell>
                  <SuspensionBadge type={suspension.status} />
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      {onEdit && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(suspension)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => onDelete(suspension)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
});

SuspensionsTable.displayName = 'SuspensionsTable';
