import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Badge } from "@shared/components/ui/badge";
import { toast } from "@shared/hooks/use-toast";
import { User } from "@shared/types/auth";
import { MatchFormData } from "./types";
import { PlayerSelection } from "./components/types";
import { TeamPlayer } from "./components/useTeamPlayers";
import { 
  MatchHeader,
  MatchDataSection,
  AdminMatchDataSection,
  PlayerSelectionSection,
  RefereeNotesSection,
  MatchFormActions,
  RefereePenaltySection
} from "./components";

interface CompactMatchFormProps {
  teamId: number;
}

const CompactMatchForm: React.FC<CompactMatchFormProps> = ({ teamId }) => {
  const [match, setMatch] = useState<MatchFormData | null>(null);
  const [homeTeamSelections, setHomeTeamSelections] = useState<PlayerSelection[]>([]);
  const [awayTeamSelections, setAwayTeamSelections] = useState<PlayerSelection[]>([]);
  const [homePlayers, setHomePlayers] = useState<TeamPlayer[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<TeamPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  const isTeamManager = true; // Mock value
  const isReferee = false; // Mock value  
  const isAdmin = false; // Mock value
  const canEdit = true; // Mock value

  useEffect(() => {
    // Mock match data loading
    const mockMatch: MatchFormData = {
      matchId: 1,
      uniqueNumber: "M001",
      date: "2024-01-15",
      time: "14:00",
      homeTeamId: 1,
      homeTeamName: "Team A",
      awayTeamId: 2,
      awayTeamName: "Team B",
      location: "Main Stadium",
      matchday: "Week 1",
      isCompleted: false,
      isLocked: false,
      homePlayers: [],
      awayPlayers: []
    };
    
    setMatch(mockMatch);
    setLoading(false);
  }, [teamId]);

  const handleMatchUpdate = async (matchId: number, updates: Partial<MatchFormData>) => {
    console.log("Updating match:", matchId, updates);
    toast({
      title: "Match updated successfully",
    });
  };

  const handlePlayerSelection = (index: number, field: keyof PlayerSelection, value: any, isHomeTeam: boolean) => {
    console.log("Player selection:", { index, field, value, isHomeTeam });
  };

  const handleSubmit = () => {
    console.log("Form submitted");
    toast({
      title: "Form submitted successfully",
    });
  };

  if (loading) {
    return <div>Loading match form...</div>;
  }

  if (!match) {
    return <div>No match data available</div>;
  }

  return (
    <div className="space-y-6">
      <MatchHeader match={match} />

      <MatchDataSection 
        match={match}
        homeScore=""
        awayScore=""
        selectedReferee=""
        onHomeScoreChange={() => {}}
        onAwayScoreChange={() => {}}
        onRefereeChange={() => {}}
        canEdit={canEdit}
      />

      {isAdmin && (
        <AdminMatchDataSection
          match={match}
          onMatchUpdate={handleMatchUpdate}
          canEdit={canEdit}
          isSaving={false}
          onLockToggle={() => console.log("Toggle lock")}
        />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <PlayerSelectionSection
          teamId={match.homeTeamId}
          teamName={match.homeTeamName}
          players={homePlayers}
          selectedPlayers={homeTeamSelections}
          onPlayerSelect={() => {}}
          onPlayerRemove={() => {}}
          onJerseyNumberChange={() => {}}
          onCaptainSelect={() => {}}
          canEdit={canEdit}
          isLocked={match.isLocked}
        />

        <PlayerSelectionSection
          teamId={match.awayTeamId}
          teamName={match.awayTeamName}
          players={awayPlayers}
          selectedPlayers={awayTeamSelections}
          onPlayerSelect={() => {}}
          onPlayerRemove={() => {}}
          onJerseyNumberChange={() => {}}
          onCaptainSelect={() => {}}
          canEdit={canEdit}
          isLocked={match.isLocked}
        />
      </div>

      <RefereeNotesSection
        notes=""
        onNotesChange={() => {}}
        canEdit={canEdit}
      />

      <MatchFormActions
        onSubmit={handleSubmit}
        isSubmitting={false}
        canEdit={canEdit}
        isReferee={isReferee}
        isTeamManager={isTeamManager}
        isAdmin={isAdmin}
        isLocked={match.isLocked}
      />
    </div>
  );
};

export default CompactMatchForm;
