import React, { useCallback, useMemo } from "react";
import { MatchDataSection } from "./components/MatchesDataSection";
import { PlayerSelectionSection } from "./components/MatchesPlayerSelectionSection";
import RefereeNotesSection from "./components/MatchesRefereeNotesSection";
import MatchesFormActions from "./components/MatchesFormActions";
import RefereeCardsSection from "./components/MatchesRefereeCardsSection";
import { RefereePenaltySection } from "./components/MatchesRefereePenaltySection";
import MatchesPenaltyShootoutModal from "./components/MatchesPenaltyShootoutModal";
import MatchesAdminHiddenFields from "./components/MatchesAdminHiddenFields";
import { MatchFormData, PlayerSelection } from "./types";
import { useMatchFormState } from "./hooks/useMatchFormState";
import { useEnhancedMatchFormSubmission } from "./hooks/useEnhancedMatchFormSubmission";
import { canEditMatch, canTeamManagerEdit } from "@/lib/matchLockUtils";

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

  const { submitMatchForm } = useEnhancedMatchFormSubmission();
  const [showPenaltyModal, setShowPenaltyModal] = React.useState(false);
  const [pendingSubmission, setPendingSubmission] = React.useState<MatchFormData | null>(null);
  const [homeCardsOpen, setHomeCardsOpen] = React.useState(false);
  const [awayCardsOpen, setAwayCardsOpen] = React.useState(false);

  const userRole = useMemo(() => (isAdmin ? "admin" : isReferee ? "referee" : "player_manager"), [isAdmin, isReferee]);
  const isTeamManager = useMemo(() => !isAdmin && !isReferee, [isAdmin, isReferee]);
  const canEdit = useMemo(() => canEditMatch(match.isLocked, match.date, match.time, isAdmin, isReferee), [match.isLocked, match.date, match.time, isAdmin, isReferee]);
  const showRefereeFields = useMemo(() => isReferee || isAdmin, [isReferee, isAdmin]);
  const hideInlineCardSelectors = useMemo(() => isReferee || isAdmin, [isReferee, isAdmin]);
  const isCupMatch = useMemo(() => match.matchday?.includes('🏆'), [match.matchday]);
  const canTeamManagerEditMatch = useMemo(() => 
    canTeamManagerEdit(match.isLocked, match.date, match.time, match.homeTeamId, match.awayTeamId, teamId), 
    [match.isLocked, match.date, match.time, match.homeTeamId, match.awayTeamId, teamId]
  );

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

  // State for match data fields (date, time, location, matchday)
  const [matchData, setMatchData] = React.useState({
    date: match.date,
    time: match.time,
    location: match.location,
    matchday: match.matchday || "",
  });

  // Handler for match data changes (date, time, location, matchday)
  const handleMatchDataChange = useCallback((field: string, value: string) => {
    setMatchData(prev => ({ ...prev, [field]: value }));
  }, []);

  const createUpdatedMatch = useCallback((homeScore: number | null, awayScore: number | null) => ({
    ...match,
    ...matchData, // Include updated match data fields
    homeScore,
    awayScore,
    referee: selectedReferee,
    refereeNotes,
    isCompleted: homeScore != null && awayScore != null,
    homePlayers: getHomeTeamSelectionsWithCards(),
    awayPlayers: getAwayTeamSelectionsWithCards()
  }), [match, matchData, selectedReferee, refereeNotes, getHomeTeamSelectionsWithCards, getAwayTeamSelectionsWithCards]);

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
        onComplete();
      }
    } catch (error) {
      console.error('Error submitting match form:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [homeScore, awayScore, isCupMatch, createUpdatedMatch, submitMatchForm, isAdmin, userRole, isReferee, match, onComplete, setIsSubmitting]);

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
        onComplete();
      }
    } catch (error) {
      console.error('Error submitting match form with penalties:', error);
    } finally {
      setIsSubmitting(false);
      setPendingSubmission(null);
    }
  }, [pendingSubmission, isAdmin, userRole, isReferee, match, submitMatchForm, onComplete, setIsSubmitting]);

  const refereeFields = useMemo(() => showRefereeFields && (
    <>
      {/* Boetes sectie */}
      <h3 className="text-lg font-semibold text-center text-purple-dark">Boetes</h3>
      <RefereePenaltySection
        match={match}
        canEdit={canEdit}
      />
      {/* Notities sectie */}
      <h3 className="text-lg font-semibold text-center text-purple-dark">Notities</h3>
      <RefereeNotesSection
        notes={refereeNotes}
        onNotesChange={setRefereeNotes}
        canEdit={canEdit}
      />
    </>
  ), [showRefereeFields, refereeNotes, setRefereeNotes, canEdit, match]);

  return (
    <div className="space-y-6">
      {/* Hoofdtitel en teams */}
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-bold">Wedstrijdformulier</h2>
        <div className="text-sm text-muted-foreground">{match.homeTeamName} vs {match.awayTeamName}</div>
      </div>

      {/* Gegevens + Score */}
      <h3 className="text-lg font-semibold text-center text-purple-dark">Wedstrijdgegevens</h3>
      <MatchDataSection
        match={{
          ...match,
          date: matchData.date,
          time: matchData.time,
          location: matchData.location,
          matchday: matchData.matchday,
        }}
        homeScore={homeScore}
        awayScore={awayScore}
        selectedReferee={selectedReferee}
        onHomeScoreChange={setHomeScore}
        onAwayScoreChange={setAwayScore}
        onRefereeChange={setSelectedReferee}
        onMatchDataChange={handleMatchDataChange}
        canEdit={isTeamManager ? false : canEdit}
        canEditMatchData={showRefereeFields}
      />

      {/* Spelers */}
      <h3 className="text-lg font-semibold  text-center text-purple-dark">Spelers</h3>
      
      <PlayerSelectionSection
        match={match}
        homeTeamSelections={homeTeamSelections}
        awayTeamSelections={awayTeamSelections}
        onPlayerSelection={handlePlayerSelection}
        onCardChange={handleCardChange}
        playerCards={playerCards}
        canEdit={isTeamManager ? canTeamManagerEditMatch : canEdit}
        showRefereeFields={showRefereeFields}
        teamId={teamId}
        isTeamManager={isTeamManager}
      />

      {/* Kaarten - Hidden for team managers */}
      {!isTeamManager && (
        <>
          <h3 className="text-lg font-semibold  text-center text-purple-dark">Kaarten</h3>
          {showRefereeFields && (
            <RefereeCardsSection
              match={match}
              homeSelections={homeTeamSelections}
              awaySelections={awayTeamSelections}
              onCardChange={handleCardChange}
              canEdit={canEdit}
            />
          )}
        </>
      )}
      
      {/* Referee fields - Hidden for team managers */}
      {!isTeamManager && refereeFields}
      
      {/* Hidden fields to preserve poll data */}
      <MatchesAdminHiddenFields match={match} />
      
      <MatchesFormActions
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        canActuallyEdit={isTeamManager ? canTeamManagerEditMatch : canEdit}
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
