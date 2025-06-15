import React from "react";
import { 
  MatchHeader, 
  MatchDataSection, 
  PlayerSelectionSection, 
  RefereeNotesSection,
  MatchFormActions
} from "./components";
import { MatchFormData } from "./types";
import { useMatchFormState } from "./hooks/useMatchFormState";
import { usePlayerSelectionHandler } from "./hooks/usePlayerSelectionHandler";
import { useMatchFormSubmission } from "./hooks/useMatchFormSubmission";

interface CompactMatchFormProps {
  match: MatchFormData;
  onComplete: () => void;
  isAdmin: boolean;
  isReferee: boolean;
  teamId: number;
}

const CompactMatchForm: React.FC<CompactMatchFormProps> = ({
  match,
  onComplete,
  isAdmin,
  isReferee,
  teamId
}) => {
  const {
    homeScore,
    setHomeScore,
    awayScore,
    setAwayScore,
    selectedReferee,
    setSelectedReferee,
    refereeNotes,
    setRefereeNotes,
    playerCards,
    setPlayerCards,
    isSubmitting,
    setIsSubmitting,
    homeTeamSelections,
    setHomeTeamSelections,
    awayTeamSelections,
    setAwayTeamSelections
  } = useMatchFormState(match);

  const { handlePlayerSelection } = usePlayerSelectionHandler(
    match,
    homeTeamSelections,
    setHomeTeamSelections,
    awayTeamSelections,
    setAwayTeamSelections
  );

  const { handleSubmit: submitForm } = useMatchFormSubmission(match, teamId, onComplete);

  const canEdit = !match.isLocked || isAdmin;
  const showRefereeFields = isReferee || isAdmin;
  const isTeamManager = !isAdmin && !isReferee;
  const canEditMatchData = isReferee || isAdmin;

  const handleCardChange = (playerId: number, cardType: string) => {
    setPlayerCards(prev => ({
      ...prev,
      [playerId]: cardType === "none" ? "" : cardType
    }));
  };

  const handleSubmit = async () => {
    await submitForm(
      homeScore,
      awayScore,
      selectedReferee,
      refereeNotes,
      homeTeamSelections,
      awayTeamSelections,
      setIsSubmitting,
      isTeamManager,
      canEditMatchData,
      isReferee
    );
  };

  return (
    <div className="space-y-6">
      <MatchHeader match={match} />

      <MatchDataSection
        match={match}
        homeScore={homeScore}
        awayScore={awayScore}
        selectedReferee={selectedReferee}
        onHomeScoreChange={setHomeScore}
        onAwayScoreChange={setAwayScore}
        onRefereeChange={setSelectedReferee}
        canEdit={canEdit}
        canEditMatchData={canEditMatchData}
      />

      <PlayerSelectionSection
        match={match}
        homeTeamSelections={homeTeamSelections}
        awayTeamSelections={awayTeamSelections}
        onPlayerSelection={handlePlayerSelection}
        onCardChange={handleCardChange}
        playerCards={playerCards}
        canEdit={canEdit}
        showRefereeFields={showRefereeFields}
        teamId={teamId}
        isTeamManager={isTeamManager}
      />

      {showRefereeFields && (
        <RefereeNotesSection
          refereeNotes={refereeNotes}
          onRefereeNotesChange={setRefereeNotes}
          canEdit={canEdit}
        />
      )}

      <MatchFormActions
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        canEdit={canEdit}
        isReferee={isReferee}
        isTeamManager={isTeamManager}
      />
    </div>
  );
};

export default CompactMatchForm;
