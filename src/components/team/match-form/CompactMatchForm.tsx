
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
  console.log('[CompactMatchForm] RENDER START:', { 
    matchId: match.matchId, 
    isAdmin, 
    isReferee, 
    teamId,
    isLocked: match.isLocked
  });

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

  console.log('[CompactMatchForm] PERMISSIONS:', { 
    canEdit, 
    showRefereeFields, 
    isLocked: currentMatch.isLocked 
  });

  const handleMatchUpdate = (updatedMatch: MatchFormData) => {
    console.log('[CompactMatchForm] MATCH UPDATE:', { 
      oldMatchId: currentMatch.matchId, 
      newMatchId: updatedMatch.matchId 
    });
    setCurrentMatch(updatedMatch);
  };

  const handleCardChange = (playerId: number, cardType: string) => {
    console.log('[CompactMatchForm] CARD CHANGE:', { playerId, cardType });
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
    console.log('[CompactMatchForm] PLAYER SELECTION:', { 
      index, 
      field, 
      value, 
      isHomeTeam 
    });
    
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
    console.log('[CompactMatchForm] SUBMIT START:', {
      matchId: currentMatch.matchId,
      homeScore,
      awayScore,
      selectedReferee,
      isReferee,
      canEdit
    });

    setIsSubmitting(true);
    
    try {
      const updatedMatch: MatchFormData = {
        ...currentMatch,
        homeScore: homeScore ? parseInt(homeScore) : undefined,
        awayScore: awayScore ? parseInt(awayScore) : undefined,
        referee: selectedReferee,
        refereeNotes: refereeNotes,
        isCompleted: true,
        homePlayers: getHomeTeamSelectionsWithCards(),
        awayPlayers: getAwayTeamSelectionsWithCards()
      };

      console.log('[CompactMatchForm] CALLING submitMatchForm:', {
        matchId: updatedMatch.matchId,
        hasHomeScore: updatedMatch.homeScore !== undefined,
        hasAwayScore: updatedMatch.awayScore !== undefined,
        homePlayersCount: updatedMatch.homePlayers?.length || 0,
        awayPlayersCount: updatedMatch.awayPlayers?.length || 0
      });

      const result = await submitMatchForm(updatedMatch);
      
      console.log('[CompactMatchForm] submitMatchForm RESULT:', result);

      if (result.success) {
        if (isReferee && !currentMatch.isLocked) {
          console.log('[CompactMatchForm] LOCKING MATCH for referee:', currentMatch.matchId);
          const lockResult = await lockMatch(currentMatch.matchId);
          console.log('[CompactMatchForm] LOCK RESULT:', lockResult);
        }
        
        console.log('[CompactMatchForm] CALLING onComplete');
        onComplete();
      }
    } catch (error) {
      console.error('[CompactMatchForm] SUBMIT ERROR:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log('[CompactMatchForm] RENDER END');

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
