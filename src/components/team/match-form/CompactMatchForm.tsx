
import React from "react";
import {
  MatchHeader,
  MatchDataSection,
  PlayerSelectionSection,
  RefereeNotesSection,
  MatchFormActions
} from "./components";
import { MatchFormData, PlayerSelection } from "./types";
import { useMatchFormState } from "./hooks/useMatchFormState";
import { useMatchFormSubmission } from "./hooks/useMatchFormSubmission";

// Remove teamId and isHomeTeam logic as forms are no longer split by team

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

  // New: Single match form, allow both teams to edit selections, ref w/ permissions
  const canEdit = !match.isLocked || isAdmin;
  const showRefereeFields = isReferee || isAdmin;

  const handleCardChange = (playerId: number, cardType: string) => {
    setPlayerCards(prev => ({
      ...prev,
      [playerId]: cardType === "none" ? "" : cardType
    }));
  };

  const handlePlayerSelection = (
    index: number,
    field: keyof PlayerSelection,
    value: any,
    isHomeTeam: boolean
  ) => {
    const setSelections = isHomeTeam ? setHomeTeamSelections : setAwayTeamSelections;
    setSelections(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Captain logic: only one captain per team
      if (field === "isCaptain" && value === true) {
        updated.forEach((sel, idx) => {
          if (idx !== index) updated[idx].isCaptain = false;
        });
      }
      // Player logic: clear on deselection
      if (field === "playerId" && value === null) {
        updated[index].playerName = "";
        updated[index].jerseyNumber = "";
        updated[index].isCaptain = false;
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const updatedMatch: MatchFormData = {
        ...match,
        homeScore: homeScore ? parseInt(homeScore) : undefined,
        awayScore: awayScore ? parseInt(awayScore) : undefined,
        referee: selectedReferee,
        refereeNotes: refereeNotes,
        isCompleted: true,
        isLocked: isReferee ? true : match.isLocked,
        homePlayers: homeTeamSelections,
        awayPlayers: awayTeamSelections
      };

      await updateMatchForm({
        ...updatedMatch,
        matchId: match.matchId,
      });

      if (isReferee && !match.isLocked) {
        await lockMatchForm(match.matchId);
      }

      // You may want to show a toast here
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
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
        canEditMatchData={showRefereeFields}
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
        isTeamManager={!isAdmin && !isReferee}
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
        isTeamManager={!isAdmin && !isReferee}
      />
    </div>
  );
};

export default CompactMatchForm;
