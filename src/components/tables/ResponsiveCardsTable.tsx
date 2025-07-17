
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface PlayerCardSummary {
  playerId: number;
  playerName: string;
  teamName: string;
  yellowCards: number;
  redCards: number;
  totalCards: number;
  isSuspended: boolean;
  suspensionReason?: string;
  cards: {
    matchDate: string;
    cardType: 'yellow' | 'red';
    uniqueNumber: string;
  }[];
}

interface ResponsiveCardsTableProps {
  playerSummaries: PlayerCardSummary[];
}

const ResponsiveCardsTable: React.FC<ResponsiveCardsTableProps> = ({ playerSummaries }) => {
  return (
    <div className="responsive-cards-table">
      <Table stickyColumns={2}>
        <TableHeader>
          <TableRow>
            <TableHead sticky stickyLeft={0} className="min-w-[120px]">
              Speler
            </TableHead>
            <TableHead sticky stickyLeft={120} className="min-w-[120px]">
              Team
            </TableHead>
            <TableHead className="text-center w-24">Geel</TableHead>
            <TableHead className="text-center w-24">Rood</TableHead>
            <TableHead className="text-center w-20">Tot</TableHead>
            <TableHead className="text-center w-24">Status</TableHead>
            <TableHead className="min-w-[120px]">Laatste</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {playerSummaries.map((summary) => (
            <TableRow key={`${summary.playerId}-${summary.playerName}`}>
              <TableCell sticky stickyLeft={0} className="font-medium min-w-[120px]">
                {summary.playerName}
              </TableCell>
              <TableCell sticky stickyLeft={120} className="min-w-[120px]">
                {summary.teamName}
              </TableCell>
              <TableCell className="text-center">
                {summary.yellowCards > 0 && (
                  <Badge variant="outline" className="bg-white text-yellow-800 border-yellow-300">
                    {summary.yellowCards}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-center">
                {summary.redCards > 0 && (
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                    {summary.redCards}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-center font-bold">
                {summary.totalCards}
              </TableCell>
              <TableCell className="text-center">
                {summary.isSuspended ? (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Geschorst
                  </Badge>
                ) : (
                  <Badge variant="outline">Actief</Badge>
                )}
              </TableCell>
              <TableCell>
                {summary.cards.length > 0 && (
                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${summary.cards[0].cardType === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                      <span>{summary.cards[0].matchDate}</span>
                      <Badge variant="outline" className="text-xs">
                        {summary.cards[0].uniqueNumber}
                      </Badge>
                    </div>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
          {playerSummaries.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                Geen kaarten gevonden met de huidige filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResponsiveCardsTable;
