import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SuspensionBadge } from "./SuspensionBadge";
import type { PlayerCard } from "@/domains/cards-suspensions";

interface PlayerCardsTableProps {
  playerCards: PlayerCard[];
  showTeam?: boolean;
  isLoading?: boolean;
}

// Card Skeleton
const CardSkeleton = memo(() => (
  <div className="space-y-2">
    {[...Array(3)].map((_, i) => (
      <Card key={i} className="border border-[var(--color-200)]">
        <CardContent className="p-[12px] pt-[12px] bg-transparent">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24 mt-0.5" />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
));

CardSkeleton.displayName = 'CardSkeleton';

const getStatusBadge = (card: PlayerCard) => {
  if (card.redCards > 0) {
    return <SuspensionBadge type="active" />;
  }
  if (card.yellowCards >= 5) {
    return <SuspensionBadge type="active" />;
  }
  if (card.yellowCards >= 3) {
    return <SuspensionBadge type="pending" />;
  }
  return null;
};

// Mobile Card View
const PlayerCardCard = memo(({ 
  card, 
  showTeam 
}: { 
  card: PlayerCard; 
  showTeam: boolean;
}) => {
  const statusBadge = getStatusBadge(card);
  
  return (
    <Card className="border border-[var(--color-200)] hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-[12px] pt-[12px] bg-transparent">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">
              {card.playerName}
            </h3>
            {showTeam && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {card.teamName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <SuspensionBadge type="yellow" count={card.yellowCards} />
            <SuspensionBadge type="red" count={card.redCards} />
            {statusBadge && (
              <div className="flex-shrink-0">
                {statusBadge}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

PlayerCardCard.displayName = 'PlayerCardCard';

export const PlayerCardsTable: React.FC<PlayerCardsTableProps> = memo(({ 
  playerCards, 
  showTeam = true,
  isLoading = false 
}) => {
  if (isLoading) {
    return <CardSkeleton />;
  }

  if (playerCards.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Geen kaarten geregistreerd.
      </div>
    );
  }

  // Sort by team name, then by player name
  const sortedCards = [...playerCards].sort((a, b) => {
    // First sort by team name
    const teamCompare = a.teamName.localeCompare(b.teamName, 'nl', { sensitivity: 'base' });
    if (teamCompare !== 0) return teamCompare;
    // Then sort by player name within the same team
    return a.playerName.localeCompare(b.playerName, 'nl', { sensitivity: 'base' });
  });

  return (
    <div className="space-y-2" role="region" aria-label="Kaarten lijst">
      {sortedCards.map((card) => (
        <PlayerCardCard
          key={card.playerId}
          card={card}
          showTeam={showTeam}
        />
      ))}
    </div>
  );
});

PlayerCardsTable.displayName = 'PlayerCardsTable';
