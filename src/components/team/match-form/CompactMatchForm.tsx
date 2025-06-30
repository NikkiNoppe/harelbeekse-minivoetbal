
import React from "react";
import {
  MatchHeader,
  MatchDataSection,
  PlayerSelectionSection,
  RefereeNotesSection,
  MatchFormActions,
  AdminMatchDataSection
} from "./components";
import { RefereePenaltySection } from "./components/RefereePenaltySection";
import { MatchFormData, PlayerSelection } from "./types";
import { useMatchFormState } from "./hooks/useMatchFormState";
import { useMatchFormSubmission } from "./hooks/useMatchFormSubmission";
import { updateMatchForm, lockMatchForm } from "./matchFormService";

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
    setAwayTeamSelections,
    getHomeTeamSelectionsWithCards,
    getAwayTeamSelectionsWithCards
  } = useMatchFormState(match);

  const [currentMatch, setCurrentMatch] = React.useState<MatchFormData>(match);

  const canEdit = !currentMatch.isLocked || isAdmin;
  const showRefereeFields = isReferee || isAdmin;

  const handleMatchUpdate = (updatedMatch: MatchFormData) => {
    setCurrentMatch(updatedMatch);
  };

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
      
      if (field === "isCaptain" && value === true) {
        updated.forEach((sel, idx) => {
          if (idx !== index) updated[idx].isCaptain = false;
        });
      }
      
      if (field === "playerId" && value === null) {
        updated[index].playerName = "";
        updated[index].jerseyNumber = "";
        updated[index].isCaptain = false;
        // Remove card data when player is deselected
        if (updated[index].playerId) {
          setPlayerCards(prev => {
            const newCards = { ...prev };
            delete newCards[updated[index].playerId!];
            return newCards;
          });
        }
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const updatedMatch: MatchFormData = {
        ...currentMatch,
        homeScore: homeScore ? parseInt(homeScore) : undefined,
        awayScore: awayScore ? parseInt(awayScore) : undefined,
        referee: selectedReferee,
        refereeNotes: refereeNotes,
        isCompleted: true,
        isLocked: isReferee ? true : currentMatch.isLocked,
        homePlayers: getHomeTeamSelectionsWithCards(),
        awayPlayers: getAwayTeamSelectionsWithCards()
      };

      await updateMatchForm({
        ...updatedMatch,
        matchId: currentMatch.matchId,
      });

      if (isReferee && !currentMatch.isLocked) {
        await lockMatchForm(currentMatch.matchId);
      }

      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <MatchHeader match={currentMatch} />

      {isAdmin && (
        <AdminMatchDataSection
          match={currentMatch}
          onMatchUpdate={handleMatchUpdate}
          canEdit={canEdit}
        />
      )}

      <MatchDataSection
        match={currentMatch}
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
        match={currentMatch}
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
        <>
          <RefereeNotesSection
            refereeNotes={refereeNotes}
            onRefereeNotesChange={setRefereeNotes}
            canEdit={canEdit}
          />
          
          <RefereePenaltySection
            match={currentMatch}
            canEdit={canEdit}
          />
        </>
      )}

      <MatchFormActions
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        canEdit={canEdit}
        isReferee={isReferee}
        isTeamManager={!isAdmin && !isReferee}
        isAdmin={isAdmin}
        isLocked={currentMatch.isLocked}
      />
    </div>
  );
};

export default CompactMatchForm;
