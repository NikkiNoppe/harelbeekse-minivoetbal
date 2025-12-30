import React, { memo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { SuspensionBadge } from "./SuspensionBadge";
import type { PlayerCard } from "@/domains/cards-suspensions";

interface PlayerCardsTableProps {
  playerCards: PlayerCard[];
  showTeam?: boolean;
  isLoading?: boolean;
}

const TableSkeleton = memo(() => (
  <Table>
    <TableHeader>
      <TableRow className="table-header-row">
        <TableHead>Speler</TableHead>
        <TableHead>Team</TableHead>
        <TableHead className="text-center">Geel</TableHead>
        <TableHead className="text-center">Rood</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-6 w-8 mx-auto" /></TableCell>
          <TableCell><Skeleton className="h-6 w-8 mx-auto" /></TableCell>
          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
));

TableSkeleton.displayName = 'PlayerCardsTableSkeleton';

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

export const PlayerCardsTable: React.FC<PlayerCardsTableProps> = memo(({ 
  playerCards, 
  showTeam = true,
  isLoading = false 
}) => {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (playerCards.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Geen kaarten geregistreerd.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="table-header-row">
            <TableHead>Speler</TableHead>
            {showTeam && <TableHead>Team</TableHead>}
            <TableHead className="text-center">Geel</TableHead>
            <TableHead className="text-center">Rood</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {playerCards.map((card) => (
            <TableRow key={card.playerId}>
              <TableCell className="font-medium">{card.playerName}</TableCell>
              {showTeam && <TableCell className="text-muted-foreground">{card.teamName}</TableCell>}
              <TableCell className="text-center">
                <SuspensionBadge type="yellow" count={card.yellowCards} />
              </TableCell>
              <TableCell className="text-center">
                <SuspensionBadge type="red" count={card.redCards} />
              </TableCell>
              <TableCell>{getStatusBadge(card)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

PlayerCardsTable.displayName = 'PlayerCardsTable';
