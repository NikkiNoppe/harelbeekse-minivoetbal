import React from "react";
import { MatchDataSection } from "./components/MatchesDataSection";
import { PlayerSelectionSection } from "./components/MatchesPlayerSelectionSection";
import { RefereeNotesSection } from "./components/MatchesRefereeNotesSection";
import { MatchFormActions } from "./components/MatchesFormActions";
import { MatchesRefereePenaltySection } from "./components/MatchesRefereePenaltySection";
import MatchesPenaltyShootoutModal from "./components/MatchesPenaltyShootoutModal";
import { MatchFormData, PlayerSelection } from "./types/matchesFormTypes";
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

  const { submitMatchForm, lockMatch } = useEnhancedMatchFormSubmission();
  const userRole = isAdmin ? "admin" : isReferee ? "referee" : "player_manager";
  const [showPenaltyModal, setShowPenaltyModal] = React.useState(false);
  const [pendingSubmission, setPendingSubmission] = React.useState<MatchFormData | null>(null);
  const canEdit = !match.isLocked || isAdmin;
  const showRefereeFields = isReferee || isAdmin;
  const isCupMatch = match.matchday?.includes('🏆');

  const handleCardChange = React.useCallback((playerId: number, cardType: string) => {
    setPlayerCards(prev => ({
      ...prev,
      [playerId]: cardType === "none" ? "" : cardType
    }));
  }, [setPlayerCards]);

  const handlePlayerSelection = React.useCallback((
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
  }, [setHomeTeamSelections, setAwayTeamSelections, setPlayerCards]);

  const handleSubmit = React.useCallback(async () => {
    const parsedHomeScore = homeScore !== "" ? parseInt(homeScore) : null;
    const parsedAwayScore = awayScore !== "" ? parseInt(awayScore) : null;
    if (isCupMatch && parsedHomeScore !== null && parsedAwayScore !== null && parsedHomeScore === parsedAwayScore) {
      const updatedMatch: MatchFormData = {
        ...match,
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
        ...match,
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
        if (isReferee && !match.isLocked) {
          await lockMatch(match.matchId);
        }
        onComplete();
      }
    } catch (error) {
      console.error('Error submitting match form:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [homeScore, awayScore, isCupMatch, match, selectedReferee, refereeNotes, getHomeTeamSelectionsWithCards, getAwayTeamSelectionsWithCards, submitMatchForm, isAdmin, userRole, isReferee, lockMatch, onComplete, setIsSubmitting]);

  const handlePenaltyResult = React.useCallback(async (winner: 'home' | 'away', homePenalties: number, awayPenalties: number, notes: string) => {
    if (!pendingSubmission) return;
    setIsSubmitting(true);
    try {
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
        if (isReferee && !match.isLocked) {
          await lockMatch(match.matchId);
        }
        onComplete();
      }
    } catch (error) {
      console.error('Error submitting match form with penalties:', error);
    } finally {
      setIsSubmitting(false);
      setPendingSubmission(null);
    }
  }, [pendingSubmission, isAdmin, userRole, isReferee, match, submitMatchForm, lockMatch, onComplete, setIsSubmitting]);

  return (
    <div className="space-y-6">
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
        <>
          <RefereeNotesSection
            refereeNotes={refereeNotes}
            onRefereeNotesChange={setRefereeNotes}
            canEdit={canEdit}
          />
          <MatchesRefereePenaltySection
            match={match}
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
        isLocked={match.isLocked}
      />
      <MatchesPenaltyShootoutModal
        open={showPenaltyModal}
        onOpenChange={setShowPenaltyModal}
        homeTeamName={match.homeTeamName}
        awayTeamName={match.awayTeamName}
        onPenaltyResult={handlePenaltyResult}
      />
    </div>
  );
};

export default CompactMatchForm;
