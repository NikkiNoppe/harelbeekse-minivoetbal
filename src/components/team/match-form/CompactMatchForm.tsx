import React from "react";
import {
  MatchDataSection,
  PlayerSelectionSection,
  RefereeNotesSection,
  MatchFormActions
} from "./components";
import { RefereePenaltySection } from "./components/RefereePenaltySection";
import PenaltyShootoutModal from "./components/PenaltyShootoutModal";
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
  
  // Determine user role for late submission detection
  const userRole = isAdmin ? "admin" : isReferee ? "referee" : "player_manager";

  const [currentMatch, setCurrentMatch] = React.useState<MatchFormData>(match);
  const [showPenaltyModal, setShowPenaltyModal] = React.useState(false);
  const [pendingSubmission, setPendingSubmission] = React.useState<MatchFormData | null>(null);

  const canEdit = !currentMatch.isLocked || isAdmin;
  const showRefereeFields = isReferee || isAdmin;
  const isCupMatch = currentMatch.matchday?.includes('🏆');

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

    // Check for draw in cup matches
    if (isCupMatch && parsedHomeScore !== null && parsedAwayScore !== null && parsedHomeScore === parsedAwayScore) {
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
      
      setPendingSubmission(updatedMatch);
      setShowPenaltyModal(true);
      return;
    }

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

      const result = await submitMatchForm(updatedMatch, isAdmin, userRole);

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

  const handlePenaltyResult = async (winner: 'home' | 'away', homePenalties: number, awayPenalties: number, notes: string) => {
    if (!pendingSubmission) return;

    setIsSubmitting(true);
    
    try {
      // Add +1 to the winning team's regular score
      const updatedHomeScore = winner === 'home' ? (pendingSubmission.homeScore || 0) + 1 : pendingSubmission.homeScore;
      const updatedAwayScore = winner === 'away' ? (pendingSubmission.awayScore || 0) + 1 : pendingSubmission.awayScore;
      
      const finalMatch: MatchFormData = {
        ...pendingSubmission,
        homeScore: updatedHomeScore,
        awayScore: updatedAwayScore,
        refereeNotes: `${pendingSubmission.refereeNotes || ''}${pendingSubmission.refereeNotes ? '\n\n' : ''}${notes}`
      };

      const result = await submitMatchForm(finalMatch, isAdmin, userRole);

      if (result.success) {
        if (isReferee && !currentMatch.isLocked) {
          await lockMatch(currentMatch.matchId);
        }
        
        onComplete();
      }
    } catch (error) {
      console.error('Error submitting match form with penalties:', error);
    } finally {
      setIsSubmitting(false);
      setPendingSubmission(null);
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

      <PenaltyShootoutModal
        open={showPenaltyModal}
        onOpenChange={setShowPenaltyModal}
        homeTeamName={currentMatch.homeTeamName}
        awayTeamName={currentMatch.awayTeamName}
        onPenaltyResult={handlePenaltyResult}
      />
    </div>
  );
};

export default CompactMatchForm;
