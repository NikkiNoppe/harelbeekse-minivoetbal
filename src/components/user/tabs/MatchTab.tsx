
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardEdit, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Import the refactored components
import { MatchFormData, PastMatch } from "@/components/match/types";
import { EditMatchTabContent } from "@/components/match/EditMatchTabContent";
import { PastMatchesTabContent } from "@/components/match/PastMatchesTabContent";
import { fetchMatches } from "@/components/match/matchService";

const MatchTab: React.FC = () => {
  const [pastMatches, setPastMatches] = useState<PastMatch[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchFormData[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchFormData | null>(null);

  // Fetch all matches from Supabase
  const { isLoading } = useQuery({
    queryKey: ['allMatches'],
    queryFn: async () => {
      const result = await fetchMatches();
      setPastMatches(result.past);
      setUpcomingMatches(result.upcoming);
      return result;
    }
  });

  const handleSaveMatch = (matchData: MatchFormData) => {
    console.log("Match saved:", matchData);
    
    // In a real app, we would update our backend
    // For now, we'll just update our local state
    
    if (matchData.homeScore !== undefined && matchData.awayScore !== undefined) {
      // This is a completed match, add to past matches
      if (matchData.id) {
        // Update existing past match
        setPastMatches(prev => prev.map(match => 
          match.id === matchData.id 
            ? { 
                ...match, 
                homeScore: matchData.homeScore || 0,
                awayScore: matchData.awayScore || 0,
                referee: matchData.referee || match.referee,
                uniqueNumber: matchData.uniqueNumber
              } 
            : match
        ));
        
        // Remove from upcoming matches if it was there
        setUpcomingMatches(prev => prev.filter(match => match.id !== matchData.id));
      } else {
        // Add new past match
        const newId = Math.max(0, ...pastMatches.map(m => m.id)) + 1;
        setPastMatches(prev => [...prev, {
          id: newId,
          date: matchData.date,
          homeTeam: matchData.homeTeam,
          awayTeam: matchData.awayTeam,
          homeScore: matchData.homeScore || 0,
          awayScore: matchData.awayScore || 0,
          location: matchData.location,
          referee: matchData.referee || "Onbekend",
          uniqueNumber: matchData.uniqueNumber
        }]);
      }
    } else {
      // This is an upcoming match
      if (matchData.id) {
        // Update existing upcoming match
        setUpcomingMatches(prev => prev.map(match => 
          match.id === matchData.id ? matchData : match
        ));
      } else {
        // Add new upcoming match
        const newId = Math.max(
          0, 
          ...pastMatches.map(m => m.id),
          ...upcomingMatches.map(m => m.id || 0)
        ) + 1;
        setUpcomingMatches(prev => [...prev, {
          ...matchData,
          id: newId
        }]);
      }
    }
    
    setSelectedMatch(null);
  };

  const handleEditMatch = (match: MatchFormData) => {
    setSelectedMatch(match);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="new-match">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-match" className="flex items-center gap-2">
            <ClipboardEdit className="h-4 w-4" />
            Nieuw wedstrijdformulier
          </TabsTrigger>
          <TabsTrigger value="past-matches" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Afgelopen wedstrijden
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="new-match" className="mt-4 space-y-4">
          <EditMatchTabContent 
            isLoading={isLoading}
            upcomingMatches={upcomingMatches}
            selectedMatch={selectedMatch}
            onSaveMatch={handleSaveMatch}
            onEditMatch={handleEditMatch}
            onCancelEdit={() => setSelectedMatch(null)}
          />
        </TabsContent>
        
        <TabsContent value="past-matches" className="mt-4">
          <PastMatchesTabContent 
            isLoading={isLoading}
            pastMatches={pastMatches}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MatchTab;
