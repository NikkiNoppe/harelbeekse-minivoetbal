import React, { useMemo, useCallback, useState } from "react";
import OptimizedMatchesPlayerSelectionTable from "./OptimizedMatchesPlayerSelectionTable";
import MatchesCaptainSelection from "./MatchesCaptainSelection";
import PlayerSelectionActions from "./MatchesPlayerSelectionActions";
import { PlayerSelection, MatchFormData } from "../types";
import { useEnhancedMatchFormSubmission } from "../hooks/useEnhancedMatchFormSubmission";
import { useToast } from "@/hooks/use-toast";
import { canTeamManagerEdit } from "@/lib/matchLockUtils";

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
  const [isSubmittingPlayers, setIsSubmittingPlayers] = useState(false);
  const { submitMatchForm } = useEnhancedMatchFormSubmission();
  const { toast } = useToast();
  
  // Convert match date string to Date object for suspension checks
  const matchDate = useMemo(() => new Date(match.date), [match.date]);

  // Helper: prevent duplicate selection - memoized for performance
  const getSelectedPlayerIds = useCallback((selections: PlayerSelection[]) =>
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

  // Memoize selected player IDs for performance
  const homeSelectedPlayerIds = useMemo(() => 
    getSelectedPlayerIds(homeTeamSelections), [homeTeamSelections, getSelectedPlayerIds]);
  
  const awaySelectedPlayerIds = useMemo(() => 
    getSelectedPlayerIds(awayTeamSelections), [awayTeamSelections, getSelectedPlayerIds]);

  // Handle team-specific editing for team managers
  const canEditHome = useMemo(() => {
    if (isTeamManager) {
      return canTeamManagerEdit(match.isLocked, match.date, match.time, match.homeTeamId, match.awayTeamId, teamId) && match.homeTeamId === teamId;
    }
    return canEdit; // Non-team managers depend on canEdit (which includes time-based locking)
  }, [isTeamManager, match.isLocked, match.date, match.time, match.homeTeamId, match.awayTeamId, teamId, canEdit]);
  
  const canEditAway = useMemo(() => {
    if (isTeamManager) {
      return canTeamManagerEdit(match.isLocked, match.date, match.time, match.homeTeamId, match.awayTeamId, teamId) && match.awayTeamId === teamId;
    }
    return canEdit; // Non-team managers depend on canEdit (which includes time-based locking)
  }, [isTeamManager, match.isLocked, match.date, match.time, match.homeTeamId, match.awayTeamId, teamId, canEdit]);

  // Save players for team managers
  const handleSavePlayerSelection = useCallback(async () => {
    if (!isTeamManager || !canEdit) return;
    
    setIsSubmittingPlayers(true);
    try {
      const updatedMatch = {
        ...match,
        homePlayers: homeTeamSelections,
        awayPlayers: awayTeamSelections,
        isCompleted: false // Only updating player selection, not completing match
      };
      
      const result = await submitMatchForm(updatedMatch, false, "player_manager");
      if (result.success) {
        toast({
          title: "Spelers opgeslagen",
          description: "De spelersselectie is succesvol opgeslagen.",
        });
      }
    } catch (error) {
      console.error('Error saving player selection:', error);
      toast({
        title: "Error",
        description: "Er is een fout opgetreden bij het opslaan van de spelers.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingPlayers(false);
    }
  }, [isTeamManager, canEdit, match, homeTeamSelections, awayTeamSelections, submitMatchForm, toast]);

  return (
    <div className="space-y-4">      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Home Team */}
        <div className="rounded-md border bg-white p-3">
          <OptimizedMatchesPlayerSelectionTable
            teamId={match.homeTeamId}
            matchDate={matchDate}
            teamLabel={`${match.homeTeamName} (Thuis)`}
            selections={homeTeamSelections}
            selectedPlayerIds={homeSelectedPlayerIds}
            onPlayerSelection={(index, field, value) => onPlayerSelection(index, field as keyof PlayerSelection, value, true)}
            onCardChange={onCardChange}
            playerCards={playerCards}
            canEdit={canEditHome}
            showRefereeFields={showRefereeFields}
          />
          <div className="mt-3">
            <MatchesCaptainSelection
            selections={homeTeamSelections}
            onCaptainChange={(playerId) => handleCaptainChange(playerId?.toString() || "no-captain", true)}
            canEdit={canEditHome}
            teamLabel={`${match.homeTeamName} (Thuis)`}
            />
          </div>
        </div>
        
        {/* Away Team */}
        <div className="rounded-md border bg-white p-3">
          <OptimizedMatchesPlayerSelectionTable
            teamId={match.awayTeamId}
            matchDate={matchDate}
            teamLabel={`${match.awayTeamName} (Uit)`}
            selections={awayTeamSelections}
            selectedPlayerIds={awaySelectedPlayerIds}
            onPlayerSelection={(index, field, value) => onPlayerSelection(index, field as keyof PlayerSelection, value, false)}
            onCardChange={onCardChange}
            playerCards={playerCards}
            canEdit={canEditAway}
            showRefereeFields={showRefereeFields}
          />
          <div className="mt-3">
            <MatchesCaptainSelection
            selections={awayTeamSelections}
            onCaptainChange={(playerId) => handleCaptainChange(playerId?.toString() || "no-captain", false)}
            canEdit={canEditAway}
            teamLabel={`${match.awayTeamName} (Uit)`}
            />
          </div>
        </div>
      </div>
      
      {/* Save button for team managers */}
      <PlayerSelectionActions
        onSavePlayerSelection={handleSavePlayerSelection}
        isSubmittingPlayers={isSubmittingPlayers}
        canEdit={canEdit}
        isTeamManager={isTeamManager}
      />
    </div>
  );
};

export default React.memo(PlayerSelectionSection);
