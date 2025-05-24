
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { CalendarIcon, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import PlayerSelectionForm from "./PlayerSelectionForm";
import NextMatchSuggestion from "./match-form/NextMatchSuggestion";
import MatchesList from "./match-form/MatchesList";
import SubmittedFormsList from "./match-form/SubmittedFormsList";
import MatchFormHeader from "./match-form/MatchFormHeader";
import { fetchUpcomingMatches } from "./match-form/matchFormService";
import { MatchFormData } from "./match-form/types";

interface MatchFormTabProps {
  teamId: number;
  teamName: string;
}

const MatchFormTab: React.FC<MatchFormTabProps> = ({ teamId, teamName }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedMatchForm, setSelectedMatchForm] = useState<MatchFormData | null>(null);
  
  // Fetch upcoming matches for the team
  const { data: upcomingMatches, isLoading: loadingMatches } = useQuery({
    queryKey: ['upcomingTeamMatches', teamId],
    queryFn: () => fetchUpcomingMatches(teamId),
    onError: (error) => {
      console.error("Error fetching upcoming matches:", error);
      toast({
        title: "Fout bij ophalen wedstrijden",
        description: "Er is een probleem opgetreden bij het ophalen van de aankomende wedstrijden.",
        variant: "destructive"
      });
    }
  });

  // Function to get the next match for the team
  const getNextMatch = (): MatchFormData | null => {
    if (!upcomingMatches || upcomingMatches.length === 0) return null;
    return upcomingMatches[0]; // The first match is the next one since they're ordered by date
  };

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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Aankomende wedstrijden
          </TabsTrigger>
          <TabsTrigger value="forms" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Ingevulde formulieren
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-4">
          <NextMatchSuggestion 
            nextMatch={getNextMatch()}
            onSelectMatch={handleSelectMatch}
          />
          
          <MatchesList 
            matches={upcomingMatches || []}
            isLoading={loadingMatches}
            onSelectMatch={handleSelectMatch}
          />
        </TabsContent>

        <TabsContent value="forms" className="space-y-4 mt-4">
          <SubmittedFormsList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MatchFormTab;
