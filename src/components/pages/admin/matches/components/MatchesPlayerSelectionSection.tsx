import React, { useMemo, useCallback } from "react";
import MatchesPlayerSelectionTable from "./MatchesPlayerSelectionTable";
import MatchesCaptainSelection from "./MatchesCaptainSelection";
import { useTeamPlayers } from "./useTeamPlayers";
import { PlayerSelection, MatchFormData } from "../types/matchesFormTypes";

interface PlayerSelectionSectionProps {
  match: MatchFormData;
  homeTeamSelections: PlayerSelection[];
  awayTeamSelections: PlayerSelection[];
  onPlayerSelection: (index: number, field: keyof PlayerSelection, value: any, isHomeTeam: boolean) => void;
  onCardChange: (playerId: number, cardType: string) => void;
  playerCards: Record<number, string>;
  canEdit: boolean;
  showRefereeFields: boolean;
  teamId: number;
  isTeamManager: boolean;
}

export const PlayerSelectionSection: React.FC<PlayerSelectionSectionProps> = ({
  match,
  homeTeamSelections,
  awayTeamSelections,
  onPlayerSelection,
  onCardChange,
  playerCards,
  canEdit,
  showRefereeFields,
  teamId,
  isTeamManager,
}) => {
  // Live team player data
  const homeTeamId = match.homeTeamId;
  const awayTeamId = match.awayTeamId;
  const { data: homePlayers, isLoading: loadingHome, error: errorHome } = useTeamPlayers(homeTeamId);
  const { data: awayPlayers, isLoading: loadingAway, error: errorAway } = useTeamPlayers(awayTeamId);

  // Helper: prevent duplicate selection
  const getSelectedPlayerIds = useMemo(() => (selections: PlayerSelection[]) =>
    selections.map((sel) => sel.playerId).filter((id): id is number => id !== null), []);

  // Captain logic with better logging
  const getCurrentCaptain = useCallback((selections: PlayerSelection[]) =>
    selections.find((selection) => selection.isCaptain)?.playerId?.toString() || "no-captain", []);
  
  const handleCaptainChange = useCallback((captainPlayerId: string, isHomeTeam: boolean) => {
    const selections = isHomeTeam ? homeTeamSelections : awayTeamSelections;
    selections.forEach((selection, index) => {
      const isCaptain = captainPlayerId !== "no-captain" && selection.playerId?.toString() === captainPlayerId;
      onPlayerSelection(index, 'isCaptain', isCaptain, isHomeTeam);
    });
  }, [homeTeamSelections, awayTeamSelections, onPlayerSelection]);

  return (
    <div className="space-y-4">
      <h3 className="text-2xl text-center text-purple-light">Spelers</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <MatchesPlayerSelectionTable
              teamLabel={`${match.homeTeamName} (Thuis)`}
              selections={homeTeamSelections}
              players={homePlayers}
              loading={loadingHome}
              error={errorHome}
              selectedPlayerIds={getSelectedPlayerIds(homeTeamSelections)}
              onPlayerSelection={(index, field, value) => onPlayerSelection(index, field as keyof PlayerSelection, value, true)}
              onCardChange={onCardChange}
              playerCards={playerCards}
              canEdit={canEdit}
              showRefereeFields={showRefereeFields}
            />
            <MatchesCaptainSelection
              selections={homeTeamSelections}
              players={homePlayers}
              canEdit={canEdit}
              onChange={(val) => handleCaptainChange(val, true)}
            />
          </div>
          <div>
            <MatchesPlayerSelectionTable
              teamLabel={`${match.awayTeamName} (Uit)`}
              selections={awayTeamSelections}
              players={awayPlayers}
              loading={loadingAway}
              error={errorAway}
              selectedPlayerIds={getSelectedPlayerIds(awayTeamSelections)}
              onPlayerSelection={(index, field, value) => onPlayerSelection(index, field as keyof PlayerSelection, value, false)}
              onCardChange={onCardChange}
              playerCards={playerCards}
              canEdit={canEdit}
              showRefereeFields={showRefereeFields}
            />
            <MatchesCaptainSelection
              selections={awayTeamSelections}
              players={awayPlayers}
              canEdit={canEdit}
              onChange={(val) => handleCaptainChange(val, false)}
            />
          </div>
        </div>
    </div>
  );
};
