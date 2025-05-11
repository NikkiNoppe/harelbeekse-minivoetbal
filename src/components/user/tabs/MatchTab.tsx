
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage, FormMenuItem, EditMatchForm, PastMatchesList } from "@/components/match/MatchComponents";
import { ClipboardEdit, Clock } from "lucide-react";

// Example match types for the different components
export interface MatchFormData {
  id?: number;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  location: string;
  homeScore?: number | null;
  awayScore?: number | null;
  referee?: string;
  notes?: string;
}

export interface PastMatch {
  id: number;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  location: string;
  referee: string;
}

// Mock data for past matches
const pastMatchesData: PastMatch[] = [
  {
    id: 1,
    date: "2025-05-01",
    homeTeam: "Garage Verbeke",
    awayTeam: "Shakthar Truu",
    homeScore: 3,
    awayScore: 2,
    location: "Sporthal 1",
    referee: "Jan Janssens"
  },
  {
    id: 2,
    date: "2025-05-02",
    homeTeam: "De Dageraad",
    awayTeam: "De Florre",
    homeScore: 1,
    awayScore: 1,
    location: "Sporthal 2",
    referee: "Piet Pieters"
  }
];

// Mock data for upcoming matches
const upcomingMatchesData: MatchFormData[] = [
  {
    id: 3,
    date: "2025-05-15",
    time: "20:00",
    homeTeam: "Cafe De Gilde",
    awayTeam: "Bemarmi Boys",
    location: "Sporthal 1"
  },
  {
    id: 4,
    date: "2025-05-16",
    time: "20:30",
    homeTeam: "Garage Verbeke",
    awayTeam: "De Dageraad",
    location: "Sporthal 2"
  }
];

const MatchTab: React.FC = () => {
  const [pastMatches, setPastMatches] = useState<PastMatch[]>(pastMatchesData);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchFormData[]>(upcomingMatchesData);
  const [selectedMatch, setSelectedMatch] = useState<MatchFormData | null>(null);

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
                referee: matchData.referee || match.referee
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
          referee: matchData.referee || "Onbekend"
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
          <Card>
            <CardHeader>
              <CardTitle>Wedstrijdformulier</CardTitle>
              <CardDescription>
                Vul het wedstrijdformulier in voor een nieuwe of komende wedstrijd
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditMatchForm 
                initialData={selectedMatch || {
                  date: "",
                  time: "",
                  homeTeam: "",
                  awayTeam: "",
                  location: "",
                }}
                onSave={handleSaveMatch}
                onCancel={() => setSelectedMatch(null)}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Aankomende wedstrijden</CardTitle>
              <CardDescription>
                Selecteer een wedstrijd om te bewerken of een score in te voeren
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingMatches.length === 0 ? (
                  <FormMessage>Er zijn geen aankomende wedstrijden.</FormMessage>
                ) : (
                  <div className="grid gap-2">
                    {upcomingMatches.map((match) => (
                      <FormMenuItem
                        key={match.id}
                        title={`${match.homeTeam} vs ${match.awayTeam}`}
                        subtitle={`${match.date} ${match.time} - ${match.location}`}
                        onClick={() => handleEditMatch(match)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="past-matches" className="mt-4">
          <PastMatchesList matches={pastMatches} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MatchTab;
