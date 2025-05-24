
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import PlayerSelectionForm from "./PlayerSelectionForm";
import MatchFormHeader from "./match-form/MatchFormHeader";
import { fetchUpcomingMatches } from "./match-form/matchFormService";
import { MatchFormData } from "./match-form/types";
import MatchFormFilter from "./match-form/MatchFormFilter";
import MatchFormList from "./match-form/MatchFormList";

interface MatchFormTabProps {
  teamId: number;
  teamName: string;
}

const MatchFormTab: React.FC<MatchFormTabProps> = ({ teamId, teamName }) => {
  const { toast } = useToast();
  const [selectedMatchForm, setSelectedMatchForm] = useState<MatchFormData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  
  // Fetch upcoming matches for the team
  const { data: upcomingMatches, isLoading: loadingMatches } = useQuery({
    queryKey: ['upcomingTeamMatches', teamId],
    queryFn: () => fetchUpcomingMatches(teamId)
  });

  // Handle the selection of a match for the form
  const handleSelectMatch = (match: MatchFormData) => {
    setSelectedMatchForm(match);
  };

  // If a match form is selected, render the player selection form
  if (selectedMatchForm) {
    return (
      <div className="space-y-4">
        <MatchFormHeader 
          selectedMatch={selectedMatchForm}
          onBackToOverview={() => setSelectedMatchForm(null)}
        />
        
        <Card>
          <CardContent className="pt-6">
            <PlayerSelectionForm
              matchId={selectedMatchForm.matchId}
              teamId={teamId}
              teamName={teamName}
              isHomeTeam={selectedMatchForm.isHomeTeam}
              onComplete={() => setSelectedMatchForm(null)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-medium mb-4">Wedstrijdformulieren</h2>
        
        <MatchFormFilter 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          dateFilter={dateFilter}
          onDateChange={setDateFilter}
          locationFilter={locationFilter}
          onLocationChange={setLocationFilter}
        />
        
        <MatchFormList 
          matches={upcomingMatches || []}
          isLoading={loadingMatches}
          onSelectMatch={handleSelectMatch}
          searchTerm={searchTerm}
          dateFilter={dateFilter}
          locationFilter={locationFilter}
        />
      </div>
    </div>
  );
};

export default MatchFormTab;
