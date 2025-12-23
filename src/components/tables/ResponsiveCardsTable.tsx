
import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import ResponsiveTable, { TableColumn } from "./ResponsiveTable";

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
  sticky?: boolean;
  onPlayerClick?: (summary: PlayerCardSummary) => void;
}

const ResponsiveCardsTable: React.FC<ResponsiveCardsTableProps> = ({ 
  playerSummaries, 
  sticky = true,
  onPlayerClick 
}) => {
  const columns: TableColumn<PlayerCardSummary>[] = [
    {
      key: "playerName",
      header: "Speler",
      accessor: (summary) => <span className="font-medium">{summary.playerName}</span>,
      className: "min-w-[120px]",
      mobilePriority: "primary",
      mobileLabel: "Speler",
    },
    {
      key: "teamName",
      header: "Team",
      accessor: (summary) => summary.teamName,
      className: "min-w-[120px]",
      mobilePriority: "primary",
      mobileLabel: "Team",
    },
    {
      key: "status",
      header: "Status",
      accessor: (summary) =>
        summary.isSuspended ? (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit mx-auto">
            <AlertTriangle className="h-3 w-3" />
            Geschorst
          </Badge>
        ) : (
          <Badge variant="outline" className="w-fit mx-auto">Actief</Badge>
        ),
      className: "text-center w-24",
      mobilePriority: "primary",
      mobileLabel: "Status",
    },
    {
      key: "totalCards",
      header: "Tot",
      accessor: (summary) => <span className="font-bold">{summary.totalCards}</span>,
      className: "text-center w-20",
      mobilePriority: "primary",
      mobileLabel: "Totaal kaarten",
    },
    {
      key: "yellowCards",
      header: "Geel",
      accessor: (summary) =>
        summary.yellowCards > 0 ? (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            {summary.yellowCards}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
      className: "text-center w-24",
      mobilePriority: "secondary",
      mobileLabel: "Gele kaarten",
    },
    {
      key: "redCards",
      header: "Rood",
      accessor: (summary) =>
        summary.redCards > 0 ? (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            {summary.redCards}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
      className: "text-center w-24",
      mobilePriority: "secondary",
      mobileLabel: "Rode kaarten",
    },
    {
      key: "lastCard",
      header: "Laatste",
      accessor: (summary) =>
        summary.cards.length > 0 ? (
          <div className="text-small">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  summary.cards[0].cardType === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
              ></div>
              <span>{summary.cards[0].matchDate}</span>
              <Badge variant="outline" className="text-xs">
                {summary.cards[0].uniqueNumber}
              </Badge>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
      className: "min-w-[120px]",
      mobilePriority: "secondary",
      mobileLabel: "Laatste kaart",
    },
  ];

  return (
    <div className="responsive-cards-table">
      <ResponsiveTable
        data={playerSummaries}
        columns={columns}
        keyExtractor={(summary) => `${summary.playerId}-${summary.playerName}`}
        emptyMessage="Geen kaarten gevonden met de huidige filters"
        onRowClick={onPlayerClick}
        ariaLabel="Kaarten overzicht"
      />
    </div>
  );
};

export default ResponsiveCardsTable;
