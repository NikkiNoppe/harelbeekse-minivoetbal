import React, { useCallback, useMemo } from "react";
import { MatchDataSection } from "./components/MatchesDataSection";
import { PlayerSelectionSection } from "./components/MatchesPlayerSelectionSection";
import MatchesRefereeNotesSection from "./components/MatchesRefereeNotesSection";
import MatchesFormActions from "./components/MatchesFormActions";
import { MatchesRefereePenaltySection } from "./components/MatchesRefereePenaltySection";
import MatchesPenaltyShootoutModal from "./components/MatchesPenaltyShootoutModal";
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

  const { submitMatchForm, lockMatch } = useEnhancedMatchFormSubmission();
  const [showPenaltyModal, setShowPenaltyModal] = React.useState(false);
  const [pendingSubmission, setPendingSubmission] = React.useState<MatchFormData | null>(null);

  const userRole = isAdmin ? "admin" : isReferee ? "referee" : "player_manager";
  const canEdit = !match.isLocked || isAdmin;
  const showRefereeFields = isReferee || isAdmin;
  const isCupMatch = match.matchday?.includes('🏆');

  const handleCardChange = useCallback((playerId: number, cardType: string) => {
    setPlayerCards(prev => ({
      ...prev,
      [playerId]: cardType === "none" ? "" : cardType
    }));
  }, [setPlayerCards]);

  const updatePlayerSelection = useCallback((
    selections: PlayerSelection[],
    setSelections: React.Dispatch<React.SetStateAction<PlayerSelection[]>>,
    index: number,
    field: keyof PlayerSelection,
    value: any
  ) => {
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
  }, [setPlayerCards]);

  const handlePlayerSelection = useCallback((
    index: number,
    field: keyof PlayerSelection,
    value: any,
    isHomeTeam: boolean
  ) => {
    const setSelections = isHomeTeam ? setHomeTeamSelections : setAwayTeamSelections;
    const selections = isHomeTeam ? homeTeamSelections : awayTeamSelections;
    updatePlayerSelection(selections, setSelections, index, field, value);
  }, [homeTeamSelections, awayTeamSelections, setHomeTeamSelections, setAwayTeamSelections, updatePlayerSelection]);

  const createUpdatedMatch = useCallback((homeScore: number | null, awayScore: number | null) => ({
    ...match,
    homeScore,
    awayScore,
    referee: selectedReferee,
    refereeNotes,
    isCompleted: true,
    homePlayers: getHomeTeamSelectionsWithCards(),
    awayPlayers: getAwayTeamSelectionsWithCards()
  }), [match, selectedReferee, refereeNotes, getHomeTeamSelectionsWithCards, getAwayTeamSelectionsWithCards]);

  const handleSubmit = useCallback(async () => {
    const parsedHomeScore = homeScore !== "" ? parseInt(homeScore) : null;
    const parsedAwayScore = awayScore !== "" ? parseInt(awayScore) : null;
    
    if (isCupMatch && parsedHomeScore !== null && parsedAwayScore !== null && parsedHomeScore === parsedAwayScore) {
      const updatedMatch = createUpdatedMatch(parsedHomeScore, parsedAwayScore);
      setPendingSubmission(updatedMatch);
      setShowPenaltyModal(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const updatedMatch = createUpdatedMatch(parsedHomeScore, parsedAwayScore);
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
  }, [homeScore, awayScore, isCupMatch, createUpdatedMatch, submitMatchForm, isAdmin, userRole, isReferee, lockMatch, match, onComplete, setIsSubmitting]);

  const handlePenaltyResult = useCallback(async (winner: 'home' | 'away', homePenalties: number, awayPenalties: number, notes: string) => {
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

  const refereeFields = useMemo(() => showRefereeFields && (
    <>
      <MatchesRefereeNotesSection
        notes={refereeNotes}
        onNotesChange={setRefereeNotes}
        canEdit={canEdit}
      />
      <MatchesRefereePenaltySection
        match={match}
        canEdit={canEdit}
      />
    </>
  ), [showRefereeFields, refereeNotes, setRefereeNotes, canEdit, match]);

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
      
      {refereeFields}
      
      <MatchesFormActions
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        canActuallyEdit={canEdit}
        isAdmin={isAdmin}
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
