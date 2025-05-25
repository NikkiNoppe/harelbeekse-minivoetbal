
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MatchFormData } from "./types";
import { updateMatchForm, lockMatchForm } from "./matchFormService";
import { Save } from "lucide-react";
import { 
  MatchHeader, 
  MatchDataSection, 
  PlayerSelectionSection, 
  RefereeNotesSection,
  PlayerSelection 
} from "./components";

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
  const { toast } = useToast();
  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() || "");
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() || "");
  const [selectedReferee, setSelectedReferee] = useState(match.referee || "");
  const [refereeNotes, setRefereeNotes] = useState(match.refereeNotes || "");
  const [playerCards, setPlayerCards] = useState<Record<number, string>>({});
  
  // Initialize 8 empty player selection slots
  const [homeTeamSelections, setHomeTeamSelections] = useState<PlayerSelection[]>(
    Array.from({ length: 8 }, () => ({
      playerId: null,
      playerName: "",
      jerseyNumber: "",
      isCaptain: false
    }))
  );
  
  const [awayTeamSelections, setAwayTeamSelections] = useState<PlayerSelection[]>(
    Array.from({ length: 8 }, () => ({
      playerId: null,
      playerName: "",
      jerseyNumber: "",
      isCaptain: false
    }))
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handlePlayerSelection = (index: number, field: keyof PlayerSelection, value: any, isHomeTeam: boolean) => {
    const setSelections = isHomeTeam ? setHomeTeamSelections : setAwayTeamSelections;
    
    setSelections(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // If setting captain to true, unset all other captains in this team
      if (field === 'isCaptain' && value === true) {
        updated.forEach((selection, i) => {
          if (i !== index) {
            updated[i].isCaptain = false;
          }
        });
      }
      
      // If selecting a player, auto-fill the name
      if (field === 'playerId' && value) {
        const allPlayers = isHomeTeam ? 
          (match.homeTeamId in require('@/data/mockData').MOCK_TEAM_PLAYERS ? 
           require('@/data/mockData').MOCK_TEAM_PLAYERS[match.homeTeamId] : []) :
          (match.awayTeamId in require('@/data/mockData').MOCK_TEAM_PLAYERS ? 
           require('@/data/mockData').MOCK_TEAM_PLAYERS[match.awayTeamId] : []);
        const selectedPlayer = allPlayers.find((p: any) => p.player_id === value);
        if (selectedPlayer) {
          updated[index].playerName = selectedPlayer.player_name;
        }
      }
      
      return updated;
    });
  };

  const handleSubmit = async () => {
    // Validation logic based on user role
    if (isTeamManager) {
      const userSelections = teamId === match.homeTeamId ? homeTeamSelections : awayTeamSelections;
      const selectedCount = userSelections.filter(p => p.playerId !== null).length;
      
      if (selectedCount === 0) {
        toast({
          title: "Geen spelers geselecteerd",
          description: "Selecteer ten minste één speler voor het formulier.",
          variant: "destructive"
        });
        return;
      }
      
      if (selectedCount > 8) {
        toast({
          title: "Te veel spelers",
          description: "Er kunnen maximaal 8 spelers geselecteerd worden.",
          variant: "destructive"
        });
        return;
      }

      const invalidPlayers = userSelections.filter(p => 
        p.playerId !== null && (!p.jerseyNumber || p.jerseyNumber.trim() === "")
      );
      
      if (invalidPlayers.length > 0) {
        toast({
          title: "Rugnummers ontbreken",
          description: "Alle geselecteerde spelers moeten een rugnummer hebben.",
          variant: "destructive"
        });
        return;
      }

      const hasCaptain = userSelections.some(p => p.playerId !== null && p.isCaptain);
      if (selectedCount > 0 && !hasCaptain) {
        toast({
          title: "Kapitein ontbreekt",
          description: "Selecteer een kapitein voor je team.",
          variant: "destructive"
        });
        return;
      }
    }

    if (canEditMatchData && (!homeScore || !awayScore)) {
      toast({
        title: "Fout",
        description: "Vul beide scores in",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedMatch: MatchFormData = {
        ...match,
        homeScore: canEditMatchData ? parseInt(homeScore) : match.homeScore,
        awayScore: canEditMatchData ? parseInt(awayScore) : match.awayScore,
        referee: selectedReferee,
        refereeNotes,
        isCompleted: canEditMatchData ? true : match.isCompleted,
        playersSubmitted: isTeamManager ? true : match.playersSubmitted
      };

      await updateMatchForm(updatedMatch);
      
      if (isReferee && !match.isLocked) {
        await lockMatchForm(match.matchId);
        updatedMatch.isLocked = true;
      }
      
      toast({
        title: isReferee ? "Formulier vergrendeld" : "Opgeslagen",
        description: isReferee 
          ? "Het wedstrijdformulier is definitief afgesloten."
          : isTeamManager 
            ? "De spelersselectie is opgeslagen."
            : "De wijzigingen zijn opgeslagen."
      });
      
      onComplete();
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan.",
        variant: "destructive"
      });
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

      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !canEdit}
          className="flex items-center gap-2 px-8"
        >
          <Save className="h-4 w-4" />
          {isReferee ? "Bevestigen & Vergrendelen" : 
           isTeamManager ? "Spelers opslaan" : "Opslaan"}
        </Button>
      </div>
    </div>
  );
};

export default CompactMatchForm;
