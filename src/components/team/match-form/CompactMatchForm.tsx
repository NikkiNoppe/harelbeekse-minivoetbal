import React from "react";
import {
  MatchDataSection,
  PlayerSelectionSection,
  RefereeNotesSection,
  MatchFormActions
} from "./components";
import { RefereePenaltySection } from "./components/RefereePenaltySection";
import { MatchFormData, PlayerSelection } from "./types";
import { useMatchFormState } from "./hooks/useMatchFormState";
import { useEnhancedMatchFormSubmission } from "./hooks/useEnhancedMatchFormSubmission";

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

  const { submitMatchForm, lockMatch, unlockMatch } = useEnhancedMatchFormSubmission();

  const [currentMatch, setCurrentMatch] = React.useState<MatchFormData>(match);

  const canEdit = !currentMatch.isLocked || isAdmin;
  const showRefereeFields = isReferee || isAdmin;

  const handleCardChange = (playerId: number, cardType: string) => {
    setPlayerCards(prev => ({
      ...prev,
      [playerId]: cardType === "none" ? "" : cardType
    }));
  };

  const handleMatchDataChange = (field: string, value: string) => {
    setCurrentMatch(prev => ({
      ...prev,
      [field]: value
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
    const parsedHomeScore = homeScore !== "" ? parseInt(homeScore) : null;
    const parsedAwayScore = awayScore !== "" ? parseInt(awayScore) : null;

    setIsSubmitting(true);
    
    try {
      const updatedMatch: MatchFormData = {
        ...currentMatch,
        homeScore: parsedHomeScore,
        awayScore: parsedAwayScore,
        referee: selectedReferee,
        refereeNotes: refereeNotes,
        isCompleted: true,
        homePlayers: getHomeTeamSelectionsWithCards(),
        awayPlayers: getAwayTeamSelectionsWithCards()
      };

      const result = await submitMatchForm(updatedMatch, isAdmin);

      if (result.success) {
        if (isReferee && !currentMatch.isLocked) {
          await lockMatch(currentMatch.matchId);
        }
        
        onComplete();
      }
    } catch (error) {
      console.error('Error submitting match form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <MatchDataSection
        match={currentMatch}
        homeScore={homeScore}
        awayScore={awayScore}
        selectedReferee={selectedReferee}
        onHomeScoreChange={setHomeScore}
        onAwayScoreChange={setAwayScore}
        onRefereeChange={setSelectedReferee}
        onMatchDataChange={handleMatchDataChange}
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
