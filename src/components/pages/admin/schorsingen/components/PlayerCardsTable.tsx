import React, { memo, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, CircleAlert } from "lucide-react";
import { SuspensionBadge } from "./SuspensionBadge";
import { formatDateForDisplay } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import type { PlayerCard, Suspension } from "@/domains/cards-suspensions";

interface PlayerCardsTableProps {
  playerCards: PlayerCard[];
  suspensions?: Suspension[];
  showTeam?: boolean;
  isLoading?: boolean;
}

const CardSkeleton = memo(() => (
  <div className="space-y-1">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_52px_52px_52px_28px] items-center gap-3 px-3 py-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-5 w-10" />
        <Skeleton className="h-5 w-10" />
        <Skeleton className="h-5 w-10" />
        <Skeleton className="h-5 w-5" />
      </div>
    ))}
  </div>
));

CardSkeleton.displayName = 'CardSkeleton';

const PlayerCardRow = memo(({ 
  card, 
  showTeam,
  suspensions,
  isExpanded,
  onToggle
}: { 
  card: PlayerCard; 
  showTeam: boolean;
  suspensions: Suspension[];
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const cardEvents = card.cardEvents || [];
  const sortedSuspensions = [...suspensions].sort((a, b) => {
    const dateA = a.suspendedForMatch?.date || a.endDate || a.cardDate || '';
    const dateB = b.suspendedForMatch?.date || b.endDate || b.cardDate || '';
    return dateB.localeCompare(dateA);
  });

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className={cn(
          "grid w-full grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_52px_52px_52px_28px] items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
          "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isExpanded && "bg-muted/30"
        )}
      >
        <span className="font-medium text-foreground truncate" title={card.playerName}>
          {card.playerName}
        </span>
        <span className="text-muted-foreground truncate" title={showTeam ? card.teamName : undefined}>
          {showTeam ? card.teamName : '—'}
        </span>
        <span className="flex justify-end">
          <SuspensionBadge type="yellow" count={card.yellowCards} />
        </span>
        <span className="flex justify-end">
          <SuspensionBadge type="red" count={card.redCards} />
        </span>
        <span className="flex justify-end">
          <Badge variant="secondary" className="font-medium">
            {card.yellowCards + card.redCards}
          </Badge>
        </span>
        <span className="flex justify-end text-muted-foreground">
          <ChevronDown
            size={16}
            className={cn("transition-transform duration-200", isExpanded && "rotate-180")}
            aria-hidden="true"
          />
        </span>
      </button>

      {isExpanded && (
        <div className="bg-muted/20 px-3 py-3">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.9fr)]">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-foreground">Kaarten per wedstrijd</h4>
                <Badge variant="outline" className="bg-background">
                  {cardEvents.length} kaart{cardEvents.length !== 1 ? 'en' : ''}
                </Badge>
              </div>

              {cardEvents.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-background/60 px-3 py-2 text-sm text-muted-foreground">
                  Geen wedstrijdhistoriek beschikbaar voor deze kaarttotalen.
                </p>
              ) : (
                <div className="overflow-hidden rounded-md border border-border bg-background">
                  {cardEvents.map((event) => (
                    <div key={event.id} className="grid grid-cols-[120px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/50 px-3 py-1.5 last:border-b-0">
                      <div className="whitespace-nowrap text-xs font-medium text-foreground">
                        {formatDateForDisplay(event.matchDate)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm leading-tight text-foreground">
                          {card.teamName} tegen {event.opponent}
                        </p>
                      </div>
                      <SuspensionBadge type={event.cardType} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CircleAlert size={15} className="text-muted-foreground" />
                <h4 className="text-sm font-semibold text-foreground">Schorsingen</h4>
              </div>

              {sortedSuspensions.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-background/60 px-3 py-2 text-sm text-muted-foreground">
                  Nog geen schorsing gekoppeld aan deze speler.
                </p>
              ) : (
                <div className="space-y-2">
                  {sortedSuspensions.map((suspension) => (
                    <div key={suspension.id} className="rounded-md border border-border/40 bg-background/70 px-3 py-2">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge variant={suspension.status === 'active' ? 'destructive' : 'secondary'}>
                          {suspension.status === 'active' ? 'Actief' : suspension.status === 'pending' ? 'Wachtend' : 'Afgelopen'}
                        </Badge>
                        <Badge variant="outline">
                          {suspension.source === 'manual' ? 'Handmatig' : 'Automatisch'}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground">{suspension.reason}</p>
                      {suspension.notes ? (
                        <p className="mt-1 text-xs text-muted-foreground border-l-2 border-primary/25 pl-2">
                          <span className="font-medium text-foreground/85">Team: </span>
                          {suspension.notes}
                        </p>
                      ) : null}
                      {suspension.suspendedForMatches && suspension.suspendedForMatches.length > 0 ? (
                        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                          {suspension.suspendedForMatches.map((match, index) => (
                            <div key={`${match.date}-${match.opponent}-${index}`} className="flex items-center gap-1.5">
                              <span aria-hidden="true">-</span>
                              <span>{formatDateForDisplay(match.date)} tegen {match.opponent}</span>
                            </div>
                          ))}
                        </div>
                      ) : suspension.suspendedForMatch ? (
                        <p className="text-xs text-muted-foreground">
                          Geschorst voor {formatDateForDisplay(suspension.suspendedForMatch.date)} tegen {suspension.suspendedForMatch.opponent}
                        </p>
                      ) : suspension.endDate ? (
                        <p className="text-xs text-muted-foreground">
                          Eindigt rond {formatDateForDisplay(suspension.endDate)}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

PlayerCardRow.displayName = 'PlayerCardRow';

export const PlayerCardsTable: React.FC<PlayerCardsTableProps> = memo(({ 
  playerCards, 
  suspensions = [],
  showTeam = true,
  isLoading = false 
}) => {
  const [expandedPlayerId, setExpandedPlayerId] = useState<number | null>(null);

  if (isLoading) return <CardSkeleton />;

  if (playerCards.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Geen kaarten geregistreerd.
      </div>
    );
  }

  const sortedCards = useMemo(() => [...playerCards].sort((a, b) => {
    const totalCompare = (b.yellowCards + b.redCards) - (a.yellowCards + a.redCards);
    if (totalCompare !== 0) return totalCompare;
    const teamCompare = a.teamName.localeCompare(b.teamName, 'nl', { sensitivity: 'base' });
    if (teamCompare !== 0) return teamCompare;
    return a.playerName.localeCompare(b.playerName, 'nl', { sensitivity: 'base' });
  }), [playerCards]);

  const suspensionsByPlayerId = useMemo(() => {
    const grouped = new Map<number, Suspension[]>();
    suspensions.forEach((suspension) => {
      const currentSuspensions = grouped.get(suspension.playerId) || [];
      currentSuspensions.push(suspension);
      grouped.set(suspension.playerId, currentSuspensions);
    });
    return grouped;
  }, [suspensions]);

  return (
    <div className="overflow-hidden rounded-md border border-border" role="region" aria-label="Kaarten lijst">
      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_52px_52px_52px_28px] items-center gap-3 border-b border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
        <span>Speler</span>
        <span>{showTeam ? 'Team' : 'Team'}</span>
        <span className="text-right">Geel</span>
        <span className="text-right">Rood</span>
        <span className="text-right">Totaal</span>
        <span className="sr-only">Details</span>
      </div>
      {sortedCards.map((card) => (
        <PlayerCardRow
          key={card.playerId}
          card={card}
          showTeam={showTeam}
          suspensions={suspensionsByPlayerId.get(card.playerId) || []}
          isExpanded={expandedPlayerId === card.playerId}
          onToggle={() => setExpandedPlayerId((currentPlayerId) => currentPlayerId === card.playerId ? null : card.playerId)}
        />
      ))}
    </div>
  );
});

PlayerCardsTable.displayName = 'PlayerCardsTable';
