import React from "react";
import MatchesPlayerSelectionTable from "./MatchesPlayerSelectionTable";
import { useTeamPlayersWithSuspensions } from "../hooks/useTeamPlayers";
import { PlayerSelection } from "../types";

interface OptimizedMatchesPlayerSelectionTableProps {
  teamId: number;
  matchDate: Date;
  teamLabel: string;
  selections: PlayerSelection[];
  selectedPlayerIds: (number | null)[];
  onPlayerSelection: (index: number, field: keyof PlayerSelection, value: any, isHomeTeam: boolean) => void;
  onCardChange: (playerId: number, cardType: string) => void;
  playerCards: Record<number, string>;
  canEdit: boolean;
  showRefereeFields: boolean;
}

const OptimizedMatchesPlayerSelectionTable: React.FC<OptimizedMatchesPlayerSelectionTableProps> = ({
  teamId,
  matchDate,
  teamLabel,
  selections,
  selectedPlayerIds,
  onPlayerSelection,
  onCardChange,
  playerCards,
  canEdit,
  showRefereeFields,
}) => {
  // Use the enhanced hook that preloads suspension data in batch
  const { playersWithSuspensions, loading, error, suspensionLoading, retryCount, refetch } = useTeamPlayersWithSuspensions(teamId, matchDate);

  return (
    <MatchesPlayerSelectionTable
      teamLabel={teamLabel}
      selections={selections}
      players={playersWithSuspensions}
      loading={loading || suspensionLoading}
      error={error}
      retryCount={retryCount}
      selectedPlayerIds={selectedPlayerIds}
      onPlayerSelection={onPlayerSelection}
      onCardChange={onCardChange}
      playerCards={playerCards}
      canEdit={canEdit}
      showRefereeFields={showRefereeFields}
      onRefreshPlayers={refetch}
    />
  );
};

export default OptimizedMatchesPlayerSelectionTable;