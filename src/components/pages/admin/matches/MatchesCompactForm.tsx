import React, { useCallback, useMemo, useEffect, useRef, useState } from "react";
import { MatchDataSection } from "./components/MatchesDataSection";
import { MatchesScoreSection } from "./components/MatchesScoreSection";
import { PlayerSelectionSection } from "./components/MatchesPlayerSelectionSection";
import RefereeNotesSection from "./components/MatchesRefereeNotesSection";
import MatchesFormActions from "./components/MatchesFormActions";
import RefereeCardsSection from "./components/MatchesRefereeCardsSection";
import { RefereePenaltySection } from "./components/MatchesRefereePenaltySection";
import { MatchesPenaltyShootoutModal } from "@/components/modals";
import MatchesAdminHiddenFields from "./components/MatchesAdminHiddenFields";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [isKaartenOpen, setIsKaartenOpen] = useState(false);
  const [isBoetesOpen, setIsBoetesOpen] = useState(false);
  const [isNotitiesOpen, setIsNotitiesOpen] = useState(false);

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

  // Keyboard shortcut handler
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const canActuallyEdit = useMemo(() => isTeamManager ? canTeamManagerEditMatch : canEdit, [isTeamManager, canTeamManagerEditMatch, canEdit]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S or Ctrl+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (canActuallyEdit && !isSubmitting) {
          handleSubmit();
        }
      }
      // Enter key to save (when not in input/textarea)
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (canActuallyEdit && !isSubmitting) {
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canActuallyEdit, isSubmitting, handleSubmit]);

  // Focus on first score input when modal opens (only if scores are empty)
  useEffect(() => {
    const timer = setTimeout(() => {
      const firstScoreInput = document.getElementById('home-score');
      if (firstScoreInput && canActuallyEdit && !homeScore && !awayScore) {
        firstScoreInput.focus();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [canActuallyEdit, homeScore, awayScore]);

  const refereeFields = useMemo(() => showRefereeFields && (
    <>
      {/* Boetes sectie */}
      <Collapsible open={isBoetesOpen} onOpenChange={setIsBoetesOpen}>
        <Card className="bg-card border-border">
          <CollapsibleTrigger asChild>
            <CardHeader className="text-sm font-semibold bg-white hover:bg-[var(--color-50)] px-4 py-3 rounded-lg border border-[var(--color-400)] shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer data-[state=open]:bg-[var(--color-100)] data-[state=open]:text-[var(--color-900)]" style={{ color: 'var(--color-700)' }}>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  Boetes
                </CardTitle>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    isBoetesOpen && "transform rotate-180"
                  )}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-[var(--color-200)]">
            <CardContent className="pt-4">
              <RefereePenaltySection
                match={match}
                canEdit={canEdit}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      {/* Notities sectie */}
      <Collapsible open={isNotitiesOpen} onOpenChange={setIsNotitiesOpen}>
        <Card className="bg-card border-border">
          <CollapsibleTrigger asChild>
            <CardHeader className="text-sm font-semibold bg-white hover:bg-[var(--color-50)] px-4 py-3 rounded-lg border border-[var(--color-400)] shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer data-[state=open]:bg-[var(--color-100)] data-[state=open]:text-[var(--color-900)]" style={{ color: 'var(--color-700)' }}>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  Notities
                </CardTitle>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    isNotitiesOpen && "transform rotate-180"
                  )}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-[var(--color-200)]">
            <CardContent className="pt-4">
              <RefereeNotesSection
                notes={refereeNotes}
                onNotesChange={setRefereeNotes}
                canEdit={canEdit}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </>
  ), [showRefereeFields, refereeNotes, setRefereeNotes, canEdit, match, isBoetesOpen, isNotitiesOpen]);

  return (
    <div className="space-y-6">
      {/* SCORE - PROMINENT BOVENAAN */}
      <MatchesScoreSection
        homeTeamName={match.homeTeamName}
        awayTeamName={match.awayTeamName}
        homeScore={homeScore}
        awayScore={awayScore}
        onHomeScoreChange={setHomeScore}
        onAwayScoreChange={setAwayScore}
        disabled={isTeamManager ? !canTeamManagerEditMatch : !canEdit}
      />

      {/* Basisgegevens */}
      <MatchDataSection
        match={{
          ...match,
          date: matchData.date,
          time: matchData.time,
          location: matchData.location,
          matchday: matchData.matchday,
        }}
        selectedReferee={selectedReferee}
        onRefereeChange={setSelectedReferee}
        onMatchDataChange={handleMatchDataChange}
        canEdit={isTeamManager ? false : canEdit}
        canEditMatchData={showRefereeFields}
      />

      {/* Spelers */}
      <h3 className="text-sm font-semibold text-center text-purple-dark">Spelers</h3>
      
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
        <Collapsible open={isKaartenOpen} onOpenChange={setIsKaartenOpen}>
          <Card className="bg-card border-border">
            <CollapsibleTrigger asChild>
              <CardHeader className="text-sm font-semibold bg-white hover:bg-[var(--color-50)] px-4 py-3 rounded-lg border border-[var(--color-400)] shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer data-[state=open]:bg-[var(--color-100)] data-[state=open]:text-[var(--color-900)]" style={{ color: 'var(--color-700)' }}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    Kaarten
                  </CardTitle>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      isKaartenOpen && "transform rotate-180"
                    )}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t border-[var(--color-200)]">
              <CardContent className="pt-4">
                {showRefereeFields && (
                  <RefereeCardsSection
                    match={match}
                    homeSelections={homeTeamSelections}
                    awaySelections={awayTeamSelections}
                    onCardChange={handleCardChange}
                    canEdit={canEdit}
                  />
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
      
      {/* Referee fields - Hidden for team managers */}
      {!isTeamManager && refereeFields}
      
      {/* Hidden fields to preserve poll data */}
      <MatchesAdminHiddenFields match={match} />
      
      <MatchesFormActions
        ref={submitButtonRef}
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
