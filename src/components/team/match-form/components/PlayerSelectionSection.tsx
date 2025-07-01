import React from "react";
import PlayerSelectionTable from "./PlayerSelectionTable";
import CaptainSelection from "./CaptainSelection";
import { useTeamPlayers } from "./useTeamPlayers";
import { PlayerSelection, MatchFormData } from "../types";

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
  const getSelectedPlayerIds = (selections: PlayerSelection[]) =>
    selections.map((sel) => sel.playerId).filter((id): id is number => id !== null);

  // Captain logic with better logging
  const getCurrentCaptain = (selections: PlayerSelection[]) =>
    selections.find((selection) => selection.isCaptain)?.playerId?.toString() || "no-captain";
  
  const handleCaptainChange = (captainPlayerId: string, isHomeTeam: boolean) => {
    console.log('Captain change triggered:', { captainPlayerId, isHomeTeam });
    const selections = isHomeTeam ? homeTeamSelections : awayTeamSelections;
    selections.forEach((selection, index) => {
      const isCaptain = captainPlayerId !== "no-captain" && selection.playerId?.toString() === captainPlayerId;
      console.log('Setting captain for player:', { playerId: selection.playerId, isCaptain });
      onPlayerSelection(index, "isCaptain", isCaptain, isHomeTeam);
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-2xl text-center text-purple-light">Spelers</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <PlayerSelectionTable
              teamLabel={`${match.homeTeamName} (Thuis)`}
              selections={homeTeamSelections}
              players={homePlayers}
              loading={loadingHome}
              error={errorHome}
              selectedPlayerIds={getSelectedPlayerIds(homeTeamSelections)}
              onPlayerSelection={(index, field, value) => onPlayerSelection(index, field, value, true)}
              onCardChange={onCardChange}
              playerCards={playerCards}
              canEdit={canEdit}
              showRefereeFields={showRefereeFields}
            />
            <CaptainSelection
              selections={homeTeamSelections}
              players={homePlayers}
              canEdit={canEdit}
              onChange={(val) => handleCaptainChange(val, true)}
            />
          </div>
          <div>
            <PlayerSelectionTable
              teamLabel={`${match.awayTeamName} (Uit)`}
              selections={awayTeamSelections}
              players={awayPlayers}
              loading={loadingAway}
              error={errorAway}
              selectedPlayerIds={getSelectedPlayerIds(awayTeamSelections)}
              onPlayerSelection={(index, field, value) => onPlayerSelection(index, field, value, false)}
              onCardChange={onCardChange}
              playerCards={playerCards}
              canEdit={canEdit}
              showRefereeFields={showRefereeFields}
            />
            <CaptainSelection
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
